import { NextRequest, NextResponse } from "next/server"
import { verifyAndConsumeVipToken } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")
    const propertyId = searchParams.get("property_id")

    if (!token || !propertyId) {
      return NextResponse.json(
        { valid: false, reason: "invalid", message: "Token and property ID are required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      )
    }

    const result = await verifyAndConsumeVipToken(token, propertyId)
    return NextResponse.json(result, { headers: NO_CACHE_HEADERS })
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, reason: "invalid", message: error.message || "Verification failed" },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}
