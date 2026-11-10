import { NextRequest, NextResponse } from "next/server"
import { getCrmStore, getDbProperties, syncEstateToCrm } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * POST /api/crm/sync
 * Syncs active JayaListing portfolio estates into the CRM pipeline,
 * linking each property while preserving separate personal CRM data (brokers, priority, private notes).
 */
export async function POST(req: NextRequest) {
  try {
    const properties = await getDbProperties(undefined, true, { full: true })
    let syncedCount = 0

    for (const est of properties) {
      if (!est.title) continue
      await syncEstateToCrm(est)
      syncedCount++
    }

    const refreshed = await getCrmStore()

    return NextResponse.json({
      success: true,
      syncedCount,
      totalProps: refreshed.props.length,
      data: refreshed,
    })
  } catch (err: any) {
    console.error("CRM Sync error:", err)
    return NextResponse.json(
      { success: false, error: err.message || "Failed to sync portfolio into CRM" },
      { status: 500 }
    )
  }
}

