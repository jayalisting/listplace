import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { existsSync } from "fs"
import crypto from "crypto"

export const dynamic = "force-dynamic"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB hard limit
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
          error: `Image exceeds maximum allowed size of 5 MB. Current: ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
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

    // 3. Ensure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // 4. Content-hash deduplication: Identical image uploads share the same file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentHash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 16)
    const ext = file.type === "image/webp" ? "webp" : path.extname(file.name).replace(".", "") || "webp"
    const fileName = `estate-${contentHash}.${ext}`
    const filePath = path.join(uploadsDir, fileName)

    // 5. Write file to disk only if it does not already exist
    let isDeduplicated = false
    if (existsSync(filePath)) {
      isDeduplicated = true
    } else {
      await writeFile(filePath, buffer)
    }

    const publicUrl = `/uploads/${fileName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      size: buffer.length,
      format: ext,
      deduplicated: isDeduplicated,
      message: isDeduplicated
        ? `Image matched existing asset (${(buffer.length / 1024).toFixed(1)} KB) - zero extra disk storage used`
        : `Image successfully uploaded (${(buffer.length / 1024).toFixed(1)} KB)`,
    })
  } catch (error: any) {
    console.error("Upload API Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process image upload" },
      { status: 500 }
    )
  }
}
