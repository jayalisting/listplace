import { NextRequest, NextResponse } from "next/server"
import { getAllImageSeoRecords, saveImageSeoRecord, getImageSeoRecord, pool } from "@/lib/db"
import { calculateImageSeoScore } from "@/lib/image-seo-scoring"
import { ImageSeoData, createDefaultImageSeo } from "@/lib/image-seo"

export const dynamic = "force-dynamic"
export const revalidate = 0

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
}

/**
 * GET /api/image-seo
 * Returns image SEO inventory, dashboard statistics, and supports search & filters.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const urlParam = searchParams.get("url")
    const search = searchParams.get("search")?.toLowerCase() || ""
    const filter = searchParams.get("filter") || "all" // missing_alt, missing_ai, low_score, noindex, etc.

    // If querying single URL
    if (urlParam) {
      let record = await getImageSeoRecord(urlParam)
      if (!record) {
        record = createDefaultImageSeo(urlParam)
        const scoreRes = calculateImageSeoScore(record)
        record.score = scoreRes.totalScore
      }
      return NextResponse.json({ success: true, data: record }, { headers: NO_CACHE_HEADERS })
    }

    // Load registered records
    const recordsMap = new Map<string, ImageSeoData>()
    const existing = await getAllImageSeoRecords()
    for (const rec of existing) {
      recordsMap.set(rec.url, rec)
    }

    // Also auto-discover any property images from properties table that haven't been registered yet
    try {
      const propRes = await pool.query("SELECT id, title, category, city, images FROM properties")
      for (const row of propRes.rows) {
        const imgs = Array.isArray(row.images) ? row.images : []
        for (const imgUrl of imgs) {
          if (imgUrl && typeof imgUrl === "string" && !recordsMap.has(imgUrl)) {
            const def = createDefaultImageSeo(imgUrl, {
              title: row.title,
              category: row.category,
              city: row.city,
            })
            const score = calculateImageSeoScore(def)
            def.score = score.totalScore
            recordsMap.set(imgUrl, def)
          }
        }
      }
    } catch (e) {
      console.warn("Discovery notice from properties table:", e)
    }

    let allImages = Array.from(recordsMap.values())

    // Calculate Dashboard Statistics
    const totalImages = allImages.length
    let totalScore = 0
    let missingAlt = 0
    let missingAiDesc = 0
    let missingTranscript = 0
    let missingCredit = 0
    let oversized = 0
    let noindex = 0

    for (const img of allImages) {
      const score = img.score ?? calculateImageSeoScore(img).totalScore
      totalScore += score

      if (!img.isDecorative && (!img.alt || img.alt.trim().length === 0)) missingAlt++
      if (!img.aiDescription || img.aiDescription.trim().length === 0) missingAiDesc++
      if (["infographic", "chart", "diagram", "screenshot"].includes(img.imageType || "") && (!img.transcript || img.transcript.trim().length === 0)) {
        missingTranscript++
      }
      if (!img.credit && !img.creator && !img.copyright) missingCredit++
      if ((img.fileSizeBytes || 0) > 400 * 1024) oversized++
      if (!img.allowIndex) noindex++
    }

    const avgScore = totalImages > 0 ? Math.round(totalScore / totalImages) : 100

    // Apply Filter
    if (filter === "missing_alt") {
      allImages = allImages.filter((img) => !img.isDecorative && (!img.alt || img.alt.trim().length === 0))
    } else if (filter === "missing_ai") {
      allImages = allImages.filter((img) => !img.aiDescription || img.aiDescription.trim().length === 0)
    } else if (filter === "missing_transcript") {
      allImages = allImages.filter((img) => ["infographic", "chart", "diagram", "screenshot"].includes(img.imageType || "") && (!img.transcript || img.transcript.trim().length === 0))
    } else if (filter === "missing_credit") {
      allImages = allImages.filter((img) => !img.credit && !img.creator && !img.copyright)
    } else if (filter === "low_score") {
      allImages = allImages.filter((img) => (img.score ?? 100) < 70)
    } else if (filter === "noindex") {
      allImages = allImages.filter((img) => !img.allowIndex)
    }

    // Apply Search
    if (search) {
      allImages = allImages.filter((img) => {
        const haystack = `${img.url} ${img.alt} ${img.title} ${img.seoFileName} ${img.focusKeyword} ${img.aiDescription}`.toLowerCase()
        return haystack.includes(search)
      })
    }

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalImages,
          avgScore,
          missingAlt,
          missingAiDesc,
          missingTranscript,
          missingCredit,
          oversized,
          noindex,
        },
        data: allImages,
        count: allImages.length,
      },
      { headers: NO_CACHE_HEADERS }
    )
  } catch (error: any) {
    console.error("GET /api/image-seo error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: NO_CACHE_HEADERS })
  }
}

/**
 * POST /api/image-seo
 * Save or bulk update Image SEO records. Automatically evaluates live SEO score.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Bulk update support
    if (Array.isArray(body.items)) {
      const results = []
      for (const item of body.items) {
        if (!item.url) continue
        const scoreRes = calculateImageSeoScore(item)
        item.score = scoreRes.totalScore
        const saved = await saveImageSeoRecord(item)
        results.push(saved)
      }
      return NextResponse.json(
        { success: true, count: results.length, data: results, message: `Updated ${results.length} images` },
        { headers: NO_CACHE_HEADERS }
      )
    }

    // Single item update
    const data = body as ImageSeoData
    if (!data.url) {
      return NextResponse.json({ success: false, error: "Image url is required" }, { status: 400, headers: NO_CACHE_HEADERS })
    }

    const scoreRes = calculateImageSeoScore(data)
    data.score = scoreRes.totalScore
    const saved = await saveImageSeoRecord(data)

    return NextResponse.json(
      { success: true, data: saved, scoreDetails: scoreRes, message: `SEO data saved for ${saved.seoFileName || saved.url}` },
      { headers: NO_CACHE_HEADERS }
    )
  } catch (error: any) {
    console.error("POST /api/image-seo error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: NO_CACHE_HEADERS })
  }
}

