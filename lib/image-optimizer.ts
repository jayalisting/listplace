/**
 * Utility for client-side image compression and WebP conversion.
 * Ensures images for luxury listings look ultra-crisp while reducing file size by 80-95%
 * to minimize bandwidth, disk space, and database footprint.
 */

export interface CompressionResult {
  file: File
  dataUrl: string
  originalSize: number
  compressedSize: number
  savingsPercent: number
  width: number
  height: number
  format: string
}

/**
 * Compresses and converts an image file to WebP format with maximum width/height constraints.
 * 
 * Recommended standards:
 * - Max Width: 1600px (Crisp for Retina 4K displays while avoiding multi-megabyte bloat)
 * - Format: WebP (30-40% smaller than JPEG, 80% smaller than PNG at identical visual quality)
 * - Quality: 0.82 (Virtually indistinguishable from lossless, typical size 100KB - 250KB)
 */
export async function optimizeImageClient(
  file: File,
  maxWidth = 1600,
  maxHeight = 1200,
  quality = 0.82
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Selected file is not an image"))
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error("Failed to load image for optimization"))
      img.onload = () => {
        let width = img.naturalWidth || img.width
        let height = img.naturalHeight || img.height

        // Calculate aspect-ratio preserved dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          return reject(new Error("Failed to get canvas 2D context"))
        }

        // High quality image smoothing for crisp, beautiful visuals
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, 0, 0, width, height)

        const exportFormat = "image/webp"

        const produceBlob = (targetQuality: number): Promise<Blob> => {
          return new Promise((res, rej) => {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  res(blob)
                } else {
                  // Fallback to jpeg if browser lacks webp export support
                  canvas.toBlob(
                    (fallbackBlob) => {
                      if (fallbackBlob) res(fallbackBlob)
                      else rej(new Error("Failed to convert image to WebP/JPEG"))
                    },
                    "image/jpeg",
                    targetQuality
                  )
                }
              },
              exportFormat,
              targetQuality
            )
          })
        }

        produceBlob(quality)
          .then(async (blob) => {
            // Adaptive compression: if output is larger than 600 KB, recompress at 0.74 to save disk
            let finalBlob = blob
            let finalQuality = quality
            if (blob.size > 600 * 1024) {
              try {
                finalQuality = 0.74
                const smallerBlob = await produceBlob(finalQuality)
                if (smallerBlob.size < blob.size) {
                  finalBlob = smallerBlob
                }
              } catch {
                // Keep original blob if retry fails
              }
            }

            // Create clean filename with .webp extension
            const originalName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name
            const cleanName = `${originalName.replace(/[^a-zA-Z0-9_-]/g, "_")}.webp`

            const optimizedFile = new File([finalBlob], cleanName, {
              type: finalBlob.type || exportFormat,
              lastModified: Date.now(),
            })

            const originalSize = file.size
            const compressedSize = finalBlob.size
            const savingsPercent = Math.max(
              0,
              Math.round(((originalSize - compressedSize) / originalSize) * 100)
            )

            const dataUrl = canvas.toDataURL(finalBlob.type || exportFormat, finalQuality)

            resolve({
              file: optimizedFile,
              dataUrl,
              originalSize,
              compressedSize,
              savingsPercent,
              width,
              height,
              format: "webp",
            })
          })
          .catch((err) => reject(err))
      }

      img.src = e.target?.result as string
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Format bytes into human-readable string (KB, MB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
