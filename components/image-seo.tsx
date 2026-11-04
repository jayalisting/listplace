"use client"

import React, { useState } from "react"
import { ImageSeoData } from "@/lib/image-seo"
import { FileText, Eye, ChevronDown } from "lucide-react"

export interface SeoImageProps {
  src: string
  alt?: string
  seoData?: Partial<ImageSeoData>
  width?: number
  height?: number
  className?: string
  priority?: boolean
  showCaption?: boolean
  showTranscript?: boolean
  sizes?: string
}

/**
 * High-Performance SEO, AEO & GEO Image Component
 * Renders semantic, crawlable <img> and <picture> tags with fallback chain,
 * explicit dimensions to prevent CLS, and accessible transcripts for charts/infographics.
 */
export default function SeoImage({
  src,
  alt: propAlt,
  seoData,
  width = 1200,
  height = 800,
  className = "",
  priority = false,
  showCaption = true,
  showTranscript = true,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: SeoImageProps) {
  const [transcriptOpen, setTranscriptOpen] = useState(false)

  // 1. Fallback Chain: propAlt -> seoData.alt -> caption -> title -> cleaned file name
  const cleanFileName = src.split("/").pop()?.split("?")[0].replace(/[-_]/g, " ").replace(/\.[^/.]+$/, "") || "estate architectural view"
  let computedAlt = ""

  if (seoData?.isDecorative) {
    computedAlt = ""
  } else {
    computedAlt =
      propAlt ||
      seoData?.alt ||
      seoData?.caption ||
      seoData?.title ||
      cleanFileName
  }

  const computedTitle = seoData?.title || computedAlt
  const computedCaption = seoData?.caption
  const isHighPriority = priority || seoData?.priority || false
  const loadingMode = isHighPriority ? "eager" : seoData?.lazyLoad === false ? "eager" : "lazy"
  const fetchPriorityVal = isHighPriority ? "high" : "auto"
  const transcript = seoData?.transcript

  const imageElement = (
    <picture>
      {/* If WebP format available */}
      {src.endsWith(".webp") && (
        <source srcSet={src} type="image/webp" />
      )}
      <img
        src={src}
        alt={computedAlt}
        title={computedTitle}
        width={width}
        height={height}
        loading={loadingMode}
        decoding="async"
        fetchPriority={fetchPriorityVal}
        sizes={sizes}
        className={className}
      />
    </picture>
  )

  // If caption exists, wrap in semantic <figure>/<figcaption>
  const withFigure = computedCaption && showCaption ? (
    <figure className="m-0 p-0">
      {imageElement}
      <figcaption className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 italic text-center">
        {computedCaption}
      </figcaption>
    </figure>
  ) : (
    imageElement
  )

  // If transcript exists (charts, infographics, diagrams, floorplans), render accessible text block
  if (transcript && showTranscript && transcript.trim().length > 0) {
    return (
      <div className="space-y-2">
        {withFigure}
        <div className="bg-stone-50 dark:bg-stone-900/60 p-3 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
          <button
            type="button"
            onClick={() => setTranscriptOpen(!transcriptOpen)}
            className="flex items-center justify-between w-full font-bold text-stone-700 dark:text-stone-300 text-left hover:text-amber-700 transition"
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>Visual Text Transcript / Diagram Breakdown</span>
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${transcriptOpen ? "rotate-180" : ""}`} />
          </button>
          {transcriptOpen && (
            <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 leading-relaxed">
              {transcript}
            </div>
          )}
        </div>
      </div>
    )
  }

  return withFigure
}

