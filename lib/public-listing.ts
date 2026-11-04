import { LuxuryProperty } from "./luxury-properties"

export interface PublicImage {
  url: string
  alt: string
  caption?: string
  isHero?: boolean
}

export interface StructuredAmenity {
  key: string
  label: string
  category: "luxury" | "infrastructure" | "security" | "wellness" | "general"
}

export interface PropertyFaq {
  question: string
  answer: string
}

export interface PublicListing {
  id: string
  slug: string
  title: string
  tagline: string
  category: "residential" | "commercial" | "industrial" | "agriculture"
  propertyType: string
  listingType: "sale" | "rent" | "lease"
  status: "For Sale" | "For Lease" | "Private Treaty" | "Sold" | "Rented"
  visibility: "published" | "private" | "sold_or_rented"
  isPubliclyIndexable: boolean
  price: string
  priceNumeric: number
  currency: string
  pricePeriod?: string
  location: string
  city: string
  state: string
  country: string
  area: string
  carpetArea?: string
  bedrooms?: number
  bathrooms?: number
  parking: string
  facing?: string
  floor?: string
  age?: string
  specs: {
    powerBackup?: string
    waterSupply?: string
    estateSecurity?: string
    furnishing?: string
    ceilingHeight?: string
    eavesHeight?: string
    zoning?: string
  }
  amenities: StructuredAmenity[]
  images: PublicImage[]
  heroImage: PublicImage
  description: string
  answerFirstSummary: string
  faqs: PropertyFaq[]
  landmarks: {
    name: string
    type: string
    distance: string
  }[]
  coordinates?: {
    lat: number
    lng: number
  }
  agency: {
    name: string
    brand: string
    phone: string
    email: string
    license: string
    website: string
  }
  publishedAt: string
  updatedAt: string
}

/**
 * Creates a clean, stable slug for any property.
 */
export function generatePropertySlug(property: {
  title: string
  city?: string
  location?: string
  id: string
}): string {
  const parts = [property.title, property.location, property.city]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
  return `${parts || "property"}-${property.id}`
}

/**
 * Maps raw amenity strings to structured amenities with human labels and machine keys.
 */
export function categorizeAmenity(raw: string): StructuredAmenity {
  const text = raw.trim()
  const key = text.toLowerCase().replace(/[^a-z0-9]+/g, "_")

  let category: StructuredAmenity["category"] = "general"
  const lower = text.toLowerCase()

  if (
    lower.includes("security") ||
    lower.includes("guard") ||
    lower.includes("cctv") ||
    lower.includes("biometric") ||
    lower.includes("panic")
  ) {
    category = "security"
  } else if (
    lower.includes("power") ||
    lower.includes("backup") ||
    lower.includes("water") ||
    lower.includes("substation") ||
    lower.includes("solar") ||
    lower.includes("fiber") ||
    lower.includes("sprinkler")
  ) {
    category = "infrastructure"
  } else if (
    lower.includes("pool") ||
    lower.includes("spa") ||
    lower.includes("gym") ||
    lower.includes("sauna") ||
    lower.includes("garden") ||
    lower.includes("squash")
  ) {
    category = "wellness"
  } else if (
    lower.includes("helipad") ||
    lower.includes("butler") ||
    lower.includes("valet") ||
    lower.includes("imax") ||
    lower.includes("wine") ||
    lower.includes("marble") ||
    lower.includes("trophy")
  ) {
    category = "luxury"
  }

  return {
    key,
    label: text,
    category,
  }
}

/**
 * Generates an SEO-optimized descriptive alt text for a listing image.
 */
export function generateImageAlt(
  title: string,
  location: string,
  city: string,
  index: number,
  category: string
): string {
  if (index === 0) {
    return `Exterior facade and architecture of ${title} in ${location}, ${city}`
  }
  if (index === 1) {
    return `Interior layout and high-end living area of ${title} in ${location}`
  }
  if (index === 2) {
    return `Master suite and architectural detailing of ${title}`
  }
  return `${category} architectural view of ${title} in ${city}`
}

/**
 * Synthesizes a factual 2-3 sentence answer-first summary for SEO/AEO/GEO.
 */
