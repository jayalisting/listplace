import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { fetchPropertyById } from "@/lib/get-property"
import { toPublicListing } from "@/lib/public-listing"
import { generatePropertyJsonLd } from "@/lib/json-ld"
import PropertyDetailsClient from "@/components/property-details-client"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jayalisting.com"

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Dynamic Server-Side Metadata Generation
 * Provides clean, unique <title>, <meta description>, Open Graph, and Twitter Cards on first byte.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const property = await fetchPropertyById(id)

  if (!property) {
    return {
      title: "Estate Not Found | JayaListing",
      description: "The requested property is no longer active or private.",
      robots: { index: false, follow: false },
    }
  }

  // Private VIP listings are excluded from public search index
  const isPrivate =
    property.visibility === "private" ||
    property.visibility === "gated" ||
    property.visibility === "draft"

  if (isPrivate) {
    return {
      title: `${property.title} (Confidential VIP Portfolio) | JayaListing`,
      description: "Strictly confidential estate accessible solely via verified VIP pass.",
      robots: { index: false, follow: false },
    }
  }

  const publicListing = toPublicListing(property)
  const metaTitle = `${publicListing.title} | ${publicListing.propertyType} in ${publicListing.location}, ${publicListing.city}`
  const metaDescription =
    publicListing.answerFirstSummary.length > 158
      ? `${publicListing.answerFirstSummary.slice(0, 155)}...`
      : publicListing.answerFirstSummary

  const pageUrl = `${SITE_URL}/property/${id}`
  const heroImageUrl = publicListing.heroImage.url.startsWith("http")
    ? publicListing.heroImage.url
    : `${SITE_URL}${publicListing.heroImage.url}`

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "article",
      locale: "en_IN",
      url: pageUrl,
      title: metaTitle,
      description: metaDescription,
      siteName: "JayaListing",
      images: [
        {
          url: heroImageUrl,
          width: 1200,
          height: 630,
          alt: publicListing.heroImage.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [heroImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  }
}

export default async function PropertyDetailsPage({ params }: PageProps) {
  const { id } = await params
  const property = await fetchPropertyById(id)

  if (!property) {
    notFound()
  }

  // Generate structured data only for public indexable listings
  let jsonLd = null
  if (property.visibility !== "private" && property.visibility !== "draft") {
    try {
      const publicListing = toPublicListing(property)
      jsonLd = generatePropertyJsonLd(publicListing, SITE_URL)
    } catch (e) {
      console.error("Failed to generate JSON-LD for listing:", e)
    }
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PropertyDetailsClient id={id} initialProperty={property} />
    </>
  )
}
