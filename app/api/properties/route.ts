import { NextRequest, NextResponse } from "next/server"
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

    const properties = await getDbProperties(category, includePrivate)

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
        { headers: NO_CACHE_HEADERS }
      )
    }

    return NextResponse.json(
      {
        success: true,
        count: properties.length,
        data: properties,
      },
      { headers: NO_CACHE_HEADERS }
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
