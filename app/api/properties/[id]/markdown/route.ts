import { NextRequest, NextResponse } from "next/server"
import { fetchPropertyById } from "@/lib/get-property"
import { toPublicListing } from "@/lib/public-listing"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * Dedicated Markdown endpoint for AI agents, LLM search engines, and third-party tools.
 * Returns factual, structured Markdown of any public estate.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const property = await fetchPropertyById(id)

    if (!property) {
      return new NextResponse("# 404: Property Not Found\nThe requested estate does not exist or has been unlisted.", {
        status: 404,
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
      })
    }

    if (property.visibility === "private" || property.visibility === "draft") {
      return new NextResponse("# Confidential Estate\nThis property is part of JayaListing Private VIP Portfolio and is not indexed publicly.", {
        status: 403,
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
      })
    }

    const listing = toPublicListing(property)

    const markdown = `# ${listing.title}
**Property Type**: ${listing.propertyType} | **Category**: ${listing.category}  
**Status**: ${listing.status} | **Asking Price**: ${listing.price}${listing.pricePeriod ? ` ${listing.pricePeriod}` : ""}  
**Location**: ${listing.location}, ${listing.city}, ${listing.state}, India  
**Verified Platform**: JayaListing (Jaya Developers)  
**Canonical URL**: https://jayalisting.com/property/${listing.id}  

---

## Executive Summary (Verified Facts)
${listing.answerFirstSummary}

---

## Architectural & Technical Specifications
- **Total Built-Up Area**: ${listing.area || "N/A"}
- **Carpet Usable Area**: ${listing.carpetArea || "N/A"}
- **Suites / Bedrooms**: ${listing.bedrooms ? `${listing.bedrooms} Suites` : "N/A"}
- **Baths**: ${listing.bathrooms ? `${listing.bathrooms} Baths` : "N/A"}
- **Parking**: ${listing.parking}
- **Orientation / Facing**: ${listing.facing || "N/A"}
- **Floor / Level**: ${listing.floor || "N/A"}
- **Power Infrastructure**: ${listing.specs.powerBackup || "N/A"}
- **Water Network**: ${listing.specs.waterSupply || "N/A"}
- **Estate Security**: ${listing.specs.estateSecurity || "N/A"}

---

## Signature Amenities
${listing.amenities.map((a) => `- **${a.label}** (${a.category})`).join("\n")}

---

## Factual Frequently Asked Questions
${listing.faqs.map((f) => `### ${f.question}\n${f.answer}\n`).join("\n")}

---

## Public Brokerage & Concierge Contact
- **Brokerage**: ${listing.agency.name}
- **Official Concierge**: ${listing.agency.phone}
- **Email**: ${listing.agency.email}
- **RERA / License**: ${listing.agency.license}
- **Website**: ${listing.agency.website}
`

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    })
  } catch (err: any) {
    return new NextResponse(`# Error\nFailed to render markdown: ${err.message}`, {
      status: 500,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    })
  }
}