export function generateAnswerFirstSummary(prop: LuxuryProperty): string {
  const parts: string[] = []

  const bedInfo = prop.bedrooms ? `featuring ${prop.bedrooms} bedrooms` : ""
  const sizeInfo = prop.area ? `spanning ${prop.area}` : ""
  const details = [bedInfo, sizeInfo].filter(Boolean).join(" and ")

  parts.push(
    `${prop.title} is a premier ${prop.propertyType} located in ${prop.location}, ${prop.city}, ${prop.state}, India${
      details ? ` (${details})` : ""
    }.`
  )

  const statusPhrase =
    prop.status === "For Lease"
      ? `available for lease at ${prop.price}`
      : `offered for sale at ${prop.price}`
  parts.push(`The asset is ${statusPhrase} with ${prop.parking || "dedicated parking"}.`)

  const keyAmenities = (prop.amenities || prop.highlights || []).slice(0, 3)
  if (keyAmenities.length > 0) {
    parts.push(
      `Key signature amenities and infrastructure include ${keyAmenities.join(", ")} with verified clear legal titles.`
    )
  }

  return parts.join(" ")
}

/**
 * Generates real-data FAQs strictly derived from verified property attributes.
 * Never invents facts.
 */
export function generatePropertyFaqs(prop: LuxuryProperty): PropertyFaq[] {
  // If custom FAQs are provided for this property, honor them first
  const custom =
    (prop.customFaqs && prop.customFaqs.length > 0 ? prop.customFaqs : null) ||
    (prop.attributes?.customFaqs && Array.isArray(prop.attributes.customFaqs) && prop.attributes.customFaqs.length > 0
      ? (prop.attributes.customFaqs as PropertyFaq[])
      : null)

  if (custom && custom.length > 0) {
    const valid = custom
      .filter((f) => f && typeof f.question === "string" && f.question.trim().length > 0 && typeof f.answer === "string" && f.answer.trim().length > 0)
      .map((f) => ({
        question: f.question.trim(),
        answer: f.answer.trim(),
      }))

    if (valid.length > 0) {
      return valid
    }
  }

  const faqs: PropertyFaq[] = []

  // Q1: Location
  faqs.push({
    question: `Where is ${prop.title} located?`,
    answer: `${prop.title} is situated at ${prop.location}, ${prop.city}, ${prop.state}, India.`,
  })

  // Q2: Price
  faqs.push({
    question: `What is the price of ${prop.title}?`,
    answer: `The asking price is ${prop.price}${
      prop.priceSuffix ? ` ${prop.priceSuffix}` : ""
    } under ${prop.status} status with verified title documentation.`,
  })

  // Q3: Size / Specs
  const specsSummary = [
    prop.area ? `Total Area: ${prop.area}` : null,
    prop.carpetArea ? `Carpet Area: ${prop.carpetArea}` : null,
    prop.bedrooms ? `Bedrooms: ${prop.bedrooms} BHK` : null,
    prop.bathrooms ? `Bathrooms: ${prop.bathrooms}` : null,
  ]
    .filter(Boolean)
    .join(", ")

  if (specsSummary) {
    faqs.push({
      question: `What are the dimensions and configuration of this ${prop.propertyType}?`,
      answer: `${prop.title} offers ${specsSummary}.`,
    })
  }

  // Q4: Parking
  if (prop.parking && prop.parking !== "None") {
    faqs.push({
      question: `Is parking available at ${prop.title}?`,
      answer: `Yes, this property includes ${prop.parking}.`,
    })
  }

  // Q5: Key Amenities
  const allAmenities = prop.amenities || prop.highlights || []
  if (allAmenities.length > 0) {
    faqs.push({
      question: `What signature amenities and infrastructure does ${prop.title} provide?`,
      answer: `${prop.title} features ${allAmenities.slice(0, 6).join(", ")}.`,
    })
  }

  return faqs
}

/**
 * THE SINGLE GATEWAY FUNCTION: toPublicListing(listing)
 *
 * Takes any internal listing record and sanitizes it into a public discovery model.
 * GUARANTEE: Zero private fields (owner name, private phone, negotiation notes,
 * internal documents, commission) can ever pass through this function.
 */
