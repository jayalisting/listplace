import { ImageSeoData, ImageType } from "./image-seo"

export interface AiSuggestionContext {
  propertyTitle?: string
  propertyLocation?: string
  propertyCategory?: string
  propertyPrice?: string
  specs?: string
  existingFileName?: string
  imageType?: ImageType
}

/**
 * Intelligent AI Assistant for Drafting Image SEO, AEO & GEO Metadata.
 * Generates natural, high-ranking drafts for review without keyword stuffing.
 */
export function generateAiImageSeoSuggestions(context: AiSuggestionContext): Partial<ImageSeoData> {
  const title = (context.propertyTitle || "Luxury Architectural Estate").trim()
  const loc = (context.propertyLocation || "Mangaluru, Karnataka, India").trim()
  const category = (context.propertyCategory || "Residential").toLowerCase()
  const imageType = context.imageType || "photo"

  // Clean slug
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 35)

  let suggestedAlt = ""
  let suggestedAiDesc = ""
  let suggestedQuestion = ""
  let suggestedTranscript = ""
  let suggestedFileName = `${titleSlug}-architectural-view.webp`

  if (imageType === "floorplan" || imageType === "diagram") {
    suggestedAlt = `Detailed floor plan and architectural layout of ${title} in ${loc}`.slice(0, 125)
    suggestedAiDesc = `Architectural floor plate illustrating the structural room layout, room dimensions, circulation corridors, and orientations for ${title}.`
    suggestedQuestion = `What is the architectural floor plan and suite layout of ${title}?`
    suggestedTranscript = `Level Layout: Master Presidential Suites, Ensuite Baths, Walk-In Wardrobes, Double-Height Living Atrium, Kitchen, Service Quarters, and Dedicated Parking Bays.`
    suggestedFileName = `${titleSlug}-master-floorplan.webp`
  } else if (imageType === "infographic" || imageType === "chart") {
    suggestedAlt = `Key specifications, ROI projection, and infrastructure matrix for ${title}`.slice(0, 125)
    suggestedAiDesc = `Data summary detailing asset dimensions, expected capital appreciation, verified land documentation, and connectivity milestones for ${title}.`
    suggestedQuestion = `What are the financial metrics and infrastructure specifications of ${title}?`
    suggestedTranscript = `Summary Metrics: Clear Title Verified, RERA Registered, 100% Dual Power Backup, 24/7 Treated Water Network, Highway Frontage Access.`
    suggestedFileName = `${titleSlug}-specifications-matrix.webp`
  } else {
    suggestedAlt = `Exterior architectural façade and grounds of ${title} located at ${loc}`.slice(0, 125)
    suggestedAiDesc = `High-resolution photograph depicting ${title}, an exclusive ${category} asset in ${loc}. Verified clear title portfolio holding for discerning buyers.`
    suggestedQuestion = `What does the exterior architecture and grounds of ${title} look like?`
    suggestedFileName = `${titleSlug}-facade-exterior.webp`
  }

  // Extract city & region
  const parts = loc.split(",").map((s) => s.trim())
  const city = parts[0] || "Mangaluru"
  const region = parts.length > 1 ? parts[1] : "Karnataka"
  const country = parts.length > 2 ? parts[2] : "India"

  return {
    alt: suggestedAlt,
    isDecorative: false,
    title: `${title} — Verified Architecture`,
    caption: `${title} (${category.toUpperCase()}) — ${loc}`,
    description: `Official photographic documentation of ${title} situated in ${loc}. Part of JayaListing verified institutional portfolio.`,
    seoFileName: suggestedFileName,
    focusKeyword: `${title} ${city}`.toLowerCase(),
    imageType,

    aiDescription: suggestedAiDesc,
    entities: {
      brand: "JayaListing",
      product: title,
      place: `${city}, ${region}`,
      topic: `${category.charAt(0).toUpperCase() + category.slice(1)} Real Estate India`,
    },
    relatedQuestion: suggestedQuestion,
    transcript: suggestedTranscript,
    location: {
      city,
      region,
      country,
      latitude: 12.9141,
      longitude: 74.856,
    },
    creator: "JayaListing Private Client Studio",
    credit: "JayaListing / Jaya Developers",
    copyright: `© ${new Date().getFullYear()} Jaya Developers. All rights reserved.`,
    license: "https://jayalisting.com/terms#media-license",
    isAiGenerated: false,
    allowIndex: true,
    includeInSitemap: true,
    lazyLoad: true,
    priority: false,
    socialShareOverride: false,
  }
}

