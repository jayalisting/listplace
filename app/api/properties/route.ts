import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import crypto from "crypto"
import { getDbProperties, createDbProperty, seedDefaultProperties } from "@/lib/db"
import { toPublicListing } from "@/lib/public-listing"

export const dynamic = "force-dynamic"
export const revalidate = 0

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category") || undefined
    const includePrivate = searchParams.get("includePrivate") === "true"
    const format = searchParams.get("format") // "ai" | "raw" | undefined
    const cursor = searchParams.get("cursor") || undefined
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined
    const fieldsParam = searchParams.get("fields")

    // Full columns only required for AI/SEO markdown schemas or explicit admin full inspection
    const isFullRequested = format === "ai" || format === "seo" || searchParams.get("full") === "true"
    let properties = await getDbProperties(category, includePrivate, {
      full: isFullRequested,
      cursor,
      limit,
      offset,
    })

    // Field selection if requested by client
    if (fieldsParam) {
      const selectedFields = fieldsParam.split(",").map((f) => f.trim())
      properties = properties.map((prop) => {
        const filtered: Record<string, any> = {}
        for (const field of selectedFields) {
          if (field in prop) {
            filtered[field] = (prop as any)[field]
          }
        }
        return filtered as any
      })
    }

    // Compute lightweight ETag for cache validation
    const etagPayload = properties.map((p) => p.id).join(":") + `:${properties.length}`
    const etag = `W/"${crypto.createHash("md5").update(etagPayload).digest("hex").slice(0, 16)}"`

    const ifNoneMatch = req.headers.get("if-none-match")
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": includePrivate ? "no-store" : "public, s-maxage=60, stale-while-revalidate=300",
        },
      })
    }

    const responseHeaders: Record<string, string> = includePrivate
      ? NO_CACHE_HEADERS
      : {
          ETag: etag,
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        }

    // If third-party AI or search portal requests public discovery format
    if (format === "ai" || format === "seo") {
      const publicListings = properties
        .filter((p) => includePrivate || p.visibility !== "private")
        .map((p) => toPublicListing(p))

      return NextResponse.json(
        {
          success: true,
          platform: "JayaListing",
          count: publicListings.length,
          data: publicListings,
        },
        { headers: responseHeaders }
      )
    }

    return NextResponse.json(
      {
        success: true,
        count: properties.length,
        data: properties,
      },
      { headers: responseHeaders }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch properties" },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    if (searchParams.get("action") === "reset") {
      const seededCount = await seedDefaultProperties(true)
      try {
        revalidatePath("/")
        revalidatePath("/residential")
        revalidatePath("/commercial")
        revalidatePath("/industrial")
        revalidatePath("/agriculture")
        revalidatePath("/sitemap.xml")
        revalidateTag("properties")
      } catch {}

      return NextResponse.json(
        {
          success: true,
          message: `Database restored with ${seededCount} luxury estates`,
        },
        { headers: NO_CACHE_HEADERS }
      )
    }

    const body = await req.json()
    const created = await createDbProperty(body)

    // Trigger on-demand ISR revalidation across all static and cached portal pages
    try {
      revalidatePath("/")
      revalidatePath("/residential")
      revalidatePath("/commercial")
      revalidatePath("/industrial")
      revalidatePath("/agriculture")
      if (created?.id) {
        revalidatePath(`/property/${created.id}`)
      }
      revalidatePath("/sitemap.xml")
      revalidateTag("properties")
    } catch (e) {
      console.warn("Notice during on-demand revalidation on create:", e)
    }

    // When admin creates a public listing, notify IndexNow participating search engines immediately!
    if (created && (created.visibility === "public" || created.visibility === "published")) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jayalisting.com"
      const propertyUrl = `${siteUrl}/property/${created.id}`
      fetch(`${siteUrl}/api/indexnow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: propertyUrl }),
      }).catch((e) => console.log("Automatic IndexNow notify notice on create:", e))
    }

    return NextResponse.json(
      {
        success: true,
        data: created,
      },
      { headers: NO_CACHE_HEADERS }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create property" },
      { status: 500, headers: NO_CACHE_HEADERS }
    )
  }
}
