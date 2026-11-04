import { NextRequest, NextResponse } from "next/server"
import { revokeVipShareToken } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params
    const success = await revokeVipShareToken(tokenId)
    return NextResponse.json({ success }, { headers: NO_CACHE_HEADERS })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to revoke token" },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}
