import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/admin-auth"

export async function GET(req: NextRequest) {
  const authenticated = verifyAdminRequest(req)
  return NextResponse.json(
    { authenticated },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  )
}
