import { NextRequest, NextResponse } from "next/server"
import { getImageSeoSettings, saveImageSeoSettings } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
}

export async function GET() {
  try {
    const settings = await getImageSeoSettings()
    return NextResponse.json({ success: true, data: settings }, { headers: NO_CACHE_HEADERS })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: NO_CACHE_HEADERS })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const updated = await saveImageSeoSettings(body)
    return NextResponse.json(
      { success: true, data: updated, message: "Global Image SEO settings updated" },
      { headers: NO_CACHE_HEADERS }
    )
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: NO_CACHE_HEADERS })
  }
}

