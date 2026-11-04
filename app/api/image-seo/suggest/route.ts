import { NextRequest, NextResponse } from "next/server"
import { generateAiImageSeoSuggestions } from "@/lib/image-seo-ai"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const context = await req.json()
    const suggestion = generateAiImageSeoSuggestions(context)
    return NextResponse.json({
      success: true,
      data: suggestion,
      message: "AI SEO & AEO drafts generated for your review. (Not saved yet)",
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

