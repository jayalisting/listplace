/**
 * Image SEO, AEO & GEO Types and Data Definitions
 * Covers traditional search engines, answer engines (AEO), and generative AI engines (GEO).
 */

export type ImageType =
  | "photo"
  | "product"
  | "infographic"
  | "chart"
  | "diagram"
  | "screenshot"
  | "logo"

export interface ImageLocation {
  city?: string
  region?: string
  country?: string
  latitude?: number
  longitude?: number
}

export interface ImageEntities {
  brand?: string
  product?: string
  person?: string
  place?: string
  topic?: string
}

export interface ImageSeoData {
  url: string
  // Basic SEO
  alt: string
  isDecorative: boolean
  title: string
  caption: string
  description: string
  seoFileName: string
  originalFileName?: string
  focusKeyword: string
  imageType: ImageType

  // AEO / GEO
  aiDescription: string
  entities: ImageEntities
  relatedQuestion?: string
  transcript?: string
  location?: ImageLocation
  creator: string
  credit: string
  copyright: string
  license: string
  isAiGenerated: boolean
  languages?: Record<string, { alt: string; caption: string }>

  // Controls
  allowIndex: boolean
  includeInSitemap: boolean
  lazyLoad: boolean
  priority: boolean
  socialShareOverride: boolean

  // Technical
  width?: number
  height?: number
  fileSizeBytes?: number
  format?: string
  score?: number
  updatedAt?: string
}

export interface ImageSeoSettings {
  altTemplate: string
  defaultCreator: string
  defaultCredit: string
  defaultCopyright: string
  defaultLicense: string
  defaultCity: string
  defaultRegion: string
  defaultCountry: string
  defaultLazyLoad: boolean
  defaultAllowIndex: boolean
  defaultIncludeInSitemap: boolean
  crawlerRules: {
    googlebotImage: boolean
    bingbot: boolean
    gptBot: boolean
    oaiSearchBot: boolean
    chatGptUser: boolean
    claudeBot: boolean
    claudeSearchBot: boolean
    claudeUser: boolean
    perplexityBot: boolean
    perplexityUser: boolean
    googleExtended: boolean
    applebotExtended: boolean
    ccBot: boolean
  }
}

export const DEFAULT_IMAGE_SEO_SETTINGS: ImageSeoSettings = {
  altTemplate: "{title} - {category} architectural estate in {city} by {brand}",
  defaultCreator: "JayaListing Private Client Studio",
  defaultCredit: "JayaListing / Jaya Developers",
  defaultCopyright: `© ${new Date().getFullYear()} Jaya Developers. All rights reserved.`,
  defaultLicense: "https://jayalisting.com/terms#media-license",
  defaultCity: "Mangaluru",
  defaultRegion: "Karnataka",
  defaultCountry: "India",
  defaultLazyLoad: true,
  defaultAllowIndex: true,
  defaultIncludeInSitemap: true,
  crawlerRules: {
    googlebotImage: true,
    bingbot: true,
    gptBot: true,
    oaiSearchBot: true,
    chatGptUser: true,
    claudeBot: true,
    claudeSearchBot: true,
    claudeUser: true,
    perplexityBot: true,
    perplexityUser: true,
    googleExtended: true,
    applebotExtended: true,
    ccBot: false, // Disallow generic bulk scraping by default
  },
}

/**
 * Creates default SEO metadata for any image URL
 */
export function createDefaultImageSeo(url: string, context?: { title?: string; category?: string; city?: string }): ImageSeoData {
  const cleanName = url.split("/").pop()?.split("?")[0] || "estate-image.webp"
  const slugName = cleanName.toLowerCase().replace(/[^a-z0-9.]+/g, "-")

  const title = context?.title || "Luxury Estate Architectural View"
  const category = context?.category || "Residences"
  const city = context?.city || "Mangaluru, India"

  const generatedAlt = `${title} - ${category} in ${city}`.slice(0, 125)

  return {
    url,
    alt: generatedAlt,
    isDecorative: false,
    title,
    caption: `${title} luxury estate preview`,
    description: `High-resolution architectural view of ${title} situated in ${city}. Verified clear legal title portfolio.`,
    seoFileName: slugName,
    originalFileName: cleanName,
    focusKeyword: `${title} ${city}`.toLowerCase(),
    imageType: "photo",

    aiDescription: `This image depicts the architectural features of ${title}, an exclusive ${category} asset in ${city}. It serves as verified visual documentation for prospective buyers and institutional investors.`,
    entities: {
      brand: "JayaListing",
      product: title,
      place: city,
      topic: `${category} Real Estate`,
    },
    relatedQuestion: `What architectural features and exterior designs are available at ${title}?`,
    transcript: "",
    location: {
      city: context?.city || "Mangaluru",
      region: "Karnataka",
      country: "India",
      latitude: 12.9141,
      longitude: 74.856,
    },
    creator: DEFAULT_IMAGE_SEO_SETTINGS.defaultCreator,
    credit: DEFAULT_IMAGE_SEO_SETTINGS.defaultCredit,
    copyright: DEFAULT_IMAGE_SEO_SETTINGS.defaultCopyright,
    license: DEFAULT_IMAGE_SEO_SETTINGS.defaultLicense,
    isAiGenerated: false,

    allowIndex: true,
    includeInSitemap: true,
    lazyLoad: true,
    priority: false,
    socialShareOverride: false,

    width: 1600,
    height: 1067,
    fileSizeBytes: 180000,
    format: "webp",
    score: 85,
    updatedAt: new Date().toISOString(),
  }
}

