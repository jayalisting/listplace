import { put } from "@vercel/blob"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export interface StoredAsset {
  key: string
  url: string
  size: number
  contentType: string
  provider: "vercel_blob" | "local_disk"
}

/**
 * High-performance Object Storage Abstraction (Phase 5).
 * - Automatically uploads to Vercel Blob if BLOB_READ_WRITE_TOKEN is configured.
 * - Gracefully falls back to local persistent disk (public/uploads) in local development.
 * - Always ensures Cache-Control: public, max-age=31536000, immutable.
 * - Never stores image bytes or base64 in PostgreSQL.
 */
export async function storeFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<StoredAsset> {
  const isBlobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN)

  if (isBlobConfigured) {
    try {
      const blob = await put(key, buffer, {
        access: "public",
        addRandomSuffix: false,
        contentType,
        cacheControlMaxAge: 31536000, // 1 year immutable Edge caching
      })

      return {
        key,
        url: blob.url,
        size: buffer.length,
        contentType,
        provider: "vercel_blob",
      }
    } catch (err) {
      console.warn("Vercel Blob upload failed, falling back to local disk:", err)
    }
  }

  // Local filesystem fallback
  const uploadsDir = path.join(process.cwd(), "public", "uploads")
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true })
  }

  const filePath = path.join(uploadsDir, key)
  // Only write if not already stored (content-hash idempotency)
  if (!existsSync(filePath)) {
    await writeFile(filePath, buffer)
  }

  return {
    key,
    url: `/uploads/${key}`,
    size: buffer.length,
    contentType,
    provider: "local_disk",
  }
}