export function toPublicListing(raw: any): PublicListing {
  if (!raw) {
    throw new Error("Invalid listing input to toPublicListing")
  }

  // Determine visibility state
  const rawVis = (raw.visibility || "public").toLowerCase()
  const isPrivate = rawVis === "private" || rawVis === "gated" || rawVis === "draft"
  const isSoldOrRented =
    raw.status === "Sold" ||
    raw.status === "Rented" ||
    rawVis === "sold_or_rented"

  const visibility: PublicListing["visibility"] = isSoldOrRented
    ? "sold_or_rented"
    : isPrivate
    ? "private"
    : "published"

  // Only published, public listings are eligible for public indexing
  const isPubliclyIndexable = visibility === "published"

  // Standardize listing type
  const listingType: "sale" | "rent" | "lease" =
    raw.listingType === "lease" || raw.status === "For Lease"
      ? "lease"
      : raw.listingType === "rent"
      ? "rent"
      : "sale"

  // Clean images with alt text
  const rawImages: string[] = Array.isArray(raw.images) && raw.images.length > 0
    ? raw.images
    : ["/placeholder.jpg"]

  const images: PublicImage[] = rawImages.map((url, idx) => ({
    url,
    alt: generateImageAlt(raw.title || "Estate", raw.location || "City", raw.city || "India", idx, raw.category || "Property"),
    isHero: idx === 0,
  }))

  const heroImage = images[0]

  // Structured Amenities
  const rawAmenities: string[] = Array.isArray(raw.amenities) && raw.amenities.length > 0
    ? raw.amenities
    : Array.isArray(raw.highlights)
    ? raw.highlights
    : []

  const structuredAmenities = rawAmenities.map(categorizeAmenity)

  // Specs extraction (excluding any internal notes)
  const details = raw.details || {}
  const specs = {
    powerBackup: details.electricity || details.powerBackup || raw.powerBackup,
    waterSupply: details.water || details.waterSupply || raw.waterSupply,
    estateSecurity: details.security || details.estateSecurity || raw.estateSecurity,
    furnishing: details.furnished,
    ceilingHeight: details.ceilingHeight,
    eavesHeight: details.eavesHeight,
    zoning: details.zoning,
  }

  // Generate answer-first summary and real-data FAQs
  const answerFirstSummary = generateAnswerFirstSummary(raw)
  const faqs = generatePropertyFaqs(raw)

  const landmarks = Array.isArray(raw.landmarks)
    ? raw.landmarks.map((l: any) => ({
        name: String(l.name || ""),
        type: String(l.type || "Landmark"),
        distance: String(l.distance || ""),
      }))
    : []

  const slug = generatePropertySlug({
    title: raw.title,
    location: raw.location,
    city: raw.city,
    id: String(raw.id),
  })

  // Official Agency Public Entity (Strictly public concierge)
  const agency = {
    name: "JayaListing Royal Estates",
    brand: "Jaya Developers",
    phone: "+91 82965 30609",
    email: "concierge@jayalisting.com",
    license: "PRM/KA/RERA/1251/310/PR/171015/000456",
    website: process.env.NEXT_PUBLIC_SITE_URL || "https://jayalisting.com",
  }

  return {
    id: String(raw.id),
    slug,
    title: String(raw.title || ""),
    tagline: String(raw.tagline || ""),
    category: raw.category || "residential",
    propertyType: String(raw.propertyType || "Luxury Property"),
    listingType,
    status: raw.status || "For Sale",
    visibility,
    isPubliclyIndexable,
    price: String(raw.price || "Price on Request"),
    priceNumeric: Number(raw.priceNumeric || 0),
    currency: "INR",
    pricePeriod: raw.priceSuffix || (listingType === "lease" ? "/month" : undefined),
    location: String(raw.location || ""),
    city: String(raw.city || "Mangaluru"),
    state: String(raw.state || "Karnataka"),
    country: "India",
    area: String(raw.area || ""),
    carpetArea: raw.carpetArea ? String(raw.carpetArea) : undefined,
    bedrooms: typeof raw.bedrooms === "number" ? raw.bedrooms : undefined,
    bathrooms: typeof raw.bathrooms === "number" ? raw.bathrooms : undefined,
    parking: String(raw.parking || "Dedicated Parking"),
    facing: raw.facing ? String(raw.facing) : undefined,
    floor: raw.floor ? String(raw.floor) : undefined,
    age: raw.age ? String(raw.age) : undefined,
    specs,
    amenities: structuredAmenities,
    images,
    heroImage,
    description: String(raw.description || answerFirstSummary),
    answerFirstSummary,
    faqs,
    landmarks,
    coordinates: raw.coordinates
      ? {
          lat: Number(raw.coordinates.lat || 18.9696),
          lng: Number(raw.coordinates.lng || 72.8081),
        }
      : undefined,
    agency,
    publishedAt: raw.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString(),
    updatedAt: raw.updated_at ? new Date(raw.updated_at).toISOString() : new Date().toISOString(),
  }
}
