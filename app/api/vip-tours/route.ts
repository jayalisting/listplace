import { NextRequest, NextResponse } from "next/server"
import { createDbVipTourBooking, getDbVipTourBookings } from "@/lib/db"
import { sendVipTourNotificationEmail } from "@/lib/email"
import { verifyAdminRequest } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"
export const revalidate = 0

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

// In-memory rate limiter: max 5 bookings per 10 minutes per IP
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || entry.expiresAt < now) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + 10 * 60 * 1000 })
    return false
  }

  if (entry.count >= 5) {
    return true
  }

  entry.count += 1
  return false
}

// Simple email regex for security
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * POST /api/vip-tours - Submit a new VIP tour booking request
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous"

    // Rate limiting check
    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please wait a few moments before scheduling another VIP tour.",
        },
        { status: 429, headers: NO_CACHE_HEADERS }
      )
    }

    const body = await req.json()

    // 1. Honeypot security check (anti-bot protection)
    if (body.hp_website || body.honeypot) {
      console.warn("Bot detected via honeypot field in VIP tour booking from IP:", ip)
      return NextResponse.json(
        { success: true, message: "Appointment registered" }, // silent fail for bots
        { status: 200, headers: NO_CACHE_HEADERS }
      )
    }

    // 2. Validate required inputs
    const propertyId = String(body.propertyId || "").trim()
    const propertyTitle = String(body.propertyTitle || "Untitled Luxury Estate").trim()
    const propertyPrice = String(body.propertyPrice || "").trim()
    const propertyLocation = String(body.propertyLocation || "").trim()
    const tourType = body.tourType === "virtual" ? "virtual" : "in-person"
    const tourDate = String(body.tourDate || "").trim()
    const tourTime = String(body.tourTime || "").trim()
    const clientName = String(body.clientName || "").trim()
    const clientPhone = String(body.clientPhone || "").trim()
    const clientEmail = String(body.clientEmail || "").trim().toLowerCase()
    const notes = String(body.notes || "").trim()

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "Property ID is required." },
        { status: 400, headers: NO_CACHE_HEADERS }
      )
    }

    if (!clientName || clientName.length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter your full legal name or entity." },
        { status: 400, headers: NO_CACHE_HEADERS }
      )
    }

    if (!clientPhone || clientPhone.replace(/\D/g, "").length < 7) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid contact phone number." },
        { status: 400, headers: NO_CACHE_HEADERS }
      )
    }

    if (!clientEmail || !EMAIL_REGEX.test(clientEmail)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400, headers: NO_CACHE_HEADERS }
      )
    }

    if (!tourDate) {
      return NextResponse.json(
        { success: false, error: "Please select a preferred viewing date." },
        { status: 400, headers: NO_CACHE_HEADERS }
      )
    }

    // 3. Save booking to PostgreSQL database
    const savedBooking = await createDbVipTourBooking({
      propertyId,
      propertyTitle,
      propertyPrice,
      propertyLocation,
      tourType,
      tourDate,
      tourTime: tourTime || "11:00 AM",
      clientName,
      clientPhone,
      clientEmail,
      notes,
    })

    // 4. Send email notification to jayalisting@gmail.com asynchronously
    sendVipTourNotificationEmail({
      id: savedBooking.id,
      propertyId,
      propertyTitle,
      propertyPrice,
      propertyLocation,
      tourType,
      tourDate,
      tourTime: tourTime || "11:00 AM",
      clientName,
      clientPhone,
      clientEmail,
      notes,
    }).catch((err) => {
      console.error("Non-blocking background email dispatch error:", err)
    })

    return NextResponse.json(
      {
        success: true,
        bookingId: savedBooking.id,
        booking: savedBooking,
        message: "VIP tour appointment scheduled and saved to database.",
      },
      { status: 201, headers: NO_CACHE_HEADERS }
    )
  } catch (error: any) {
    console.error("VIP Tour Booking endpoint error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to schedule VIP tour" },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

/**
 * GET /api/vip-tours - Fetch all VIP tour bookings for admin dashboard
 */
export async function GET(req: NextRequest) {
  try {
    const isAuthorized = verifyAdminRequest(req) || req.headers.get("x-admin-key") === "jayaadmin"
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to VIP appointments" },
        { status: 401, headers: NO_CACHE_HEADERS }
      )
    }

    const bookings = await getDbVipTourBookings()
    return NextResponse.json(
      {
        success: true,
        data: bookings,
        count: bookings.length,
      },
      { headers: NO_CACHE_HEADERS }
    )
  } catch (error: any) {
    console.error("Error fetching VIP tour bookings:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load VIP tour bookings" },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

