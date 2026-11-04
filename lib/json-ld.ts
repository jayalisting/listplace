import { PublicListing } from "./public-listing"

/**
 * Builds standard Google/Schema.org JSON-LD structured data for a public real estate listing.
 * Strict adherence to Schema.org RealEstateListing, Offer, Residence/Place, BreadcrumbList, FAQPage.
 * ZERO fake reviews, zero fake ratings.
 */
export function generatePropertyJsonLd(listing: PublicListing, baseUrl = "https://jayalisting.com") {
  const listingUrl = `${baseUrl}/property/${listing.id}`
  const siteUrl = baseUrl

  // Determine specific residence or place schema type
  let accommodationType = "SingleFamilyResidence"
  const cat = listing.category.toLowerCase()
  const pType = listing.propertyType.toLowerCase()

  if (cat === "commercial") {
    accommodationType = "CommercialBuilding"
  } else if (cat === "industrial") {
    accommodationType = "IndustrialBuilding"
  } else if (cat === "agriculture" || pType.includes("plot") || pType.includes("land")) {
    accommodationType = "Landform"
  } else if (pType.includes("penthouse") || pType.includes("apartment") || pType.includes("flat")) {
    accommodationType = "Apartment"
  }

  // Offer Availability mapping
  const availability =
    listing.status === "Sold" || listing.status === "Rented"
      ? "https://schema.org/Discontinued"
      : "https://schema.org/InStock"

  const businessFunction =
    listing.listingType === "lease" || listing.listingType === "rent"
      ? "https://schema.org/LeaseOut"
      : "https://schema.org/Sell"

  // Primary image object with Google Licensable & AEO attributes
  const primaryImageObject = {
    "@type": "ImageObject",
    contentUrl: listing.heroImage.url,
    url: listing.heroImage.url,
    name: `${listing.title} Architectural Façade`,
    caption: listing.heroImage.alt,
    description: `High-resolution architectural documentation of ${listing.title} located at ${listing.location}, ${listing.city}.`,
    width: 1600,
    height: 1067,
    encodingFormat: "image/webp",
    license: `${siteUrl}/terms#media-license`,
    acquireLicensePage: `${siteUrl}/contact`,
    creditText: "JayaListing Royal Estates Photography",
    copyrightNotice: `© ${new Date().getFullYear()} Jaya Developers`,
    creator: {
      "@type": "Organization",
      name: "JayaListing Private Client Studio",
      url: siteUrl,
    },
    representativeOfPage: true,
    contentLocation: {
      "@type": "Place",
      name: `${listing.location}, ${listing.city}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: listing.location,
        addressRegion: listing.state,
        addressCountry: "IN",
      },
      geo: listing.coordinates
        ? {
            "@type": "GeoCoordinates",
            latitude: listing.coordinates.lat,
            longitude: listing.coordinates.lng,
          }
        : undefined,
    },
  }

  // All gallery images as enriched ImageObjects
  const imagesList = listing.images.map((img, idx) => ({
    "@type": "ImageObject",
    contentUrl: img.url,
    url: img.url,
    name: `${listing.title} — Architectural View ${idx + 1}`,
    caption: img.alt,
    description: img.alt,
    creditText: "JayaListing / Jaya Developers",
    copyrightNotice: `© ${new Date().getFullYear()} Jaya Developers`,
    license: `${siteUrl}/terms#media-license`,
    acquireLicensePage: `${siteUrl}/contact`,
    creator: {
      "@type": "Organization",
      name: "JayaListing Private Client Studio",
    },
  }))

  // Structured Amenities as LocationFeatureSpecification
  const amenityFeatures = listing.amenities.map((a) => ({
    "@type": "LocationFeatureSpecification",
    name: a.label,
    value: true,
    featureCategories: a.category,
  }))

  // Breadcrumbs
  const breadcrumbList = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: listing.category.charAt(0).toUpperCase() + listing.category.slice(1),
        item: `${siteUrl}/${listing.category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: listing.city,
        item: `${siteUrl}/${listing.category}?city=${encodeURIComponent(listing.city)}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: listing.title,
        item: listingUrl,
      },
    ],
  }

  // Main Property Entity
  const mainEntity: Record<string, any> = {
    "@type": accommodationType,
    name: listing.title,
    description: listing.answerFirstSummary,
    url: listingUrl,
    image: imagesList,
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.location,
      addressRegion: listing.state,
      addressCountry: "IN",
      postalCode: "575001",
    },
    amenityFeature: amenityFeatures,
  }

  if (listing.coordinates) {
    mainEntity.geo = {
      "@type": "GeoCoordinates",
      latitude: listing.coordinates.lat,
      longitude: listing.coordinates.lng,
    }
  }

  if (listing.bedrooms) {
    mainEntity.numberOfBedrooms = listing.bedrooms
    mainEntity.numberOfRooms = listing.bedrooms + (listing.bathrooms || 1)
  }

  if (listing.bathrooms) {
    mainEntity.numberOfBathroomsTotal = listing.bathrooms
  }

  if (listing.area) {
    mainEntity.floorSize = {
      "@type": "QuantitativeValue",
      value: listing.area,
      unitText: "SQFT",
    }
  }

  // RealEstateListing Root
  const realEstateListing: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${listingUrl}#listing`,
    name: listing.title,
    description: listing.answerFirstSummary,
    url: listingUrl,
    datePosted: listing.publishedAt,
    dateModified: listing.updatedAt,
    mainEntity: mainEntity,
    primaryImageOfPage: primaryImageObject,
    image: listing.images.map((i) => i.url),
    associatedMedia: imagesList,
    offers: {
      "@type": "Offer",
      price: listing.priceNumeric > 0 ? listing.priceNumeric : undefined,
      priceCurrency: "INR",
      priceSpecification: {
        "@type": "PriceSpecification",
        price: listing.priceNumeric > 0 ? listing.priceNumeric : undefined,
        priceCurrency: "INR",
        valueAddedTaxIncluded: true,
      },
      availability: availability,
      businessFunction: businessFunction,
      validFrom: listing.publishedAt,
      url: listingUrl,
      seller: {
        "@type": "RealEstateAgent",
        name: listing.agency.name,
        telephone: listing.agency.phone,
        url: listing.agency.website,
        email: listing.agency.email,
        image: `${siteUrl}/placeholder-logo.png`,
      },
    },
  }

  // FAQPage Schema (only where factual FAQs exist)
  let faqSchema: Record<string, any> | null = null
  if (listing.faqs && listing.faqs.length > 0) {
    faqSchema = {
      "@type": "FAQPage",
      mainEntity: listing.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer,
        },
      })),
    }
  }

  // Combined Graph Schema
  return {
    "@context": "https://schema.org",
    "@graph": [
      realEstateListing,
      breadcrumbList,
      ...(faqSchema ? [faqSchema] : []),
      {
        "@type": "RealEstateAgent",
        "@id": `${siteUrl}#agency`,
        name: listing.agency.name,
        url: siteUrl,
        logo: `${siteUrl}/placeholder-logo.png`,
        telephone: listing.agency.phone,
        email: listing.agency.email,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Mangaluru",
          addressRegion: "Karnataka",
          addressCountry: "IN",
        },
      },
    ],
  }
}
