import { NextRequest, NextResponse } from "next/server"
import { getCrmStore, saveCrmStore } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

/**
 * GET /api/crm/db
 * High performance, single-query retrieval of unified CRM state from Neon PostgreSQL.
 */
export async function GET() {
  try {
    const data = await getCrmStore()
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load CRM state" },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

/**
 * PUT /api/crm/db
 * Atomic optimistic-concurrency save directly into PostgreSQL crm_store with LZ4 compression.
 */
export async function PUT(req: NextRequest) {
  try {
    const payload = await req.json()
    const result = await saveCrmStore(payload, payload.version)

    if (result.conflict) {
      return NextResponse.json(
        { error: "stale", currentVersion: result.currentVersion },
        { status: 409, headers: NO_CACHE_HEADERS }
      )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to persist CRM data" },
        { status: 500, headers: NO_CACHE_HEADERS }
      )
    }

    return NextResponse.json(
      { ok: 1, version: result.version },
      { headers: NO_CACHE_HEADERS }
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Invalid CRM payload" },
      { status: 400, headers: NO_CACHE_HEADERS }
    )
  }
}

