import { NextRequest, NextResponse } from "next/server"
import { getVipShareTokens, createVipShareToken } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tokens = await getVipShareTokens(id)
    return NextResponse.json({ success: true, data: tokens }, { headers: NO_CACHE_HEADERS })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch VIP tokens" },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const { clientName, clientPhone } = body

    const tokenRecord = await createVipShareToken(id, clientName, clientPhone, 1)
    return NextResponse.json({ success: true, data: tokenRecord }, { headers: NO_CACHE_HEADERS })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create VIP token" },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}
