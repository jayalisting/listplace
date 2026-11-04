import { NextRequest, NextResponse } from "next/server"
import { verifyAdminPassword, generateAdminSessionToken } from "@/lib/admin-auth"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { password } = body

    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json(
        { success: false, error: "Invalid administrator credentials." },
        { status: 401 }
      )
    }

    const token = generateAdminSessionToken()

    const response = NextResponse.json({
      success: true,
      message: "Administrator session authenticated.",
      token,
    })

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: "jaya_admin_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Authentication service error." },
      { status: 500 }
    )
  }
}
