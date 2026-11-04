"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Sparkles,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Globe,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  FileText,
  Image as ImageIcon,
  Check,
  ChevronRight,
  Eye,
  Settings,
  Layers,
  ArrowUpDown,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImageSeoData, ImageSeoSettings, DEFAULT_IMAGE_SEO_SETTINGS } from "@/lib/image-seo"
import ImageSeoModal from "@/components/image-seo-modal"

export default function AdminImageSeoManager() {
  const [images, setImages] = useState<ImageSeoData[]>([])
  const [stats, setStats] = useState({
    totalImages: 0,
    avgScore: 0,
    missingAlt: 0,
    missingAiDesc: 0,
    missingTranscript: 0,
    missingCredit: 0,
    oversized: 0,
    noindex: 0,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [loading, setLoading] = useState(false)
  const [editingImage, setEditingImage] = useState<string | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [settings, setSettings] = useState<ImageSeoSettings>(DEFAULT_IMAGE_SEO_SETTINGS)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsStatus, setSettingsStatus] = useState<string | null>(null)
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const [testBotUrl, setTestBotUrl] = useState("/uploads/estate-sample.webp")
  const [testBotAgent, setTestBotAgent] = useState("Googlebot-Image")
  const fileImportRef = useRef<HTMLInputElement>(null)

  // Fetch Images & Dashboard Stats
  const fetchImageData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/image-seo?search=${encodeURIComponent(searchQuery)}&filter=${activeFilter}`)
      const data = await res.json()
      if (data.success) {
        setImages(data.data || [])
        if (data.stats) setStats(data.stats)
      }
    } catch (e) {
      console.error("Failed to load image SEO data:", e)
    } finally {
      setLoading(false)
    }
  }

  // Fetch Global Settings
  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/image-seo/settings")
      const data = await res.json()
      if (data.success && data.data) {
        setSettings(data.data)
      }
    } catch (e) {
      console.warn("Failed to load image SEO settings:", e)
    }
  }

  useEffect(() => {
    fetchImageData()
    fetchSettings()
  }, [activeFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchImageData()
  }

  // CSV Export
  const handleExportCsv = () => {
    window.location.href = "/api/image-seo/export"
  }

  // CSV Import
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    try {
      const res = await fetch("/api/image-seo/import", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: text,
      })
      const result = await res.json()
      if (result.success) {
        alert(result.message || "CSV imported successfully!")
        fetchImageData()
      } else {
        alert("Import failed: " + (result.error || "Unknown error"))
      }
    } catch (err: any) {
      alert("Import error: " + err.message)
    } finally {
      if (fileImportRef.current) fileImportRef.current.value = ""
    }
  }

  // Save Settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true)
    setSettingsStatus(null)
    try {
      const res = await fetch("/api/image-seo/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (data.success) {
        setSettingsStatus("Global defaults and crawler rules updated successfully!")
        setTimeout(() => setShowSettingsModal(false), 1200)
      } else {
        setSettingsStatus("Error saving settings")
      }
    } catch (e: any) {
      setSettingsStatus("Error: " + e.message)
    } finally {
      setIsSavingSettings(false)
    }
  }

  // Bulk Apply Handler
  const handleBulkAction = async (action: "allowIndex" | "disallowIndex" | "includeSitemap") => {
    if (selectedUrls.length === 0) return
    const items = selectedUrls.map((url) => {
      const existing = images.find((i) => i.url === url)
      return {
        ...existing,
        url,
        allowIndex: action === "allowIndex" ? true : action === "disallowIndex" ? false : existing?.allowIndex ?? true,
        includeInSitemap: action === "includeSitemap" ? true : existing?.includeInSitemap ?? true,
      }
    })

    try {
      const res = await fetch("/api/image-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      const result = await res.json()
      if (result.success) {
        setSelectedUrls([])
        fetchImageData()
      }
    } catch (e) {
      console.error("Bulk action failed:", e)
    }
  }

  // Crawler Simulation Test
  const isAllowedTest = () => {
    if (settings.crawlerRules) {
      const rules = settings.crawlerRules as any
      if (testBotAgent === "Googlebot-Image") return rules.googlebotImage !== false
      if (testBotAgent === "Bingbot") return rules.bingbot !== false
      if (testBotAgent === "GPTBot") return rules.gptBot !== false
      if (testBotAgent === "ClaudeBot") return rules.claudeBot !== false
      if (testBotAgent === "PerplexityBot") return rules.perplexityBot !== false
      if (testBotAgent === "CCBot") return rules.ccBot === true
    }
    return true
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. KPI Statistics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Total Images</div>
          <div className="text-xl font-black text-stone-900 dark:text-white mt-0.5">{stats.totalImages}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-500/20 shadow-xs text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Avg SEO Score</div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{stats.avgScore}/100</div>
        </div>

        <div
          onClick={() => setActiveFilter("missing_alt")}
          className={`p-3.5 rounded-2xl border shadow-xs text-center cursor-pointer transition ${
            activeFilter === "missing_alt"
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-1 ring-rose-500"
              : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-rose-300"
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Missing Alt</div>
          <div className="text-xl font-black text-rose-700 dark:text-rose-400 mt-0.5">{stats.missingAlt}</div>
        </div>

        <div
          onClick={() => setActiveFilter("missing_ai")}
          className={`p-3.5 rounded-2xl border shadow-xs text-center cursor-pointer transition ${
            activeFilter === "missing_ai"
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-1 ring-amber-500"
              : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-amber-300"
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Missing AEO/AI</div>
          <div className="text-xl font-black text-amber-700 dark:text-amber-400 mt-0.5">{stats.missingAiDesc}</div>
        </div>

        <div
          onClick={() => setActiveFilter("missing_transcript")}
          className={`p-3.5 rounded-2xl border shadow-xs text-center cursor-pointer transition ${
            activeFilter === "missing_transcript"
              ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-1 ring-purple-500"
              : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-purple-300"
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600">No Transcript</div>
          <div className="text-xl font-black text-purple-700 dark:text-purple-400 mt-0.5">{stats.missingTranscript}</div>
        </div>

        <div
          onClick={() => setActiveFilter("missing_credit")}
          className={`p-3.5 rounded-2xl border shadow-xs text-center cursor-pointer transition ${
            activeFilter === "missing_credit"
              ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500"
              : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-blue-300"
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">No Credit</div>
          <div className="text-xl font-black text-blue-700 dark:text-blue-400 mt-0.5">{stats.missingCredit}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Oversized (&gt;400KB)</div>
          <div className="text-xl font-black text-stone-700 dark:text-stone-300 mt-0.5">{stats.oversized}</div>
        </div>

        <div
          onClick={() => setActiveFilter("noindex")}
          className={`p-3.5 rounded-2xl border shadow-xs text-center cursor-pointer transition ${
            activeFilter === "noindex"
              ? "bg-stone-200 dark:bg-stone-800 border-stone-500"
              : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800"
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">NoIndex</div>
          <div className="text-xl font-black text-stone-900 dark:text-white mt-0.5">{stats.noindex}</div>
        </div>
      </div>

      {/* 2. Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
        
        {/* Search & Filter */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by file name, alt text, focus keyword, or city..."
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="h-10 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 font-semibold"
          >
            <option value="all">All Images ({stats.totalImages})</option>
            <option value="missing_alt">Missing Alt Text</option>
            <option value="missing_ai">Missing AEO / AI Context</option>
            <option value="missing_transcript">Missing Visual Transcript</option>
            <option value="missing_credit">Missing Copyright/Credit</option>
            <option value="low_score">Low Score (&lt;70)</option>
            <option value="noindex">NoIndex Only</option>
          </select>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedUrls.length > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 px-2 py-1 rounded-xl">
              <span className="text-[11px] font-black text-amber-900 dark:text-amber-300 px-1">
                {selectedUrls.length} selected:
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction("allowIndex")}
                className="h-7 text-[10px] font-bold"
              >
                Set Indexable
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction("includeSitemap")}
                className="h-7 text-[10px] font-bold"
              >
                Add to Sitemap
              </Button>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchImageData}
            disabled={loading}
            className="h-10 text-xs font-bold rounded-xl gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-10 text-xs font-bold rounded-xl gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>

          <label className="cursor-pointer">
            <input
              type="file"
              ref={fileImportRef}
              accept=".csv"
              onChange={handleImportFileChange}
              className="hidden"
            />
            <div className="h-10 px-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </div>
          </label>

          <Button
            type="button"
            size="sm"
            onClick={() => setShowSettingsModal(true)}
            className="h-10 px-4 text-xs font-black rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 text-stone-950 shadow-md gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Global Defaults &amp; Robots</span>
          </Button>
        </div>
      </div>

      {/* 3. Images Inventory Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-600" />
            <h4 className="font-extrabold text-sm text-stone-900 dark:text-white">
              Visual Portfolio Inventory ({images.length} images)
            </h4>
          </div>
          <div className="text-xs text-stone-500">
            XML Sitemap:{" "}
            <a
              href="/sitemap-images.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 font-bold hover:underline"
            >
              /sitemap-images.xml ↗
            </a>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="p-12 text-center text-stone-400">
            <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-bold text-sm">No images match current filter</p>
            <p className="text-xs text-stone-500 mt-1">Upload property imagery or reset filter to view all.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/50 text-stone-500 font-bold">
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedUrls.length === images.length && images.length > 0}
                      onChange={(e) => setSelectedUrls(e.target.checked ? images.map((i) => i.url) : [])}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                  </th>
                  <th className="p-3.5 w-24">Preview</th>
                  <th className="p-3.5">File Name &amp; Title</th>
                  <th className="p-3.5">Alt Text / Decorative</th>
                  <th className="p-3.5">AEO &amp; AI Description</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 w-24 text-center">Score</th>
                  <th className="p-3.5 w-28 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {images.map((img) => {
                  const isChecked = selectedUrls.includes(img.url)
                  const score = img.score ?? 85
                  const scoreBadge =
                    score >= 85
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : score >= 70
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-rose-100 text-rose-800 border-rose-300"

                  return (
                    <tr
                      key={img.url}
                      className="hover:bg-stone-50/60 dark:hover:bg-stone-950/40 transition-colors group"
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedUrls([...selectedUrls, img.url])
                            else setSelectedUrls(selectedUrls.filter((u) => u !== img.url))
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                      </td>

                      <td className="p-3.5">
                        <div className="w-16 h-12 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950">
                          <img src={img.url} alt={img.alt || "Preview"} className="w-full h-full object-cover" />
                        </div>
                      </td>

                      <td className="p-3.5 max-w-[220px]">
                        <p className="font-bold text-stone-900 dark:text-white truncate">
                          {img.seoFileName || img.url.split("/").pop()}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">{img.title || "No title attribute"}</p>
                        <span className="inline-block mt-1 text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {img.imageType || "photo"}
                        </span>
                      </td>

                      <td className="p-3.5 max-w-[240px]">
                        {img.isDecorative ? (
                          <span className="text-stone-400 italic">Decorative (alt=&quot;&quot;)</span>
                        ) : img.alt ? (
                          <p className="text-stone-800 dark:text-stone-200 line-clamp-2 leading-snug">{img.alt}</p>
                        ) : (
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Missing Alt
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 max-w-[240px]">
                        {img.aiDescription ? (
                          <p className="text-stone-600 dark:text-stone-300 line-clamp-2 leading-snug">
                            {img.aiDescription}
                          </p>
                        ) : (
                          <span className="text-amber-600 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Needs AI Context
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-col gap-1 text-[10px]">
                          <span className={img.allowIndex !== false ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                            {img.allowIndex !== false ? "● Indexable" : "✕ NoIndex"}
                          </span>
                          <span className={img.includeInSitemap !== false ? "text-stone-500" : "text-stone-400 line-through"}>
                            {img.includeInSitemap !== false ? "Sitemap: Yes" : "Sitemap: Excluded"}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`inline-block text-[11px] font-mono font-black px-2 py-0.5 rounded-full border ${scoreBadge}`}>
                          {score}%
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingImage(img.url)}
                          className="h-8 text-xs font-bold rounded-xl border-amber-500/40 text-amber-900 dark:text-amber-300 hover:bg-amber-50"
                        >
                          <Sparkles className="w-3 h-3 mr-1 text-amber-600" />
                          Edit SEO
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Global Settings & Robots.txt Drawer / Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl w-full max-w-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-base text-stone-900 dark:text-white">
                  Global Image SEO Defaults &amp; Robots.txt Crawler Control
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto flex-1">
              
              {/* Alt Text Template */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-900 dark:text-white">
                  Alt Text Fallback Template (Used when specific alt is empty)
                </label>
                <Input
                  value={settings.altTemplate}
                  onChange={(e) => setSettings({ ...settings, altTemplate: e.target.value })}
                  className="text-xs rounded-xl font-mono"
                />
                <p className="text-[11px] text-stone-500">
                  Supported tokens: <code className="bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">{"{title}"}</code>, <code className="bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">{"{category}"}</code>, <code className="bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">{"{city}"}</code>, <code className="bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">{"{brand}"}</code>
                </p>
              </div>

              {/* Default Rights & Licensing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-800 dark:text-stone-200">Default Creator Studio</label>
                  <Input
                    value={settings.defaultCreator}
                    onChange={(e) => setSettings({ ...settings, defaultCreator: e.target.value })}
                    className="text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-800 dark:text-stone-200">Default Credit Notice</label>
                  <Input
                    value={settings.defaultCredit}
                    onChange={(e) => setSettings({ ...settings, defaultCredit: e.target.value })}
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Robots.txt Crawler Control Toggles */}
              <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-white">
                      Search &amp; AI Crawler Robots.txt Rules
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Fine-grained allow/block controls for image search and generative models. Note: robots.txt is an advisory protocol.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Googlebot-Image */}
                  <label className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900">
                    <div>
                      <span className="font-bold block">Googlebot-Image</span>
                      <span className="text-[10px] text-stone-500">Google Images indexation</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.crawlerRules?.googlebotImage !== false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          crawlerRules: { ...settings.crawlerRules, googlebotImage: e.target.checked },
                        })
                      }
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                  </label>

                  {/* Bingbot */}
                  <label className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900">
                    <div>
                      <span className="font-bold block">Bingbot</span>
                      <span className="text-[10px] text-stone-500">Bing &amp; Microsoft Copilot images</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.crawlerRules?.bingbot !== false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          crawlerRules: { ...settings.crawlerRules, bingbot: e.target.checked },
                        })
                      }
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                  </label>

                  {/* GPTBot / OpenAI */}
                  <label className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900">
                    <div>
                      <span className="font-bold block">OAI-SearchBot &amp; ChatGPT</span>
                      <span className="text-[10px] text-stone-500">ChatGPT real-time web retrieval</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.crawlerRules?.oaiSearchBot !== false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          crawlerRules: { ...settings.crawlerRules, oaiSearchBot: e.target.checked },
                        })
                      }
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                  </label>

                  {/* ClaudeBot */}
                  <label className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900">
                    <div>
                      <span className="font-bold block">Claude-SearchBot</span>
                      <span className="text-[10px] text-stone-500">Anthropic Claude search retrieval</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.crawlerRules?.claudeSearchBot !== false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          crawlerRules: { ...settings.crawlerRules, claudeSearchBot: e.target.checked },
                        })
                      }
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                  </label>

                  {/* PerplexityBot */}
                  <label className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900">
                    <div>
                      <span className="font-bold block">PerplexityBot</span>
                      <span className="text-[10px] text-stone-500">Perplexity AI Answer Engine</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.crawlerRules?.perplexityBot !== false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          crawlerRules: { ...settings.crawlerRules, perplexityBot: e.target.checked },
                        })
                      }
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                  </label>

                  {/* Common Crawl (CCBot) */}
                  <label className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900">
                    <div>
                      <span className="font-bold block">CCBot (Common Crawl)</span>
                      <span className="text-[10px] text-stone-500">Bulk web archive crawler</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.crawlerRules?.ccBot === true}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          crawlerRules: { ...settings.crawlerRules, ccBot: e.target.checked },
                        })
                      }
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                  </label>
                </div>
              </div>

              {/* Robots.txt Live Simulator & Preview */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300">
                    Robots.txt Live Verification Test
                  </span>
                  <a
                    href="/robots.txt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-amber-700 hover:underline"
                  >
                    View Active /robots.txt ↗
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={testBotAgent}
                    onChange={(e) => setTestBotAgent(e.target.value)}
                    className="h-9 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-2"
                  >
                    <option value="Googlebot-Image">Googlebot-Image</option>
                    <option value="Bingbot">Bingbot</option>
                    <option value="GPTBot">GPTBot (OpenAI)</option>
                    <option value="ClaudeBot">ClaudeBot</option>
                    <option value="PerplexityBot">PerplexityBot</option>
                    <option value="CCBot">CCBot</option>
                  </select>

                  <Input
                    value={testBotUrl}
                    onChange={(e) => setTestBotUrl(e.target.value)}
                    placeholder="/uploads/sample.webp"
                    className="h-9 text-xs rounded-xl font-mono sm:col-span-2"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border text-xs flex items-center justify-between">
                  <span className="text-stone-600 dark:text-stone-300">
                    Test Result for <strong>{testBotAgent}</strong> accessing <code>{testBotUrl}</code>:
                  </span>
                  <span
                    className={`font-black uppercase px-2 py-0.5 rounded-full text-[10px] ${
                      isAllowedTest()
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-rose-100 text-rose-800 border border-rose-300"
                    }`}
                  >
                    {isAllowedTest() ? "✓ ALLOWED" : "✕ BLOCKED"}
                  </span>
                </div>
              </div>

            </div>

            <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950">
              <span className="text-xs font-semibold text-emerald-600">
                {settingsStatus || ""}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowSettingsModal(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="bg-amber-600 hover:bg-amber-700 text-stone-950 font-black text-xs px-5 shadow-sm"
                >
                  {isSavingSettings ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 5. Embedded Single Image Modal */}
      {editingImage && (
        <ImageSeoModal
          isOpen={!!editingImage}
          imageUrl={editingImage}
          onClose={() => setEditingImage(null)}
          onSave={() => {
            fetchImageData()
            setEditingImage(null)
          }}
        />
      )}

    </div>
  )
}

