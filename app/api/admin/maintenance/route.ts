import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/admin-auth"
import {
  archiveOldVipBookings,
  cleanupExpiredVipTokens,
  getDatabaseRetentionStats,
} from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

function isAuthorized(req: NextRequest): boolean {
  // 1. Standard Admin Session check
  if (verifyAdminRequest(req)) return true

  // 2. Vercel Cron or External Job Authorization check
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get("authorization")
    if (authHeader === `Bearer ${cronSecret}`) return true
    if (req.headers.get("x-cron-secret") === cronSecret) return true
  }

  return false
}

/**
 * GET /api/admin/maintenance
 * Fetches database storage, table sizes, and retention statistics.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized access to maintenance service." },
      { status: 401 }
    )
  }

  try {
    const stats = await getDatabaseRetentionStats()
    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch retention stats." },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/maintenance
 * Executes retention tasks:
 * - action = 'archive_bookings': Archives completed/cancelled VIP bookings older than monthsOld (default 3)
 * - action = 'cleanup_tokens': Prunes exhausted or revoked VIP share tokens older than daysOld (default 30)
 * - action = 'all' (default): Runs both housekeeping tasks
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized access to maintenance service." },
      { status: 401 }
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    const action = body.action || "all"
    const monthsOld = typeof body.monthsOld === "number" ? body.monthsOld : 3
    const daysOld = typeof body.daysOld === "number" ? body.daysOld : 30

    let archivedBookingsCount = 0
    let cleanedTokensCount = 0

    if (action === "archive_bookings" || action === "all") {
      archivedBookingsCount = await archiveOldVipBookings(monthsOld)
    }

    if (action === "cleanup_tokens" || action === "all") {
      cleanedTokensCount = await cleanupExpiredVipTokens(daysOld)
    }

    const currentStats = await getDatabaseRetentionStats()

    return NextResponse.json({
      success: true,
      action,
      summary: {
        archivedBookingsCount,
        cleanedTokensCount,
      },
      stats: currentStats,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Maintenance execution error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Maintenance operation failed." },
      { status: 500 }
    )
  }
}
