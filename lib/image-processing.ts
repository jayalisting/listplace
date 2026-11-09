import sharp from "sharp"
import crypto from "crypto"

export interface ProcessedVariant {
  width: number
  format: "avif" | "webp" | "jpeg"
  key: string
  buffer: Buffer
  contentType: string
}

export interface ImageProcessingResult {
  contentHash: string
  originalWidth: number
  originalHeight: number
  primaryKey: string
  primaryBuffer: Buffer
  primaryContentType: string
  variants: ProcessedVariant[]
}

export const TARGET_WIDTHS = [1600, 1080, 640] as const

/**
 * Image Processing Pipeline (Phase 5).
 * - Strips EXIF metadata to ensure visitor privacy and eliminate metadata byte bloat.
 * - Resizes to standard responsive widths (1600w, 1080w, 640w) without upscaling.
 * - Encodes AVIF (ultra-dense), WebP (broad modern support), and progressive JPEG fallback.
 * - Names all assets by SHA-256 content hash for deduplication and immutable caching.
 */
export async function processImageUpload(
  inputBuffer: Buffer
): Promise<ImageProcessingResult> {
  // 1. Calculate SHA-256 content hash of the input for immutable naming
  const contentHash = crypto
    .createHash("sha256")
    .update(inputBuffer)
    .digest("hex")
    .slice(0, 16)

  // 2. Read image metadata & auto-orient via EXIF while stripping all EXIF tags from output
  const imageInstance = sharp(inputBuffer).rotate() // rotate auto-orients from EXIF orientation
  const metadata = await imageInstance.metadata()

  const originalWidth = metadata.width || 1600
  const originalHeight = metadata.height || 1080

  const variants: ProcessedVariant[] = []

  // 3. Process base full-resolution formats
  const baseWebp = await imageInstance
    .clone()
    .resize({ width: Math.min(originalWidth, 1920), withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toBuffer()

  const baseAvif = await imageInstance
    .clone()
    .resize({ width: Math.min(originalWidth, 1920), withoutEnlargement: true })
    .avif({ quality: 75, effort: 4 })
    .toBuffer()

  const baseJpeg = await imageInstance
    .clone()
    .resize({ width: Math.min(originalWidth, 1920), withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true, mozjpeg: true })
    .toBuffer()

  const primaryKey = `estate-${contentHash}.webp`
  variants.push({
    width: originalWidth,
    format: "webp",
    key: primaryKey,
    buffer: baseWebp,
    contentType: "image/webp",
  })

  variants.push({
    width: originalWidth,
    format: "avif",
    key: `estate-${contentHash}.avif`,
    buffer: baseAvif,
    contentType: "image/avif",
  })

  variants.push({
    width: originalWidth,
    format: "jpeg",
    key: `estate-${contentHash}.jpg`,
    buffer: baseJpeg,
    contentType: "image/jpeg",
  })

  // 4. Generate responsive width variants (1600w, 1080w, 640w)
  for (const targetWidth of TARGET_WIDTHS) {
    if (originalWidth >= targetWidth - 50) {
      // AVIF variant
      const avifBuf = await imageInstance
        .clone()
        .resize({ width: targetWidth, withoutEnlargement: true })
        .avif({ quality: 75, effort: 3 })
        .toBuffer()

      variants.push({
        width: targetWidth,
        format: "avif",
        key: `estate-${contentHash}-${targetWidth}w.avif`,
        buffer: avifBuf,
        contentType: "image/avif",
      })

      // WebP variant
      const webpBuf = await imageInstance
        .clone()
        .resize({ width: targetWidth, withoutEnlargement: true })
        .webp({ quality: 80, effort: 3 })
        .toBuffer()

      variants.push({
        width: targetWidth,
        format: "webp",
        key: `estate-${contentHash}-${targetWidth}w.webp`,
        buffer: webpBuf,
        contentType: "image/webp",
      })

      // JPEG fallback variant
      const jpegBuf = await imageInstance
        .clone()
        .resize({ width: targetWidth, withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer()

      variants.push({
        width: targetWidth,
        format: "jpeg",
        key: `estate-${contentHash}-${targetWidth}w.jpg`,
        buffer: jpegBuf,
        contentType: "image/jpeg",
      })
    }
  }

  return {
    contentHash,
    originalWidth,
    originalHeight,
    primaryKey,
    primaryBuffer: baseWebp,
    primaryContentType: "image/webp",
    variants,
  }
}
