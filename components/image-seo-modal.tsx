"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  RefreshCw,
  Globe,
  Sliders,
  Shield,
  FileText,
  MapPin,
  Lock,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageSeoData, ImageType, createDefaultImageSeo } from "@/lib/image-seo"
import { calculateImageSeoScore, ScoreResult } from "@/lib/image-seo-scoring"

interface ImageSeoModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  propertyContext?: {
    title?: string
    location?: string
    category?: string
    price?: string
  }
  onSave?: (savedData: ImageSeoData) => void
}

export default function ImageSeoModal({
  isOpen,
  onClose,
  imageUrl,
  propertyContext,
  onSave,
}: ImageSeoModalProps) {
  const [formData, setFormData] = useState<ImageSeoData>(() =>
    createDefaultImageSeo(imageUrl, {
      title: propertyContext?.title,
      category: propertyContext?.category,
      city: propertyContext?.location,
    })
  )
  const [activeTab, setActiveTab] = useState<"basic" | "aeo" | "controls" | "score">("basic")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [scoreResult, setScoreResult] = useState<ScoreResult>(() => calculateImageSeoScore(formData))
  const lastDraftPayloadRef = useRef<string>("")

  // Fetch existing record if present
  useEffect(() => {
    if (!isOpen || !imageUrl) return

    setIsLoading(true)
    setSaveStatus(null)

    fetch(`/api/image-seo?url=${encodeURIComponent(imageUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setFormData(data.data)
          setScoreResult(calculateImageSeoScore(data.data))
        } else {
          const def = createDefaultImageSeo(imageUrl, {
            title: propertyContext?.title,
            category: propertyContext?.category,
            city: propertyContext?.location,
          })
          setFormData(def)
          setScoreResult(calculateImageSeoScore(def))
        }
      })
      .catch(() => {
        const def = createDefaultImageSeo(imageUrl, {
          title: propertyContext?.title,
          category: propertyContext?.category,
          city: propertyContext?.location,
        })
        setFormData(def)
        setScoreResult(calculateImageSeoScore(def))
      })
      .finally(() => setIsLoading(false))
  }, [isOpen, imageUrl, propertyContext])

  // Recalculate score live whenever formData updates
  useEffect(() => {
    const res = calculateImageSeoScore(formData)
    setScoreResult(res)
  }, [formData])

  if (!isOpen) return null

  // Handler for form field updates
  const updateField = (field: keyof ImageSeoData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updateEntity = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      entities: { ...prev.entities, [key]: value },
    }))
  }

  const updateLocation = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, [key]: value },
    }))
  }

  // "Suggest with AI" Handler - Only on explicit user button click with input hash caching
  const handleAiSuggest = async () => {
    const payload = JSON.stringify({
      propertyTitle: propertyContext?.title || formData.title,
      propertyLocation: propertyContext?.location || formData.location?.city,
      propertyCategory: propertyContext?.category,
      propertyPrice: propertyContext?.price,
      existingFileName: formData.seoFileName,
      imageType: formData.imageType,
    })

    if (lastDraftPayloadRef.current === payload) {
      setSaveStatus("AI draft recommendations are already up-to-date with this asset context.")
      return
    }

    setIsSuggesting(true)
    try {
      const res = await fetch("/api/image-seo/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      })
      const result = await res.json()
      if (result.success && result.data) {
        lastDraftPayloadRef.current = payload
        setFormData((prev) => ({
          ...prev,
          ...result.data,
          url: prev.url, // preserve URL
        }))
        setSaveStatus(
          result.cached
            ? "AI draft loaded from cache (zero inference cost). Click 'Save' to confirm."
            : "AI drafted recommendations applied for review! Click 'Save' to confirm."
        )
      }
    } catch (e: any) {
      alert("AI suggestion failed: " + e.message)
    } finally {
      setIsSuggesting(false)
    }
  }

  // Save Handler
  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus("Saving metadata & ranking signals...")

    try {
      // 1. If file name changed and is local /uploads, call rename endpoint
      if (formData.seoFileName && formData.originalFileName && formData.seoFileName !== formData.originalFileName) {
        const renameRes = await fetch("/api/image-seo/rename", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldUrl: formData.url,
            newFileName: formData.seoFileName,
          }),
        })
        const renameData = await renameRes.json()
        if (renameData.success && renameData.newUrl) {
          formData.url = renameData.newUrl
        }
      }

      // 2. Save full SEO record
      const res = await fetch("/api/image-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          score: scoreResult.totalScore,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSaveStatus("Image SEO, AEO & GEO metadata saved successfully!")
        if (onSave) onSave(data.data)
        setTimeout(() => {
          onClose()
        }, 1200)
      } else {
        setSaveStatus("Error: " + (data.error || "Failed to save"))
      }
    } catch (err: any) {
      setSaveStatus("Save error: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const scoreBadgeColor =
    scoreResult.totalScore >= 85
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : scoreResult.totalScore >= 70
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : "bg-rose-100 text-rose-800 border-rose-300"

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-4xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-900 to-amber-600 text-white flex items-center justify-center shadow-md font-black text-sm">
              SEO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-stone-900 dark:text-white">
                  Image SEO, AEO & GEO Manager
                </h3>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${scoreBadgeColor}`}>
                  Score: {scoreResult.totalScore}/100 ({scoreResult.grade})
                </span>
              </div>
              <p className="text-[11px] text-stone-500 line-clamp-1 max-w-md">
                Targeting Google Images, Bing, Perplexity, ChatGPT & Google AI Overviews
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAiSuggest}
              disabled={isSuggesting}
              className="text-xs font-bold gap-1.5 border-amber-500/40 hover:bg-amber-50 text-amber-900 dark:text-amber-300"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-600 ${isSuggesting ? "animate-spin" : ""}`} />
              <span>{isSuggesting ? "Drafting..." : "Suggest with AI"}</span>
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Preview & Right Tabs */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Image Preview + Mini Score Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="relative aspect-video sm:aspect-4/3 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 shadow-inner">
              <img
                src={formData.url}
                alt={formData.alt || "Preview"}
                className="w-full h-full object-cover"
              />
              {formData.isDecorative && (
                <div className="absolute top-2 left-2 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                  Decorative (alt=&quot;&quot;)
                </div>
              )}
            </div>

            {/* Score Breakdown Card */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Live Audit Checklist
                </span>
                <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
                  {scoreResult.totalScore}%
                </span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {scoreResult.checklist.map((item) => (
                  <div key={item.id} className="text-xs flex items-start gap-2">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        item.status === "green"
                          ? "bg-emerald-500"
                          : item.status === "yellow"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-stone-800 dark:text-stone-200 leading-tight">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-stone-500 leading-snug">{item.message}</p>
                      {item.fixSuggestion && item.status !== "green" && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                          Tip: {item.fixSuggestion}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Tabbed Controls */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            
            {/* Tabs Bar */}
            <div className="flex border-b border-stone-200 dark:border-stone-800 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === "basic"
                    ? "border-amber-600 text-amber-700 dark:text-amber-400"
                    : "border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
                }`}
              >
                1. Basic Image SEO
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("aeo")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === "aeo"
                    ? "border-amber-600 text-amber-700 dark:text-amber-400"
                    : "border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
                }`}
              >
                2. AEO & GEO Signals (AI Search)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("controls")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === "controls"
                    ? "border-amber-600 text-amber-700 dark:text-amber-400"
                    : "border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
                }`}
              >
                3. Indexing & Controls
              </button>
            </div>

            {/* TAB 1: BASIC SEO */}
            {activeTab === "basic" && (
              <div className="space-y-4">
                {/* Alt Text & Decorative Checkbox */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      Alt Text <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          (formData.alt?.length || 0) > 125 ? "text-amber-600" : "text-stone-500"
                        }`}
                      >
                        {formData.alt?.length || 0}/125 chars
                      </span>
                      <label className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isDecorative}
                          onChange={(e) => updateField("isDecorative", e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>Decorative image (alt=&quot;&quot;)</span>
                      </label>
                    </div>
                  </div>
                  <Textarea
                    disabled={formData.isDecorative}
                    rows={2}
                    value={formData.isDecorative ? "" : formData.alt}
                    onChange={(e) => updateField("alt", e.target.value)}
                    placeholder="e.g. Master suite balcony overlooking Arabian Sea with floor-to-ceiling glass"
                    className="text-xs rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SEO File Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      SEO File Name (lowercase-hyphenated)
                    </label>
                    <Input
                      value={formData.seoFileName}
                      onChange={(e) => updateField("seoFileName", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      placeholder="e.g. sovereign-penthouse-terrace.webp"
                      className="text-xs rounded-xl font-mono"
                    />
                    <p className="text-[10px] text-stone-500">Automatic 301 redirect kept if renamed.</p>
                  </div>

                  {/* Image Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      Visual Content Type
                    </label>
                    <select
                      value={formData.imageType}
                      onChange={(e) => updateField("imageType", e.target.value as ImageType)}
                      className="w-full h-9 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 text-xs font-medium"
                    >
                      <option value="photo">Photograph (Real Estate View)</option>
                      <option value="product">Product / Property Unit</option>
                      <option value="infographic">Infographic</option>
                      <option value="chart">Chart / Market Growth</option>
                      <option value="diagram">Architectural Floorplan / Diagram</option>
                      <option value="screenshot">Screenshot / Verification Document</option>
                      <option value="logo">Emblem / Brand Logo</option>
                    </select>
                  </div>
                </div>

                {/* Focus Keyword & Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-800 dark:text-stone-200">Focus Keyword</label>
                    <Input
                      value={formData.focusKeyword}
                      onChange={(e) => updateField("focusKeyword", e.target.value)}
                      placeholder="e.g. duplex penthouse mumbai sea face"
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-800 dark:text-stone-200">HTML Title Attribute</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder="e.g. Sovereign Penthouse Panoramic View"
                      className="text-xs rounded-xl"
                    />
                  </div>
                </div>

                {/* Caption & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      Caption (&lt;figcaption&gt;)
                    </label>
                    <Input
                      value={formData.caption}
                      onChange={(e) => updateField("caption", e.target.value)}
                      placeholder="Visible caption below image"
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-800 dark:text-stone-200">Schema Description</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      placeholder="In-depth image description for ImageObject"
                      className="text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: AEO & GEO SIGNALS */}
            {activeTab === "aeo" && (
              <div className="space-y-4">
                {/* AI Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    AI Contextual Description (for ChatGPT, Gemini & Perplexity)
                  </label>
                  <Textarea
                    rows={2}
                    value={formData.aiDescription}
                    onChange={(e) => updateField("aiDescription", e.target.value)}
                    placeholder="1-2 plain sentences explaining what this image shows and why it is authoritative on the page."
                    className="text-xs rounded-xl"
                  />
                  <p className="text-[10px] text-stone-500">
                    Answer engines consume this to synthesize accurate visual descriptions in conversational overviews.
                  </p>
                </div>

                {/* Entities */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    Knowledge Graph Entities
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Input
                      value={formData.entities?.brand || ""}
                      onChange={(e) => updateEntity("brand", e.target.value)}
                      placeholder="Brand (JayaListing)"
                      className="text-xs rounded-xl"
                    />
                    <Input
                      value={formData.entities?.product || ""}
                      onChange={(e) => updateEntity("product", e.target.value)}
                      placeholder="Product / Estate"
                      className="text-xs rounded-xl"
                    />
                    <Input
                      value={formData.entities?.place || ""}
                      onChange={(e) => updateEntity("place", e.target.value)}
                      placeholder="Place (City, State)"
                      className="text-xs rounded-xl"
                    />
                    <Input
                      value={formData.entities?.topic || ""}
                      onChange={(e) => updateEntity("topic", e.target.value)}
                      placeholder="Topic (Luxury Real Estate)"
                      className="text-xs rounded-xl"
                    />
                  </div>
                </div>

                {/* Related Question */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    Target Question This Image Answers
                  </label>
                  <Input
                    value={formData.relatedQuestion || ""}
                    onChange={(e) => updateField("relatedQuestion", e.target.value)}
                    placeholder="e.g. What are the bedroom dimensions and balcony orientations?"
                    className="text-xs rounded-xl"
                  />
                </div>

                {/* Text Transcript */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    Text-In-Image Transcript (Infographics, Floorplans & Charts)
                  </label>
                  <Textarea
                    rows={2}
                    value={formData.transcript || ""}
                    onChange={(e) => updateField("transcript", e.target.value)}
                    placeholder="Transcribe any text, dimensions, floor plan labels, or stats embedded in the graphic..."
                    className="text-xs rounded-xl"
                  />
                  <p className="text-[10px] text-stone-500">
                    Rendered visibly near the image so web crawlers and AI bots can index embedded graphic facts.
                  </p>
                </div>

                {/* Rights & Licensing */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-800 dark:text-stone-200">Creator / Photographer</label>
                    <Input
                      value={formData.creator}
                      onChange={(e) => updateField("creator", e.target.value)}
                      className="text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-800 dark:text-stone-200">Credit Text</label>
                    <Input
                      value={formData.credit}
                      onChange={(e) => updateField("credit", e.target.value)}
                      className="text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-800 dark:text-stone-200">Copyright Notice</label>
                    <Input
                      value={formData.copyright}
                      onChange={(e) => updateField("copyright", e.target.value)}
                      className="text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CONTROLS & INDEXING */}
            {activeTab === "controls" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Allow Indexing */}
                  <label className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-start gap-3 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900/40">
                    <input
                      type="checkbox"
                      checked={formData.allowIndex}
                      onChange={(e) => updateField("allowIndex", e.target.checked)}
                      className="mt-1 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-stone-900 dark:text-white block">
                        Allow Search Engines to Index Image
                      </span>
                      <span className="text-[11px] text-stone-500 leading-tight block mt-0.5">
                        When disabled, serves X-Robots-Tag: noindex header for this asset.
                      </span>
                    </div>
                  </label>

                  {/* Include in Image Sitemap */}
                  <label className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-start gap-3 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900/40">
                    <input
                      type="checkbox"
                      checked={formData.includeInSitemap}
                      onChange={(e) => updateField("includeInSitemap", e.target.checked)}
                      className="mt-1 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-stone-900 dark:text-white block">
                        Include in XML Image Sitemap
                      </span>
                      <span className="text-[11px] text-stone-500 leading-tight block mt-0.5">
                        Included in sitemap-images.xml for Google Image discoverability.
                      </span>
                    </div>
                  </label>

                  {/* High Priority (fetchpriority="high") */}
                  <label className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-start gap-3 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900/40">
                    <input
                      type="checkbox"
                      checked={formData.priority}
                      onChange={(e) => updateField("priority", e.target.checked)}
                      className="mt-1 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-stone-900 dark:text-white block">
                        High Priority LCP Image (fetchpriority=&quot;high&quot;)
                      </span>
                      <span className="text-[11px] text-stone-500 leading-tight block mt-0.5">
                        Preloads hero / primary cover photo for fastest Largest Contentful Paint.
                      </span>
                    </div>
                  </label>

                  {/* AI Generated Toggle */}
                  <label className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-start gap-3 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900/40">
                    <input
                      type="checkbox"
                      checked={formData.isAiGenerated}
                      onChange={(e) => updateField("isAiGenerated", e.target.checked)}
                      className="mt-1 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-stone-900 dark:text-white block">
                        Mark as AI-Generated Imagery
                      </span>
                      <span className="text-[11px] text-stone-500 leading-tight block mt-0.5">
                        Embeds DigitalSourceType IPTC/Schema compliance tag.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Geo Location coordinates */}
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-stone-200">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>Geo-Tagging Coordinates (contentLocation in Schema)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Input
                      value={formData.location?.city || ""}
                      onChange={(e) => updateLocation("city", e.target.value)}
                      placeholder="City"
                      className="text-xs rounded-xl"
                    />
                    <Input
                      value={formData.location?.region || ""}
                      onChange={(e) => updateLocation("region", e.target.value)}
                      placeholder="State / Region"
                      className="text-xs rounded-xl"
                    />
                    <Input
                      type="number"
                      step="any"
                      value={formData.location?.latitude || ""}
                      onChange={(e) => updateLocation("latitude", parseFloat(e.target.value) || 0)}
                      placeholder="Latitude"
                      className="text-xs rounded-xl"
                    />
                    <Input
                      type="number"
                      step="any"
                      value={formData.location?.longitude || ""}
                      onChange={(e) => updateLocation("longitude", parseFloat(e.target.value) || 0)}
                      placeholder="Longitude"
                      className="text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-50 dark:bg-stone-950">
          <div className="text-xs font-medium">
            {saveStatus ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{saveStatus}</span>
            ) : (
              <span className="text-stone-500">
                SEO changes will instantly update Schema.org JSON-LD and Image Sitemap.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-bold flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 text-stone-950 font-black text-xs px-5 shadow-md flex-1 sm:flex-initial gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save Image SEO"}</span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}

