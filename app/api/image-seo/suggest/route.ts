import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { generateAiImageSeoSuggestions } from "@/lib/image-seo-ai"

export const dynamic = "force-dynamic"
export const revalidate = 0

// In-memory cache for AI drafts keyed by SHA-256 hash of prompt context
// Avoids repeated inference/generation compute when input hasn't changed
const aiDraftCache = new Map<string, { data: any; createdAt: number }>()

export async function POST(req: NextRequest) {
  try {
    const context = await req.json().catch(() => ({}))

    // 1. Calculate input hash of context fields
    const contextPayload = JSON.stringify({
      title: context.propertyTitle || "",
      loc: context.propertyLocation || "",
      cat: context.propertyCategory || "",
      price: context.propertyPrice || "",
      type: context.imageType || "",
      file: context.existingFileName || "",
    })
    const inputHash = crypto.createHash("sha256").update(contextPayload).digest("hex").slice(0, 16)
    const etag = `W/"${inputHash}"`

    // 2. Check client ETag / If-None-Match
    const ifNoneMatch = req.headers.get("if-none-match")
    if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === inputHash)) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, "Cache-Control": "private, max-age=86400" },
      })
    }

    // 3. Check server-side memory cache
    const cached = aiDraftCache.get(inputHash)
    if (cached && Date.now() - cached.createdAt < 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        {
          success: true,
          data: cached.data,
          cached: true,
          inputHash,
          message: "AI SEO & AEO draft loaded from memory cache (zero inference compute)",
        },
        {
          headers: { ETag: etag, "Cache-Control": "private, max-age=86400" },
        }
      )
    }

    // 4. Generate AI suggestion (lean token output, focused signals)
    const suggestion = generateAiImageSeoSuggestions(context)
    aiDraftCache.set(inputHash, { data: suggestion, createdAt: Date.now() })

    // Clean up cache if it grows over 500 entries
    if (aiDraftCache.size > 500) {
      const oldestKey = aiDraftCache.keys().next().value
      if (oldestKey) aiDraftCache.delete(oldestKey)
    }

    return NextResponse.json(
      {
        success: true,
        data: suggestion,
        cached: false,
        inputHash,
        message: "AI SEO & AEO drafts generated for your review. (Not saved yet)",
      },
      {
        headers: { ETag: etag, "Cache-Control": "private, max-age=86400" },
      }
    )
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

