import { NextRequest, NextResponse } from "next/server"
import { processImageUpload } from "@/lib/image-processing"
import { storeFile } from "@/lib/storage"

export const dynamic = "force-dynamic"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB limit
const ALLOWED_MIME_TYPES = [
  "image/webp",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/avif",
  "image/svg+xml",
]

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided in request" },
        { status: 400 }
      )
    }

    // 1. Validate File Size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Image exceeds maximum allowed size of 10 MB. Current: ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        },
        { status: 400 }
      )
    }

    // 2. Validate MIME Type
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported image format: ${file.type}. Allowed formats: WebP, JPEG, PNG, AVIF.`,
        },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    // 3. Process once at upload with sharp: strip EXIF, resize, encode AVIF + WebP + JPEG in 3 widths
    const processed = await processImageUpload(inputBuffer)

    // 4. Store all generated variants into object storage / disk with immutable caching
    const variantUrls: Record<string, string> = {}
    let primaryUrl = ""
    let primaryStorageProvider = "local_disk"

    for (const variant of processed.variants) {
      const stored = await storeFile(variant.key, variant.buffer, variant.contentType)
      variantUrls[variant.key] = stored.url
      if (variant.key === processed.primaryKey) {
        primaryUrl = stored.url
        primaryStorageProvider = stored.provider
      }
    }

    const primaryFileName = processed.primaryKey
    const primarySize = processed.primaryBuffer.length

    return NextResponse.json({
      success: true,
      url: primaryUrl,
      fileName: primaryFileName,
      contentHash: processed.contentHash,
      width: processed.originalWidth,
      height: processed.originalHeight,
      size: primarySize,
      format: "webp",
      storage: primaryStorageProvider,
      variants: variantUrls,
      message: `Image processed with EXIF stripped, AVIF+WebP+JPEG variants generated, and stored via ${primaryStorageProvider} (${(primarySize / 1024).toFixed(1)} KB)`,
    })
  } catch (error: any) {
    console.error("Upload API Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process image upload" },
      { status: 500 }
    )
  }
}
