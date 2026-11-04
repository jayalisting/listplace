"use client"

import { useState, useRef, ChangeEvent, DragEvent } from "react"
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Info,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { optimizeImageClient, formatBytes } from "@/lib/image-optimizer"
import ImageSeoModal from "@/components/image-seo-modal"

interface ImageUploadManagerProps {
  images: string[]
  onChange: (images: string[]) => void
  label?: string
  helperText?: string
  propertyContext?: {
    title?: string
    location?: string
    category?: string
    price?: string
  }
}

export default function ImageUploadManager({
  images,
  onChange,
  label = "Property Imagery & Gallery",
  helperText = "Cover photo will be used as the primary listing card thumbnail.",
  propertyContext,
}: ImageUploadManagerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [manualUrlInput, setManualUrlInput] = useState("")
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [selectedSeoImage, setSelectedSeoImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file processing: client-side compression -> server upload
  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return

    setIsUploading(true)
    setErrorMessage(null)
    setUploadStatus("Optimizing & converting to WebP...")

    const newUploadedUrls: string[] = []
    let totalSaved = 0
    let filesProcessed = 0

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          setErrorMessage(`Skipped "${file.name}": Not an image file.`)
          continue
        }

        // Raw file limit check (30 MB raw input, auto-compressed to ~150 KB WebP)
        if (file.size > 30 * 1024 * 1024) {
          setErrorMessage(
            `File "${file.name}" (${formatBytes(file.size)}) exceeds the 30 MB limit. Please select a smaller photo.`
          )
          continue
        }

        setUploadStatus(`Compressing ${file.name}...`)

        // 1. Client-Side Optimization (WebP, max 1600px width, quality 0.82)
        const optimized = await optimizeImageClient(file, 1600, 1200, 0.82)
        totalSaved += (optimized.originalSize - optimized.compressedSize)

        setUploadStatus(
          `Uploading ${file.name} (${formatBytes(optimized.compressedSize)} WebP)...`
        )

        // 2. Server Upload
        const formData = new FormData()
        formData.append("file", optimized.file)

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        const data = await res.json()
        if (data.success && data.url) {
          newUploadedUrls.push(data.url)
          filesProcessed++
        } else {
          setErrorMessage(data.error || `Failed to upload "${file.name}"`)
        }
      }

      if (newUploadedUrls.length > 0) {
        onChange([...images, ...newUploadedUrls])
        const savedText = totalSaved > 0 ? ` (Saved ${formatBytes(totalSaved)} with WebP!)` : ""
        setUploadStatus(
          `✓ Successfully added ${filesProcessed} optimized WebP ${filesProcessed === 1 ? "image" : "images"}${savedText}`
        )
        setTimeout(() => setUploadStatus(null), 5000)
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process image")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleSetCover = (index: number) => {
    if (index === 0) return
    const updated = [...images]
    const [selected] = updated.splice(index, 1)
    updated.unshift(selected)
    onChange(updated)
  }

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handleAddManualUrl = () => {
    const trimmed = manualUrlInput.trim()
    if (!trimmed) return
    onChange([...images, trimmed])
    setManualUrlInput("")
    setShowUrlInput(false)
  }

  return (
    <div className="space-y-3">
      {/* Label and Guidance Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-rose-800 dark:text-rose-400" />
            <span>{label}</span>
            <span className="text-[10px] text-gray-400 font-normal">
              ({images.length} {images.length === 1 ? "image" : "images"})
            </span>
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{helperText}</p>
        </div>

        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] font-semibold text-rose-800 dark:text-rose-400 hover:underline text-left sm:text-right"
        >
          {showUrlInput ? "Hide URL Input" : "+ Paste External Image URL"}
        </button>
      </div>

      {/* Recommended Format & Cost Guide Banner */}
      <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300/40 text-[11px] text-amber-950 dark:text-amber-200 flex items-start space-x-2">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold">
            Best Image Format & Size for Lowest Database & Bandwidth Cost:
          </div>
          <div className="text-[10.5px] leading-relaxed text-amber-900 dark:text-amber-300">
            • <span className="font-bold">Format:</span> <span className="underline">WebP</span> (Auto-compressed to 100–250 KB; 30–80% lighter than JPEG/PNG).<br />
            • <span className="font-bold">Target Resolution:</span> 1600 × 1000 px max (ultra-sharp for Retina/4K displays, zero lag).<br />
            • <span className="font-bold">Database Zero-Cost:</span> Only lightweight URL paths are stored in PostgreSQL (`/uploads/...webp`), preventing database bloat and keeping load speeds instant.
          </div>
        </div>
      </div>

      {/* Manual URL Input drawer */}
      {showUrlInput && (
        <div className="flex gap-2 p-3 bg-slate-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 animate-in fade-in duration-150">
          <Input
            type="url"
            value={manualUrlInput}
            onChange={(e) => setManualUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddManualUrl()
              }
            }}
            placeholder="https://images.unsplash.com/photo-..."
            className="h-9 text-xs rounded-lg flex-1"
          />
          <Button
            type="button"
            onClick={handleAddManualUrl}
            size="sm"
            className="h-9 px-3 text-xs bg-rose-900 text-white rounded-lg hover:bg-rose-950"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add URL
          </Button>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-2 ${
          isDragging
            ? "border-rose-800 bg-rose-50/60 dark:bg-rose-950/30 scale-[1.01]"
            : "border-gray-300 dark:border-gray-700 hover:border-rose-800/60 bg-white dark:bg-gray-900/60 hover:bg-rose-50/20"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 flex items-center justify-center shadow-xs">
          {isUploading ? (
            <RefreshCw className="w-5 h-5 animate-spin text-rose-800" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
        </div>

        <div>
          <span className="text-xs font-bold text-gray-900 dark:text-white">
            Click to upload images or drag & drop
          </span>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
            Auto-converts to WebP & caps to 1600px | High visual quality with 85–95% storage savings
          </p>
        </div>
      </div>

      {/* Status & Error Feedback */}
      {uploadStatus && (
        <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/40 p-2.5 rounded-xl flex items-center space-x-1.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{uploadStatus}</span>
        </div>
      )}

      {errorMessage && (
        <div className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-300/40 p-2.5 rounded-xl flex items-center space-x-1.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Thumbnail Gallery & Re-ordering */}
      {images.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] uppercase font-bold text-gray-400">
            Active Photos (Drag or click star to set Cover Photo):
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((imgUrl, index) => {
              const isCover = index === 0
              return (
                <div
                  key={`${imgUrl}-${index}`}
                  className={`group relative aspect-[16/10] rounded-xl overflow-hidden border bg-slate-900 shadow-xs transition-all ${
                    isCover
                      ? "ring-2 ring-amber-400 border-amber-500 shadow-md"
                      : "border-gray-200 dark:border-gray-700 hover:border-rose-900/40"
                  }`}
                >
                  <Image
                    src={imgUrl}
                    alt={`Property Photo ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />

                  {/* Cover Photo Badge */}
                  {isCover && (
                    <div className="absolute top-1.5 left-1.5 bg-amber-400 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-md flex items-center space-x-1">
                      <Star className="w-2.5 h-2.5 fill-slate-950" />
                      <span>Cover Photo</span>
                    </div>
                  )}

                  {/* Actions Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5 p-2">
                    {!isCover && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSetCover(index)
                        }}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center space-x-1 shadow-sm transition-transform active:scale-95"
                        title="Set as primary cover photo"
                      >
                        <Star className="w-3 h-3 fill-slate-950" />
                        <span>Cover</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedSeoImage(imgUrl)
                      }}
                      className="bg-rose-900 hover:bg-rose-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center space-x-1 shadow-sm transition-transform active:scale-95 border border-amber-400/40"
                      title="Configure Image SEO, AEO & GEO metadata"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>SEO</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveImage(index)
                      }}
                      className="bg-red-600/90 hover:bg-red-600 text-white p-1.5 rounded-lg shadow-sm transition-transform active:scale-95"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Embedded Image SEO, AEO & GEO Modal */}
      {selectedSeoImage && (
        <ImageSeoModal
          isOpen={!!selectedSeoImage}
          imageUrl={selectedSeoImage}
          propertyContext={propertyContext}
          onClose={() => setSelectedSeoImage(null)}
          onSave={(saved) => {
            // Update URL in array if renamed
            if (saved.url !== selectedSeoImage) {
              const updated = images.map((u) => (u === selectedSeoImage ? saved.url : u))
              onChange(updated)
            }
          }}
        />
      )}
    </div>
  )
}
