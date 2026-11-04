import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Administrator logged out successfully.",
  })

  // Explicitly invalidate and clear the session cookie across all paths
  response.cookies.set({
    name: "jaya_admin_session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  })

  response.cookies.delete("jaya_admin_session")

  return response
}

export async function GET() {
  return POST()
}
