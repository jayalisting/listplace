import { NextRequest, NextResponse } from "next/server"
import { verifyAdminPassword, generateAdminSessionToken } from "@/lib/admin-auth"

// In-memory sliding rate limiter for admin authentication attempts
// Defends against brute-force PBKDF2 compute exhaustion (max 5 failed attempts per 15 minutes per IP)
const loginAttemptsMap = new Map<string, { attempts: number; lockUntil: number }>()

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now()
  const record = loginAttemptsMap.get(ip)

  if (!record) return { allowed: true }

  if (record.lockUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockUntil - now) / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  // Lock expired
  if (now > record.lockUntil) {
    loginAttemptsMap.delete(ip)
    return { allowed: true }
  }

  return { allowed: true }
}

function recordFailedAttempt(ip: string) {
  const now = Date.now()
  const record = loginAttemptsMap.get(ip) || { attempts: 0, lockUntil: 0 }
  record.attempts += 1

  if (record.attempts >= 5) {
    record.lockUntil = now + 15 * 60 * 1000 // 15-minute lockout
  }

  loginAttemptsMap.set(ip, record)
}

function resetAttempts(ip: string) {
  loginAttemptsMap.delete(ip)
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous"

    const rateCheck = checkRateLimit(ip)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed login attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSeconds || 60),
            "Cache-Control": "no-store",
          },
        }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { password } = body

    if (!password || !verifyAdminPassword(password)) {
      recordFailedAttempt(ip)
      return NextResponse.json(
        { success: false, error: "Invalid administrator credentials." },
        { status: 401 }
      )
    }

    // Login succeeded: reset rate limiter
    resetAttempts(ip)

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
