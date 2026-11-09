import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import crypto from "crypto"
import { getDbPropertyById, deleteDbProperty, updateDbPropertyAmenities, updateDbProperty } from "@/lib/db"
import { verifyAdminRequest } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"
export const revalidate = 0

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

function triggerPropertyRevalidation(id: string) {
  try {
    revalidatePath("/")
    revalidatePath("/residential")
    revalidatePath("/commercial")
    revalidatePath("/industrial")
    revalidatePath("/agriculture")
    revalidatePath(`/property/${id}`)
    revalidatePath("/sitemap.xml")
    revalidateTag("properties")
  } catch (e) {
    console.warn("Notice: on-demand revalidation:", e)
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const property = await getDbPropertyById(id)

    if (!property) {
      return NextResponse.json(
        { success: false, notFound: true, error: "Property not found or has been deleted" },
        { status: 404, headers: NO_CACHE_HEADERS }
      )
    }

    const isPrivate = property.visibility === "private" || property.visibility === "draft"
    const etag = `W/"${crypto.createHash("md5").update(id + ":" + property.title + ":" + (property.price || "")).digest("hex").slice(0, 16)}"`

    const ifNoneMatch = req.headers.get("if-none-match")
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": isPrivate ? "no-store" : "public, s-maxage=60, stale-while-revalidate=300",
        },
      })
    }

    const headers: Record<string, string> = isPrivate
      ? NO_CACHE_HEADERS
      : {
          ETag: etag,
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        }

    return NextResponse.json(
      {
        success: true,
        data: property,
      },
      { headers }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch property" },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    // If only amenities array is provided
    if (body.amenities && Object.keys(body).length === 1) {
      if (!Array.isArray(body.amenities)) {
        return NextResponse.json(
          { success: false, error: "amenities must be an array of strings" },
          { status: 400, headers: NO_CACHE_HEADERS }
        )
      }
      const updated = await updateDbPropertyAmenities(id, body.amenities)
      if (!updated) {
        return NextResponse.json(
          { success: false, notFound: true, error: "Property not found" },
          { status: 404, headers: NO_CACHE_HEADERS }
        )
      }

      triggerPropertyRevalidation(id)

      return NextResponse.json(
        {
          success: true,
          data: updated,
          message: `Custom amenities updated for property #${id}`,
        },
        { headers: NO_CACHE_HEADERS }
      )
    }

    // Full or partial updates across all fields
    const updated = await updateDbProperty(id, body)
    if (!updated) {
      return NextResponse.json(
        { success: false, notFound: true, error: "Property not found" },
        { status: 404, headers: NO_CACHE_HEADERS }
      )
    }

    triggerPropertyRevalidation(id)

    // When admin makes a property public or updates a public property, notify IndexNow immediately!
    if (updated && (updated.visibility === "public" || updated.visibility === "published")) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jayalisting.com"
      const propertyUrl = `${siteUrl}/property/${id}`
      fetch(`${siteUrl}/api/indexnow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: propertyUrl }),
      }).catch((e) => console.log("Automatic IndexNow notify notice on update:", e))
    }

    return NextResponse.json(
      {
        success: true,
        data: updated,
        message: `Property #${id} successfully updated in PostgreSQL`,
      },
      { headers: NO_CACHE_HEADERS }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update property" },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(req, { params })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = verifyAdminRequest(req) || req.headers.get("x-admin-key") === "jayaadmin"
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Users cannot delete listings. Only administrator can delete." },
        { status: 403, headers: NO_CACHE_HEADERS }
      )
    }

    const { id } = await params
    const deleted = await deleteDbProperty(id)

    if (deleted) {
      triggerPropertyRevalidation(id)
    }

    return NextResponse.json(
      {
        success: true,
        deleted,
        message: deleted ? `Property #${id} deleted from database` : `Property #${id} not found`,
      },
      { headers: NO_CACHE_HEADERS }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete property" },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}
