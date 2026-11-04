import { NextRequest, NextResponse } from "next/server"
import { saveImageSeoRecord, getImageSeoRecord } from "@/lib/db"
import { calculateImageSeoScore } from "@/lib/image-seo-scoring"
import { createDefaultImageSeo } from "@/lib/image-seo"

export const dynamic = "force-dynamic"
export const revalidate = 0

// Simple robust CSV line parser handling quotes
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"' && (i === 0 || line[i - 1] !== "\\")) {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // Skip escaped quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

export async function POST(req: NextRequest) {
  try {
    const text = await req.text()
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Empty CSV data" }, { status: 400 })
    }

    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length < 2) {
      return NextResponse.json({ success: false, error: "CSV contains no data rows" }, { status: 400 })
    }

    // Skip header line
    const dataRows = lines.slice(1)
    let updatedCount = 0

    for (const row of dataRows) {
      const cols = parseCsvLine(row)
      if (cols.length < 2) continue

      const url = cols[0]
      if (!url) continue

      const alt = cols[1] || ""
      const isDecorative = cols[2]?.toLowerCase() === "true"
      const title = cols[3] || ""
      const caption = cols[4] || ""
      const description = cols[5] || ""
      const seoFileName = cols[6] || ""
      const focusKeyword = cols[7] || ""
      const imageType = (cols[8] || "photo") as any
      const aiDescription = cols[9] || ""
      const brand = cols[10] || "JayaListing"
      const product = cols[11] || ""
      const place = cols[12] || ""
      const topic = cols[13] || ""
      const creator = cols[14] || ""
      const credit = cols[15] || ""
      const copyright = cols[16] || ""
      const license = cols[17] || ""
      const allowIndex = cols[18]?.toLowerCase() !== "false"
      const includeInSitemap = cols[19]?.toLowerCase() !== "false"

      const existing = (await getImageSeoRecord(url)) || createDefaultImageSeo(url)

      const updated = {
        ...existing,
        url,
        alt,
        isDecorative,
        title: title || existing.title,
        caption: caption || existing.caption,
        description: description || existing.description,
        seoFileName: seoFileName || existing.seoFileName,
        focusKeyword: focusKeyword || existing.focusKeyword,
        imageType: imageType || existing.imageType,
        aiDescription: aiDescription || existing.aiDescription,
        entities: {
          brand: brand || existing.entities?.brand,
          product: product || existing.entities?.product,
          place: place || existing.entities?.place,
          topic: topic || existing.entities?.topic,
        },
        creator: creator || existing.creator,
        credit: credit || existing.credit,
        copyright: copyright || existing.copyright,
        license: license || existing.license,
        allowIndex,
        includeInSitemap,
      }

      const scoreRes = calculateImageSeoScore(updated)
      updated.score = scoreRes.totalScore

      await saveImageSeoRecord(updated)
      updatedCount++
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Successfully imported & optimized ${updatedCount} image SEO records from CSV`,
    })
  } catch (err: any) {
    console.error("Import CSV error:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

