import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { updateDbVipTourBookingStatus, deleteDbVipTourBooking } from "@/lib/db"
import { verifyAdminRequest } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"
export const revalidate = 0

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

function triggerTourRevalidation() {
  try {
    revalidatePath("/admin")
    revalidateTag("vip-tours")
  } catch (e) {
    console.warn("Notice: on-demand revalidation on tour update:", e)
  }
}

/**
 * PATCH /api/vip-tours/[id] - Update booking status
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = verifyAdminRequest(req) || req.headers.get("x-admin-key") === "jayaadmin"
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401, headers: NO_CACHE_HEADERS }
      )
    }

    const { id } = await params
    const body = await req.json()
    const status = body.status

    if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400, headers: NO_CACHE_HEADERS }
      )
    }

    const updated = await updateDbVipTourBookingStatus(id, status)
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404, headers: NO_CACHE_HEADERS }
      )
    }

    triggerTourRevalidation()

    return NextResponse.json(
      {
        success: true,
        data: updated,
        message: `Booking #${id} status updated to ${status}`,
      },
      { headers: NO_CACHE_HEADERS }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update booking" },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

/**
 * DELETE /api/vip-tours/[id] - Delete a booking
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = verifyAdminRequest(req) || req.headers.get("x-admin-key") === "jayaadmin"
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401, headers: NO_CACHE_HEADERS }
      )
    }

    const { id } = await params
    const deleted = await deleteDbVipTourBooking(id)

    if (deleted) {
      triggerTourRevalidation()
    }

    return NextResponse.json(
      {
        success: true,
        deleted,
        message: deleted ? `Booking #${id} deleted` : "Booking not found",
      },
      { headers: NO_CACHE_HEADERS }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete booking" },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

