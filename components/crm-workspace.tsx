"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Filter,
  HardDrive,
  Kanban,
  LayoutGrid,
  List,
  MapPin,
  MessageCircle,
  MoreVertical,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  Star,
  Table as TableIcon,
  Trash2,
  Upload,
  UserCheck,
  Users,
  Video,
  X,
  Zap,
  AlertCircle,
  ExternalLink,
  Copy,
  ChevronRight,
  TrendingUp,
  Lock,
  Link2,
  Briefcase,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  CrmState,
  CrmProperty,
  CrmPerson,
  CrmTask,
  CrmFile,
  PropertyStatus,
  LeadStatus,
} from "@/lib/crm-types"

// ── Constants & Lookup Arrays ──────────────────────────────────────────────
const STATUSES: PropertyStatus[] = [
  "New lead",
  "Collecting info",
  "Documents verified",
  "Listed",
  "Site visits",
  "Negotiation",
  "Token paid",
  "Agreement",
  "Registration pending",
  "Sold",
  "On hold",
  "Dropped",
]

const PROPERTY_TYPES = [
  "Agricultural land",
  "Plantation",
  "Plot / site",
  "House",
  "Villa",
  "Apartment",
  "Commercial",
  "Other",
]

const CONTACT_ROLES = [
  "Owner",
  "Broker",
  "Buyer / Lead",
  "Family member",
  "Lawyer",
  "Surveyor",
  "Other",
]

const DOC_TYPES = [
  "RTC / Pahani",
  "Mutation",
  "Khata",
  "Sale deed",
  "EC",
  "Survey sketch / Tippan",
  "Conversion order",
  "Tax receipt",
  "Partition / Gift / Will",
  "Power of Attorney",
  "Agreement",
  "ID proof",
  "Photo",
  "Other",
]

const REQUIRED_DOCS = [
  "RTC / Pahani",
  "Mutation",
  "Khata",
  "EC",
  "Survey sketch / Tippan",
  "ID proof",
]

const TASK_CATEGORIES = [
  { id: "social", label: "📱 Social Media Post", color: "#ec4899" },
  { id: "content", label: "🎬 Content Creation", color: "#8b5cf6" },
  { id: "olx", label: "🌐 Listing on Portals (OLX)", color: "#f59e0b" },
  { id: "visit", label: "🚗 Site Visit", color: "#3b82f6" },
  { id: "call", label: "📞 Client / Owner Call", color: "#10b981" },
  { id: "docs", label: "📑 Document & Legal", color: "#6366f1" },
  { id: "deal", label: "🤝 Negotiation & Token", color: "#ef4444" },
  { id: "other", label: "📝 Other Work", color: "#6b7280" },
]

const LEAD_STATUSES: LeadStatus[] = [
  "New Inquiry",
  "Contacted",
  "Requirements Noted",
  "Site Visit Scheduled",
  "Negotiation",
  "Deal Closed",
  "Cold / Dropped",
]

const STATUS_COLORS: Record<string, string> = {
  "New lead": "#6366f1",
  "Collecting info": "#8b5cf6",
  "Documents verified": "#06b6d4",
  Listed: "#0f6b55",
  "Site visits": "#f59e0b",
  Negotiation: "#ef4444",
  "Token paid": "#10b981",
  Agreement: "#3b82f6",
  "Registration pending": "#f97316",
  Sold: "#22c55e",
  "On hold": "#9ca3af",
  Dropped: "#6b7280",
}

const LEAD_STATUS_COLORS: Record<string, string> = {
  "New Inquiry": "#6366f1",
  Contacted: "#8b5cf6",
  "Requirements Noted": "#06b6d4",
  "Site Visit Scheduled": "#3b82f6",
  Negotiation: "#f59e0b",
  "Deal Closed": "#10b981",
  "Cold / Dropped": "#6b7280",
}

// ── Helpers ────────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

const todayStr = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

const formatINR = (n: number | string | undefined | null) => {
  if (!n) return "—"
  const val = Number(n)
  if (isNaN(val) || val === 0) return "—"
  let str = "₹" + val.toLocaleString("en-IN")
  if (val >= 10000000) str += ` (${(val / 10000000).toFixed(2)} Cr)`
  else if (val >= 100000) str += ` (${(val / 100000).toFixed(2)} L)`
  return str
}

const formatDateTime = (ts: number | undefined) =>
  ts ? new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"

const formatDate = (s: string | undefined) =>
  s ? new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—"

const waUrl = (p: string | undefined) =>
  "https://wa.me/" + String(p || "").replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")

const DEFAULT_CRM_DATA: CrmState = {
  people: [],
  props: [],
  tasks: [],
  files: [],
  trash: [],
  settings: { followupRules: {}, whatsappTemplates: [], savedViews: [] },
  version: 1,
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function CrmWorkspace({ initialPropId }: { initialPropId?: string } = {}) {
  const [db, setDb] = useState<CrmState>(DEFAULT_CRM_DATA)
  const [isLoading, setIsLoading] = useState(true)
  const [nav, setNav] = useState<{ screen: "today" | "props" | "people" | "backup" | "prop" | "person"; id?: string }>({
    screen: "today",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [saveStatus, setSaveStatus] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [peopleTab, setPeopleTab] = useState<"all" | "leads" | "owners" | "brokers" | "starred">("all")
  const [taskFilter, setTaskFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"card" | "table" | "kanban">("card")
  const [isSyncingPortfolio, setIsSyncingPortfolio] = useState(false)
  const [syncNotice, setSyncNotice] = useState<string | null>(null)

  // Broker Inline Add State
  const [brokerForm, setBrokerForm] = useState({ name: "", phone: "", commission: "", note: "" })
  const [showAddBroker, setShowAddBroker] = useState(false)

  // Modals & Panels
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [activeModal, setActiveModal] = useState<any>(null)
  const [adjustTask, setAdjustTask] = useState<CrmTask | null>(null)
  const [activeLogBar, setActiveLogBar] = useState<{ personId?: string; propId?: string } | null>(null)

  const isDirty = useRef(false)

  // Listen to initialPropId or ?prop= query param to jump straight to property
  useEffect(() => {
    if (!db?.props?.length) return
    const target = initialPropId || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("prop") : null)
    if (target) {
      const matched = db.props.find((p) => p.id === target || String(p.linkedPropertyId || "") === String(target))
      if (matched) {
        setNav({ screen: "prop", id: matched.id })
      }
    }
  }, [initialPropId, db?.props?.length])

  // 1. Fetch CRM State from PostgreSQL
  async function fetchCrmState() {
    try {
      const res = await fetch("/api/crm/db")
      const data = await res.json()
      setDb({
        people: Array.isArray(data?.people) ? data.people : [],
        props: Array.isArray(data?.props) ? data.props : [],
        tasks: Array.isArray(data?.tasks) ? data.tasks : [],
        files: Array.isArray(data?.files) ? data.files : [],
        trash: Array.isArray(data?.trash) ? data.trash : [],
        settings: data?.settings || { followupRules: {}, whatsappTemplates: [], savedViews: [] },
        version: typeof data?.version === "number" ? data.version : 1,
      })
    } catch (err) {
      console.error("Failed to load CRM state:", err)
      setDb(DEFAULT_CRM_DATA)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCrmState()
  }, [])

  // 2. Debounced Save to PostgreSQL crm_store
  useEffect(() => {
    if (!db || !isDirty.current) return
    const timer = setTimeout(() => {
      fetch("/api/crm/db", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(db),
      })
        .then((r) => r.json())
        .then((r) => {
          if (r.error === "stale") {
            setSaveStatus("⚠ Version Conflict — Reloading")
            fetchCrmState()
          } else {
            setSaveStatus("Saved to Neon ✓")
            if (r.version) {
              setDb((prev) => (prev ? { ...prev, version: r.version } : prev))
            }
          }
        })
        .catch(() => setSaveStatus("Save error"))
    }, 400)
    return () => clearTimeout(timer)
  }, [db])

  // 3. Global Keyboard Shortcuts: Cmd+K (Search) & 'N' (Quick Add)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        document.getElementById("crm-search-input")?.focus()
      } else if (e.key === "n" && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement?.tagName || "")) && !activeModal) {
        e.preventDefault()
        setShowQuickAdd(true)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeModal])

  if (!db) {
    return (
      <div className="crm-scope p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <div className="text-base font-bold">Loading Real Estate CRM...</div>
        <div className="text-xs text-slate-400 mt-1">Connecting to unified Neon PostgreSQL store</div>
      </div>
    )
  }

  // ── Mutators ─────────────────────────────────────────────────────────────
  const updateState = (fn: (d: CrmState) => CrmState) => {
    isDirty.current = true
    setSaveStatus("Saving…")
    setDb((prev) => (prev ? fn(structuredClone(prev)) : prev))
  }

  const navigateTo = (screen: any, id?: string) => {
    setSearchQuery("")
    setNav({ screen, id })
  }

  const getPerson = (id: string | undefined) => (db?.people || []).find((x) => x.id === id)
  const getProp = (id: string | undefined) => (db?.props || []).find((x) => x.id === id)

  const checkAlert = (p: CrmProperty | undefined): string => {
    if (!p) return ""
    if (["Sold", "Dropped"].includes(p.status)) return ""
    if (!p.nextDate) return "No next action set"
    if (p.nextDate < todayStr()) return `Next action overdue (${p.nextDate})`
    const daysSince = Math.floor((Date.now() - (p.updated || 0)) / 86400000)
    if (daysSince > 7) return `No activity for ${daysSince} days`
    return ""
  }

  // Sync JayaListing luxury listings into CRM
  async function handleSyncPortfolio() {
    setIsSyncingPortfolio(true)
    setSyncNotice(null)
    try {
      const res = await fetch("/api/crm/sync", { method: "POST" })
      const json = await res.json()
      if (json.success) {
        setSyncNotice(`✓ Successfully imported ${json.importedCount} estate(s) from JayaListing portfolio!`)
        if (json.data) setDb(json.data)
      } else {
        setSyncNotice(`Sync notice: ${json.error || "Completed"}`)
      }
    } catch {
      setSyncNotice("Failed to sync portfolio.")
    } finally {
      setIsSyncingPortfolio(false)
    }
  }

  // File Uploader
  async function uploadFiles(pid: string, files: FileList | File[], meta: any = {}) {
    for (const f of Array.from(files)) {
      const fd = new FormData()
      fd.append("file", f)
      fd.append("pid", pid)
      const res = await fetch("/api/crm/files", { method: "POST", body: fd })
      const json = await res.json()
      if (json.path) {
        updateState((d) => {
          d.files.push({
            id: uid(),
            pid,
            name: f.name,
            type: meta.type || (f.type.startsWith("image/") ? "Photo" : "Other"),
            ref: meta.ref || "",
            valid: meta.valid || "",
            path: json.path,
            mime: f.type,
            size: f.size,
            t: Date.now(),
          })
          const p = d.props.find((x) => x.id === pid)
          if (p) p.updated = Date.now()
          return d
        })
      }
    }
  }

  const deleteFile = (f: CrmFile) => {
    if (confirm(`Remove file "${f.name}"?`)) {
      fetch(`/api/crm/files?p=${encodeURIComponent(f.path)}`, { method: "DELETE" })
      updateState((d) => {
        d.files = d.files.filter((x) => x.id !== f.id)
        return d
      })
    }
  }

  // ── Smart Quick Add Parser ────────────────────────────────────────────────
  const parseQuickLine = (raw: string) => {
    const t = raw.trim()
    if (!t) return null
    const phone = t.match(/\b\d{10}\b/)?.[0]
    const lakh = t.match(/(\d+(?:\.\d+)?)\s*(?:l|lakh|lakhs)/i)?.[1]
    const crore = t.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/i)?.[1]
    const price = crore ? +crore * 10000000 : lakh ? +lakh * 100000 : null
    const areaM = t.match(/(\d+(?:\.\d+)?)\s*(acre|gunta|cent|sq\s*ft)/i)
    const area = areaM ? +areaM[1] : null
    const unit = areaM ? areaM[2].toLowerCase().replace(/\s+/, "") : null
    const isTask = /\b(call|visit|meet|remind|check|follow|post|olx|reel|content)\b/i.test(t)
    const vilM = t.match(/\b(?:in|at|near)\s+([A-Za-z]+)/i)
    const village = vilM ? vilM[1] : null
    const nameM = t.match(/^([A-Z][a-z]*(?:\s+[A-Z][a-z]*)*)/)
    const name = nameM ? nameM[1] : t.split(" ")[0]
    return { name, phone, price, area, unit, village, isTask, raw: t }
  }

  const handleQuickAddSubmit = (preview: any) => {
    if (!preview) return
    if (preview.isTask) {
      updateState((d) => {
        d.tasks.push({
          id: uid(),
          title: preview.raw,
          category: "Other",
          due: todayStr(),
          time: "10:00",
          done: false,
          pid: "",
        })
        return d
      })
    } else {
      const nextIdNum = 1 + Math.max(0, ...(db?.props || []).map((p) => parseInt(String(p?.id || "").replace(/\D/g, "") || "0", 10)))
      const pid = `PROP-${String(nextIdNum).padStart(4, "0")}`
      const personId = uid()
      updateState((d) => {
        if (preview.phone) {
          d.people.push({
            id: personId,
            name: preview.name,
            phone: preview.phone,
            roles: ["Owner"],
            village: preview.village || "",
            starred: false,
            tags: [],
            timeline: [],
          })
        }
        d.props.push({
          id: pid,
          name: preview.name + (preview.village ? " " + preview.village : ""),
          type: PROPERTY_TYPES[0],
          status: STATUSES[0],
          village: preview.village || "",
          area: preview.area || "",
          unit: preview.unit || "acre",
          price: preview.price || "",
          quote: "",
          owners: preview.phone ? [personId] : [],
          brokers: [],
          log: [{ t: Date.now(), x: "Created via Smart Quick Add" }],
          updated: Date.now(),
          starred: false,
          tags: [],
          timeline: [],
        })
        return d
      })
      navigateTo("prop", pid)
    }
    setShowQuickAdd(false)
  }

  // ── Work Schedules ────────────────────────────────────────────────────────
  const openTasks = (db?.tasks || [])
    .filter((x) => x && !x.done)
    .sort((a, b) => String(a?.due || "9999").localeCompare(String(b?.due || "9999")) || String(a?.time || "99:99").localeCompare(String(b?.time || "99:99")))

  const t0 = todayStr()

  return (
    <div className="crm-scope font-sans text-sm animate-in fade-in-50 duration-200">
      {/* ── Header Bar ── */}
      <header className="flex items-center justify-between gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div
            onClick={() => navigateTo("today")}
            className="flex items-center gap-2 cursor-pointer font-bold text-gray-900 dark:text-white"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-600/10 border border-emerald-600/30 flex items-center justify-center text-emerald-600 font-bold">
              🏡
            </div>
            <div>
              <div className="text-sm font-black tracking-tight leading-none">JayaListing CRM</div>
              <div className="text-[10px] text-slate-400 font-normal mt-0.5">Unified Real Estate Pipeline</div>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-1 ml-4">
            <button
              onClick={() => navigateTo("today")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                nav.screen === "today"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              📅 Today / Focus
            </button>
            <button
              onClick={() => navigateTo("props")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                nav.screen === "props" || nav.screen === "prop"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              🏡 Properties ({db.props.length})
            </button>
            <button
              onClick={() => navigateTo("people")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                nav.screen === "people" || nav.screen === "person"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              👥 People & Leads ({db.people.length})
            </button>
            <button
              onClick={() => navigateTo("backup")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                nav.screen === "backup"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              💾 Backup
            </button>
          </nav>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
          <div className="relative w-full max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="crm-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="⌘K Search properties, leads, survey..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <Button
            size="sm"
            onClick={() => setShowQuickAdd(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 rounded-xl shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Quick Add (N)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncPortfolio}
            disabled={isSyncingPortfolio}
            title="Import all properties from JayaListing into CRM pipeline"
            className="text-xs h-8 rounded-xl border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPortfolio ? "animate-spin" : ""}`} />
            <span className="hidden md:inline ml-1">Sync Portfolio</span>
          </Button>

          {saveStatus && (
            <span className="text-[11px] font-bold text-emerald-600 whitespace-nowrap hidden lg:inline">
              {saveStatus}
            </span>
          )}
        </div>
      </header>

      {syncNotice && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <span>{syncNotice}</span>
          <button onClick={() => setSyncNotice(null)} className="text-emerald-700 hover:opacity-75">✕</button>
        </div>
      )}

      {/* ── SEARCH OVERLAY RESULTS ── */}
      {searchQuery.trim() ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Search Results for "{searchQuery}"</h2>
          {/* Matched Properties */}
          <div className="card">
            <h3 className="font-bold text-sm mb-3">
              Matched Properties ({db.props.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.village?.toLowerCase().includes(searchQuery.toLowerCase())).length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {db.props
                .filter(
                  (p) =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.survey?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigateTo("prop", p.id)}
                    className="p-3 border rounded-xl hover:border-emerald-500 cursor-pointer transition-all bg-white dark:bg-gray-800"
                  >
                    <div className="font-bold text-sm">{p.name}</div>
                    <div className="text-xs text-slate-500 mt-1">📍 {p.village || "—"} · {p.area ? `${p.area} ${p.unit}` : ""}</div>
                    <div className="text-xs font-bold text-emerald-600 mt-2">{formatINR(p.quote || p.price)}</div>
                  </div>
                ))}
            </div>
          </div>

          {/* Matched People */}
          <div className="card">
            <h3 className="font-bold text-sm mb-3">
              Matched Contacts & Leads ({db.people.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.phone?.includes(searchQuery)).length})
            </h3>
            <div className="space-y-2">
              {db.people
                .filter(
                  (p) =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.phone?.includes(searchQuery)
                )
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 border rounded-xl">
                    <div>
                      <span className="font-bold text-sm cursor-pointer" onClick={() => navigateTo("person", p.id)}>{p.name}</span>
                      <span className="text-xs text-slate-500 ml-2">({(p.roles || []).join(", ")})</span>
                    </div>
                    {p.phone && (
                      <div className="flex items-center gap-2">
                        <a href={`tel:${p.phone}`} className="btn-sm">📞 Call</a>
                        <a href={waUrl(p.phone)} target="_blank" rel="noopener noreferrer" className="btn-sm btn-wa">💬 WhatsApp</a>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : nav.screen === "today" ? (
        /* ══════════════════════════════════════════════════════════════════════
           TODAY & DAILY WORK ACTION PLAN
           ══════════════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          {/* Top KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="card p-4 text-center">
              <div className="text-2xl font-black">{db.props.length}</div>
              <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">Properties</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-black text-indigo-600">
                {db.people.filter((p) => p.roles?.includes("Buyer / Lead") || p.leadStatus).length}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">Active Leads</div>
            </div>
            <div className="card p-4 text-center border-emerald-500/30">
              <div className="text-2xl font-black text-emerald-600">
                {openTasks.filter((x) => x.due === t0).length}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">Today's Tasks</div>
            </div>
            <div className="card p-4 text-center border-rose-500/30">
              <div className="text-2xl font-black text-rose-600">
                {openTasks.filter((x) => x.due && x.due < t0).length}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">Overdue</div>
            </div>
            <div className="card p-4 text-center border-amber-500/30">
              <div className="text-2xl font-black text-amber-600">
                {db.props.filter((p) => checkAlert(p)).length}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">Need Attention</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-lg font-black text-emerald-600">
                {(() => {
                  const tot = db.props.reduce((a, p) => a + (Number(p.quote || p.price) || 0), 0)
                  return tot >= 10000000 ? `${(tot / 10000000).toFixed(1)} Cr` : tot >= 100000 ? `${(tot / 100000).toFixed(0)} L` : "—"
                })()}
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">Pipeline Value</div>
            </div>
          </div>

          {/* Quick Work Creator Buttons */}
          <div className="card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Work Schedule Creator</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button
                className="work-btn"
                onClick={() =>
                  setActiveModal({
                    title: "Schedule Social Media Work",
                    cat: "📱 Social Media Post",
                    initial: "Post Instagram Reel & Story",
                  })
                }
              >
                📱 Social Media Post
              </button>
              <button
                className="work-btn"
                onClick={() =>
                  setActiveModal({
                    title: "Schedule Content Creation",
                    cat: "🎬 Content Creation",
                    initial: "Drone shoot & property reel",
                  })
                }
              >
                🎬 Content Shoot
              </button>
              <button
                className="work-btn"
                onClick={() =>
                  setActiveModal({
                    title: "Schedule Portal Listing",
                    cat: "🌐 Listing on Portals (OLX)",
                    initial: "Post on OLX, 99acres & Magicbricks",
                  })
                }
              >
                🌐 List on OLX
              </button>
              <button
                className="work-btn"
                onClick={() =>
                  setActiveModal({
                    title: "Schedule Site Visit",
                    cat: "🚗 Site Visit",
                    initial: "Site inspection with buyer",
                  })
                }
              >
                🚗 Site Visit
              </button>
              <button
                className="work-btn"
                onClick={() =>
                  setActiveModal({
                    title: "Schedule Follow-up Call",
                    cat: "📞 Client / Owner Call",
                    initial: "Follow up call with owner",
                  })
                }
              >
                📞 Client Call
              </button>
              <button
                className="work-btn"
                onClick={() =>
                  setActiveModal({
                    title: "Document Verification",
                    cat: "📑 Document & Legal",
                    initial: "Check RTC, Tippan & survey sketch",
                  })
                }
              >
                📑 Document Verification
              </button>
            </div>
          </div>

          {/* Daily Work Schedule & Tasks */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Daily Work Schedule & Tasks ({openTasks.length})</span>
              </h3>
              <div className="flex items-center gap-1 overflow-x-auto text-xs">
                {["all", "today", "overdue", "social", "content", "visit", "call"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTaskFilter(f)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs capitalize ${
                      taskFilter === f ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {openTasks
                .filter((x) => {
                  if (taskFilter === "today") return x.due === t0
                  if (taskFilter === "overdue") return x.due && x.due < t0
                  if (taskFilter === "social") return x.category?.includes("Social")
                  if (taskFilter === "content") return x.category?.includes("Content")
                  if (taskFilter === "visit") return x.category?.includes("Visit")
                  if (taskFilter === "call") return x.category?.includes("Call")
                  return true
                })
                .map((task) => {
                  const isOverdue = task.due && task.due < t0
                  const isToday = task.due === t0
                  const cat = TASK_CATEGORIES.find((c) => c.label === task.category) || TASK_CATEGORIES[7]

                  return (
                    <div
                      key={task.id}
                      className="p-3 border rounded-xl flex items-start justify-between gap-3 bg-white dark:bg-gray-800/60"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: cat.color + "20", color: cat.color }}
                          >
                            {task.category || "Task"}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isOverdue ? "bg-rose-100 text-rose-700" : isToday ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                            ⏰ {isToday ? "Today" : formatDate(task.due)} {task.time ? `· ${task.time}` : ""}
                          </span>
                        </div>
                        <div className="font-bold text-sm text-gray-900 dark:text-white">{task.title}</div>
                        {task.notes && <div className="text-xs text-slate-500 mt-1">{task.notes}</div>}
                        <div className="flex items-center gap-2 mt-2">
                          {task.pid && getProp(task.pid) && (
                            <span
                              onClick={() => navigateTo("prop", task.pid)}
                              className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                            >
                              🏡 {getProp(task.pid)?.name}
                            </span>
                          )}
                          {task.personId && getPerson(task.personId) && (
                            <span
                              onClick={() => navigateTo("person", task.personId)}
                              className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                            >
                              👤 {getPerson(task.personId)?.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAdjustTask(task)}
                          className="h-7 text-xs px-2"
                        >
                          ⏰ Reschedule
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            updateState((d) => {
                              const t = d.tasks.find((y) => y.id === task.id)
                              if (t) t.done = true
                              return d
                            })
                          }
                          className="h-7 text-xs px-2 bg-emerald-600 text-white font-bold"
                        >
                          ✓ Done
                        </Button>
                        <button
                          onClick={() =>
                            updateState((d) => {
                              d.tasks = d.tasks.filter((y) => y.id !== task.id)
                              return d
                            })
                          }
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )
                })}
              {openTasks.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  🎉 No open tasks! Use the buttons above to schedule property work or visits.
                </div>
              )}
            </div>
          </div>

          {/* Properties Needing Attention */}
          {db.props.some((p) => checkAlert(p)) && (
            <div className="card border-amber-500/30">
              <h3 className="font-bold text-sm text-amber-600 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Properties Needing Immediate Attention</span>
              </h3>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {db.props
                  .filter((p) => checkAlert(p))
                  .map((p) => (
                    <div key={p.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span
                          onClick={() => navigateTo("prop", p.id)}
                          className="font-bold text-sm cursor-pointer hover:underline text-gray-900 dark:text-white"
                        >
                          {p.name}
                        </span>
                        <span className="text-xs text-amber-600 font-semibold ml-3">⚠ {checkAlert(p)}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigateTo("prop", p.id)}
                        className="text-xs h-7"
                      >
                        Open Details →
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : nav.screen === "props" ? (
        /* ══════════════════════════════════════════════════════════════════════
           PROPERTIES PIPELINE (Cards, Kanban, Table)
           ══════════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Property Pipeline ({db.props.length})</h2>
              <div className="text-xs text-slate-500">Track and manage every property deal from initial inquiry to registration</div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-1.5 rounded-xl border"
              >
                <option value="">All Deal Statuses</option>
                <option value="⭐ Starred">⭐ Starred Only</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <div className="view-toggle">
                <button className={viewMode === "card" ? "on" : ""} onClick={() => setViewMode("card")}>
                  ⊞ Cards
                </button>
                <button className={viewMode === "table" ? "on" : ""} onClick={() => setViewMode("table")}>
                  ☰ Table
                </button>
                <button className={viewMode === "kanban" ? "on" : ""} onClick={() => setViewMode("kanban")}>
                  ⋮⋮⋮ Pipeline
                </button>
              </div>

              <Button
                size="sm"
                onClick={() =>
                  setActiveModal({
                    type: "new_prop",
                    title: "Add New Property Listing",
                  })
                }
                className="bg-emerald-600 text-white font-bold text-xs h-8 rounded-xl"
              >
                + Add Property
              </Button>
            </div>
          </div>

          {/* Kanban View */}
          {viewMode === "kanban" ? (
            <div className="kanban-board">
              {STATUSES.map((status) => {
                const colProps = db.props.filter(
                  (p) =>
                    p.status === status &&
                    (!statusFilter || statusFilter === status || (statusFilter === "⭐ Starred" && p.starred))
                )
                const colColor = STATUS_COLORS[status] || "#9ca3af"

                return (
                  <div key={status} className="kanban-col">
                    <div className="kanban-header" style={{ borderColor: colColor }}>
                      <span style={{ color: colColor, fontWeight: 700, fontSize: 13 }}>{status}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white" style={{ background: colColor }}>
                        {colProps.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {colProps.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => navigateTo("prop", p.id)}
                          className="kanban-card"
                        >
                          <div className="font-bold text-sm">{p.name}</div>
                          <div className="text-xs text-slate-500 mt-1">📍 {p.village || "—"} · {p.area ? `${p.area} ${p.unit}` : ""}</div>
                          <div className="text-xs font-bold text-emerald-600 mt-1">{formatINR(p.quote || p.price)}</div>
                          {p.next && (
                            <div className="text-[11px] text-indigo-600 font-semibold mt-2">
                              → {p.next}
                            </div>
                          )}
                        </div>
                      ))}
                      {colProps.length === 0 && (
                        <div className="text-center py-6 text-slate-400 text-xs">Empty</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : viewMode === "table" ? (
            /* Table View */
            <div className="card p-0 overflow-x-auto">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Property Name</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Brokers</th>
                    <th>Location</th>
                    <th>Area</th>
                    <th>Ask Price</th>
                    <th>My Quote</th>
                    <th>Next Action</th>
                  </tr>
                </thead>
                <tbody>
                  {db.props
                    .filter((p) => !statusFilter || (statusFilter === "⭐ Starred" ? p.starred : p.status === statusFilter))
                    .map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => navigateTo("prop", p.id)}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <td onClick={(e) => { e.stopPropagation(); updateState((d) => { const x = d.props.find((pr) => pr.id === p.id); if (x) x.starred = !x.starred; return d }) }}>
                          {p.starred ? "⭐" : "☆"}
                        </td>
                        <td className="font-bold">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{p.name}</span>
                            {p.linkedPropertyId && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                🔗 #{p.linkedPropertyId}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {p.priority ? (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              p.priority === "Urgent" ? "bg-rose-50 text-rose-700 border-rose-300 font-extrabold" :
                              p.priority === "High" ? "bg-amber-50 text-amber-800 border-amber-300" :
                              p.priority === "Low" ? "bg-slate-50 text-slate-600 border-slate-300" :
                              "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                              {p.priority === "Urgent" ? "🔴 Urgent" : p.priority === "High" ? "🟠 High" : p.priority === "Low" ? "⚪ Low" : "🔵 Normal"}
                            </span>
                          ) : <span className="text-slate-400 text-xs">—</span>}
                        </td>
                        <td>
                          <Badge style={{ background: (STATUS_COLORS[p.status] || "#999") + "20", color: STATUS_COLORS[p.status] || "#999" }}>
                            {p.status}
                          </Badge>
                        </td>
                        <td>{p.type}</td>
                        <td>
                          {(p.brokers || []).length > 0 ? (
                            <span className="font-bold text-indigo-600 text-xs">{(p.brokers || []).length} assigned</span>
                          ) : <span className="text-slate-400 text-xs">—</span>}
                        </td>
                        <td>{p.village || "—"}</td>
                        <td>{p.area ? `${p.area} ${p.unit}` : "—"}</td>
                        <td>{formatINR(p.price)}</td>
                        <td className="font-bold text-emerald-600">{formatINR(p.quote)}</td>
                        <td className="font-mono text-xs">{p.survey || "—"}</td>
                        <td>{p.next || "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Card Grid View */
            <div className="prop-grid">
              {db.props
                .filter((p) => !statusFilter || (statusFilter === "⭐ Starred" ? p.starred : p.status === statusFilter))
                .map((p) => {
                  const alert = checkAlert(p)
                  return (
                    <div
                      key={p.id}
                      onClick={() => navigateTo("prop", p.id)}
                      className="prop-card"
                    >
                      <div className="prop-card-header">
                        <div>
                          <div className="font-bold text-base text-gray-900 dark:text-white">{p.name}</div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: (STATUS_COLORS[p.status] || "#999") + "20", color: STATUS_COLORS[p.status] || "#999" }}
                            >
                              {p.status}
                            </span>
                            <span className="type-badge">{p.type}</span>
                            {p.priority && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  p.priority === "Urgent"
                                    ? "bg-rose-50 text-rose-700 border-rose-300 font-extrabold"
                                    : p.priority === "High"
                                    ? "bg-amber-50 text-amber-800 border-amber-300"
                                    : p.priority === "Low"
                                    ? "bg-slate-50 text-slate-600 border-slate-300"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}
                              >
                                {p.priority === "Urgent" ? "🔴 Urgent" : p.priority === "High" ? "🟠 High" : p.priority === "Low" ? "⚪ Low" : "🔵 Normal"}
                              </span>
                            )}
                            {p.linkedPropertyId && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                                <Link2 className="w-2.5 h-2.5" />
                                <span>#{p.linkedPropertyId}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateState((d) => {
                              const x = d.props.find((pr) => pr.id === p.id)
                              if (x) x.starred = !x.starred
                              return d
                            })
                          }}
                          className="star-btn"
                        >
                          {p.starred ? "⭐" : "☆"}
                        </button>
                      </div>

                      <div className="space-y-1 my-3 text-xs">
                        <div className="prop-field">
                          <span className="prop-label">📍 Location</span>
                          <span>{p.village || "—"}</span>
                        </div>
                        <div className="prop-field">
                          <span className="prop-label">📐 Area</span>
                          <span>{p.area ? `${p.area} ${p.unit}` : "—"}</span>
                        </div>
                        <div className="prop-field">
                          <span className="prop-label">💰 Ask Price</span>
                          <span>{formatINR(p.price)}</span>
                        </div>
                        <div className="prop-field">
                          <span className="prop-label">💼 My Quote</span>
                          <span className="font-bold text-emerald-600">{formatINR(p.quote)}</span>
                        </div>
                        <div className="prop-field">
                          <span className="prop-label">🔑 Survey</span>
                          <span className="font-mono">{p.survey || "—"}</span>
                        </div>
                        <div className="prop-field">
                          <span className="prop-label">📋 Next Action</span>
                          <span className="text-indigo-600 font-semibold">{p.next || "—"}</span>
                        </div>
                      </div>

                      {alert && <div className="prop-alert">⚠ {alert}</div>}

                      <div className="prop-card-footer text-[10px] text-slate-400">
                        <span>{p.id}</span>
                        <span>{formatDateTime(p.updated)}</span>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      ) : nav.screen === "prop" && getProp(nav.id) ? (
        /* ══════════════════════════════════════════════════════════════════════
           SINGLE PROPERTY DETAIL VIEW
           ══════════════════════════════════════════════════════════════════════ */
        (() => {
          const p = getProp(nav.id)!
          const id = p.id
          const files = (db?.files || []).filter((f) => f && f.pid === id)
          const docs = files.filter((f) => f.type !== "Photo")
          const photos = files.filter((f) => f.type === "Photo")
          const missingDocs = REQUIRED_DOCS.filter((t) => !files.some((f) => f.type === t))

          return (
            <div className="space-y-6">
              {/* Title & Status */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigateTo("props")} className="text-xs text-slate-400 hover:text-emerald-600 font-bold">
                      ← All Properties
                    </button>
                    <span className="text-slate-300">/</span>
                    <span className="text-xs text-slate-500 font-mono">{id}</span>
                  </div>
                  <h1 className="text-2xl font-black mt-1 text-gray-900 dark:text-white">{p.name}</h1>
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <select
                      value={p.status}
                      onChange={(e) =>
                        updateState((d) => {
                          const item = d.props.find((x) => x.id === id)
                          if (item) {
                            item.log.unshift({ t: Date.now(), x: `Status updated: ${item.status} → ${e.target.value}` })
                            item.status = e.target.value
                            item.updated = Date.now()
                          }
                          return d
                        })
                      }
                      className="text-xs font-bold py-1 px-3 rounded-xl border"
                      style={{ color: STATUS_COLORS[p.status] || "inherit" }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <Badge variant="outline">{p.type}</Badge>
                    {p.village && <Badge variant="secondary">📍 {p.village}</Badge>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setActiveModal({
                        type: "edit_prop",
                        title: "Edit Property Specifications",
                        property: p,
                      })
                    }
                    className="text-xs rounded-xl"
                  >
                    Edit Specifications
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Delete this property and its timeline?")) {
                        updateState((d) => {
                          d.props = d.props.filter((x) => x.id !== id)
                          return d
                        })
                        navigateTo("props")
                      }
                    }}
                    className="text-xs rounded-xl"
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Linked Public Listing Banner */}
              {p.linkedPropertyId && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                      <Link2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                          Linked to JayaListing Portfolio Asset #{p.linkedPropertyId}
                        </span>
                        <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                          Live Synchronized
                        </Badge>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Public marketing details (title, public asking price, gallery, amenities) sync from the main listing. Personal data below is private to your CRM.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/property/${p.linkedPropertyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs"
                    >
                      <span>View Live Website</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* ── SEPARATE PERSONAL & CONFIDENTIAL CRM DATA ── */}
              <div className="card border-2 border-indigo-200 dark:border-indigo-900 bg-gradient-to-b from-white to-slate-50/50 dark:from-gray-900 dark:to-gray-900/50 shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-600/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-gray-900 dark:text-white">
                          Personal & Confidential CRM Records
                        </h3>
                        <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold">
                          Private to CRM
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        Brokers, deal priority, confidential location/boundaries & walkaway quotes are kept separate from the public listing.
                      </p>
                    </div>
                  </div>

                  {/* Deal Priority Selector */}
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 ml-1">
                      Priority:
                    </span>
                    <select
                      value={p.priority || "Normal"}
                      onChange={(e) => {
                        const val = e.target.value
                        updateState((d) => {
                          const item = d.props.find((x) => x.id === id)
                          if (item) {
                            item.priority = val
                            item.log.unshift({ t: Date.now(), x: `Priority changed to: ${val}` })
                            item.updated = Date.now()
                          }
                          return d
                        })
                      }}
                      className="text-xs font-bold py-1 px-2.5 rounded-lg border bg-white dark:bg-gray-900"
                    >
                      <option value="Urgent">🔴 Urgent Priority</option>
                      <option value="High">🟠 High Priority</option>
                      <option value="Normal">🔵 Normal Priority</option>
                      <option value="Low">⚪ Low Priority</option>
                    </select>
                  </div>
                </div>

                {/* 4-Column Confidential Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Confidential Survey No. */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      🔑 Survey / Khasra No.
                    </span>
                    <input
                      value={p.survey || ""}
                      onChange={(e) => {
                        const v = e.target.value
                        updateState((d) => {
                          const item = d.props.find((x) => x.id === id)
                          if (item) { item.survey = v; item.updated = Date.now() }
                          return d
                        })
                      }}
                      placeholder="e.g. Sy No. 182/4B"
                      className="w-full text-xs font-mono font-bold py-1 px-2 rounded-lg border bg-white dark:bg-gray-900"
                    />
                  </div>

                  {/* RTC / Pahani Number */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      📋 RTC / Pahani Ref
                    </span>
                    <input
                      value={p.rtc || ""}
                      onChange={(e) => {
                        const v = e.target.value
                        updateState((d) => {
                          const item = d.props.find((x) => x.id === id)
                          if (item) { item.rtc = v; item.updated = Date.now() }
                          return d
                        })
                      }}
                      placeholder="e.g. RTC #2024-889"
                      className="w-full text-xs font-mono font-bold py-1 px-2 rounded-lg border bg-white dark:bg-gray-900"
                    />
                  </div>

                  {/* Owner's Confidential Bottom Price */}
                  <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-400">
                        🔒 Owner Bottom Price (₹)
                      </span>
                      <span className="text-[9px] text-gray-500 font-semibold">Confidential</span>
                    </div>
                    <input
                      type="number"
                      value={p.bottomPrice || ""}
                      onChange={(e) => {
                        const v = e.target.value ? Number(e.target.value) : ""
                        updateState((d) => {
                          const item = d.props.find((x) => x.id === id)
                          if (item) { item.bottomPrice = v; item.updated = Date.now() }
                          return d
                        })
                      }}
                      placeholder="e.g. 35000000"
                      className="w-full text-xs font-bold py-1 px-2 rounded-lg border bg-white dark:bg-gray-900 text-rose-700 dark:text-rose-300"
                    />
                    {Boolean(p.bottomPrice && p.quote && Number(p.quote) > Number(p.bottomPrice)) && (
                      <div className="text-[10px] text-emerald-600 font-bold mt-1">
                        Spread Margin: +{formatINR(Number(p.quote) - Number(p.bottomPrice))}
                      </div>
                    )}
                  </div>

                  {/* Target Quoted Price */}
                  <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 block mb-1">
                      💼 Quoted Deal Price (₹)
                    </span>
                    <input
                      type="number"
                      value={p.quote || ""}
                      onChange={(e) => {
                        const v = e.target.value ? Number(e.target.value) : ""
                        updateState((d) => {
                          const item = d.props.find((x) => x.id === id)
                          if (item) { item.quote = v; item.updated = Date.now() }
                          return d
                        })
                      }}
                      placeholder="e.g. 40000000"
                      className="w-full text-xs font-bold py-1 px-2 rounded-lg border bg-white dark:bg-gray-900 text-emerald-700 dark:text-emerald-300"
                    />
                  </div>
                </div>

                {/* Confidential Location & Boundaries */}
                <div className="mb-6 p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                      <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                        Confidential Location & Boundary Directions (Never Published on Website)
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                      Private Directions
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={p.confidentialLocation || ""}
                    onChange={(e) => {
                      const v = e.target.value
                      updateState((d) => {
                        const item = d.props.find((x) => x.id === id)
                        if (item) { item.confidentialLocation = v; item.updated = Date.now() }
                        return d
                      })
                    }}
                    placeholder="e.g. East boundary: Hegde plantation. North: Netravati tributary. Access via private 20-ft gate behind temple. Contact caretaker Ramesh on site."
                    className="w-full text-xs p-2.5 rounded-xl border border-amber-300/60 dark:border-amber-800 bg-white dark:bg-gray-900 leading-relaxed"
                  />
                </div>

                {/* Assigned Brokers & Commission Manager */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                        Assigned Brokers & Commission Cut ({(p.brokers || []).length})
                      </h4>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddBroker(!showAddBroker)}
                      className="h-7 text-[11px] font-bold rounded-lg"
                    >
                      {showAddBroker ? "✕ Cancel" : "+ Assign Broker"}
                    </Button>
                  </div>

                  {/* Inline Add Broker Form */}
                  {showAddBroker && (
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-3 animate-in fade-in-50">
                      <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        Assign New Broker to this Deal
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          placeholder="Broker Name (e.g. Suresh Poojary)"
                          value={brokerForm.name}
                          onChange={(e) => setBrokerForm({ ...brokerForm, name: e.target.value })}
                          className="text-xs p-2 rounded-lg border bg-white dark:bg-gray-800"
                        />
                        <input
                          placeholder="Phone (e.g. +91 98450 12345)"
                          value={brokerForm.phone}
                          onChange={(e) => setBrokerForm({ ...brokerForm, phone: e.target.value })}
                          className="text-xs p-2 rounded-lg border bg-white dark:bg-gray-800"
                        />
                        <input
                          placeholder="Commission (e.g. 2% or ₹1 Lakh)"
                          value={brokerForm.commission}
                          onChange={(e) => setBrokerForm({ ...brokerForm, commission: e.target.value })}
                          className="text-xs p-2 rounded-lg border bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          placeholder="Broker Notes / Agreement terms (optional)"
                          value={brokerForm.note}
                          onChange={(e) => setBrokerForm({ ...brokerForm, note: e.target.value })}
                          className="flex-1 text-xs p-2 rounded-lg border bg-white dark:bg-gray-800"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!brokerForm.name.trim()) return
                            updateState((d) => {
                              const item = d.props.find((x) => x.id === id)
                              if (item) {
                                if (!Array.isArray(item.brokers)) item.brokers = []
                                item.brokers.push({
                                  name: brokerForm.name.trim(),
                                  phone: brokerForm.phone.trim(),
                                  commission: brokerForm.commission.trim(),
                                  note: brokerForm.note.trim(),
                                })
                                item.log.unshift({
                                  t: Date.now(),
                                  x: `Assigned broker: ${brokerForm.name.trim()} (${brokerForm.commission || "Standard"})`,
                                })
                                item.updated = Date.now()
                              }
                              return d
                            })
                            setBrokerForm({ name: "", phone: "", commission: "", note: "" })
                            setShowAddBroker(false)
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 px-4 rounded-lg"
                        >
                          Save Broker
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Brokers List */}
                  <div className="space-y-2">
                    {(p.brokers || []).map((b: any, bIdx: number) => {
                      const bName = typeof b === "string" ? b : b?.name || "Broker"
                      const bPhone = typeof b === "object" ? b?.phone : ""
                      const bComm = typeof b === "object" ? b?.commission : ""
                      const bNote = typeof b === "object" ? b?.note : ""

                      return (
                        <div
                          key={bIdx}
                          className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 dark:text-white">{bName}</span>
                              {bComm && (
                                <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold">
                                  Commission: {bComm}
                                </Badge>
                              )}
                            </div>
                            {bPhone && <div className="text-gray-500 font-mono text-[11px]">{bPhone}</div>}
                            {bNote && <div className="text-gray-600 dark:text-gray-400 text-[11px] italic">"{bNote}"</div>}
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            {bPhone && (
                              <>
                                <a
                                  href={waUrl(bPhone)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-[#25D366] text-white hover:bg-[#20ba59] transition-colors"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={`tel:${String(bPhone).replace(/\s+/g, "")}`}
                                  className="p-1.5 rounded-lg border bg-gray-50 hover:bg-gray-100 text-gray-700 dark:text-gray-300 transition-colors"
                                  title="Call Broker"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                updateState((d) => {
                                  const item = d.props.find((x) => x.id === id)
                                  if (item && Array.isArray(item.brokers)) {
                                    item.brokers.splice(bIdx, 1)
                                    item.log.unshift({ t: Date.now(), x: `Removed broker: ${bName}` })
                                    item.updated = Date.now()
                                  }
                                  return d
                                })
                              }}
                              className="p-1.5 text-gray-400 hover:text-rose-600 transition-colors ml-1"
                              title="Remove Broker"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    {(!p.brokers || p.brokers.length === 0) && (
                      <div className="text-xs text-gray-400 py-2 italic text-center">
                        No brokers assigned yet. Click "+ Assign Broker" to track broker phone, commission & agreements.
                      </div>
                    )}
                  </div>
                </div>

                {/* Private Deal Notes & Negotiation History */}
                <div className="pt-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    📝 Private Internal Strategy & Negotiation Notes
                  </label>
                  <textarea
                    rows={2}
                    value={p.privateNotes || ""}
                    onChange={(e) => {
                      const v = e.target.value
                      updateState((d) => {
                        const item = d.props.find((x) => x.id === id)
                        if (item) { item.privateNotes = v; item.updated = Date.now() }
                        return d
                      })
                    }}
                    placeholder="e.g. Owner willing to discount 5% for all-cash settlement within 30 days. Client visited on Sunday, awaiting title search report."
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 leading-relaxed"
                  />
                </div>
              </div>

              {/* Public Specifications Summary */}
              <div className="card">
                <div className="text-xs uppercase font-bold text-slate-500 mb-3 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>Public Listing Specifications (Synced with Main Database)</span>
                </div>
                <div className="detail-grid">
                  <div className="detail-item"><span className="prop-label">📐 Area</span><span className="font-bold">{p.area ? `${p.area} ${p.unit}` : "—"}</span></div>
                  <div className="detail-item"><span className="prop-label">💰 Public Ask Price</span><span className="font-bold text-gray-900 dark:text-white">{formatINR(p.price)}</span></div>
                  <div className="detail-item"><span className="prop-label">📍 Public Locality</span><span className="font-bold">{p.village || "—"}</span></div>
                  <div className="detail-item"><span className="prop-label">🏷️ Property Type</span><span className="font-bold">{p.type}</span></div>
                </div>
              </div>

              {/* Legal & Document Checklist */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-sm">Legal & Documents ({docs.length} uploaded)</h3>
                    {missingDocs.length > 0 && (
                      <div className="text-xs text-rose-600 font-semibold mt-0.5">
                        Missing required documents: {missingDocs.join(", ")}
                      </div>
                    )}
                  </div>
                  <label className="btn-sm bg-emerald-600 text-white cursor-pointer font-bold">
                    <Upload className="w-3 h-3 mr-1" />
                    Upload Document
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && uploadFiles(id, e.target.files, { type: "Other" })}
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  {docs.map((f) => (
                    <div key={f.id} className="p-2.5 border rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold">{f.type}:</span>
                        <a href={`/api/crm/files?p=${encodeURIComponent(f.path)}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-semibold">
                          {f.name}
                        </a>
                      </div>
                      <button onClick={() => deleteFile(f)} className="text-slate-400 hover:text-rose-500">✕</button>
                    </div>
                  ))}
                  {docs.length === 0 && <div className="text-xs text-slate-400 py-3">No documents uploaded yet.</div>}
                </div>
              </div>

              {/* Photos Gallery */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">Property Photos ({photos.length})</h3>
                  <label className="btn-sm bg-slate-800 text-white cursor-pointer font-bold">
                    <Upload className="w-3 h-3 mr-1" />
                    Upload Photos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && uploadFiles(id, e.target.files, { type: "Photo" })}
                    />
                  </label>
                </div>

                <div className="g">
                  {photos.map((f) => (
                    <div key={f.id} className="relative group">
                      <img src={`/api/crm/files?p=${encodeURIComponent(f.path)}`} alt={f.name} />
                      <button
                        onClick={() => deleteFile(f)}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {photos.length === 0 && <div className="text-xs text-slate-400 py-3">No photos uploaded yet.</div>}
                </div>
              </div>

              {/* Activity Log & Timeline */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">Deal Activity Log</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const noteText = prompt("Add activity note:")
                      if (noteText) {
                        updateState((d) => {
                          const item = d.props.find((x) => x.id === id)
                          if (item) {
                            item.log.unshift({ t: Date.now(), x: noteText })
                            item.updated = Date.now()
                          }
                          return d
                        })
                      }
                    }}
                    className="text-xs h-7"
                  >
                    + Add Note
                  </Button>
                </div>

                <div className="space-y-2">
                  {(p.log || []).slice(0, 20).map((l, i) => (
                    <div key={i} className="text-xs py-1.5 border-b flex justify-between">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{l.x}</span>
                      <span className="text-slate-400 text-[11px]">{formatDateTime(l.t)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })()
      ) : nav.screen === "people" ? (
        /* ══════════════════════════════════════════════════════════════════════
           PEOPLE & LEADS CRM
           ══════════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">People & Leads CRM ({db.people.length})</h2>
              <div className="text-xs text-slate-500">Manage buyers, qualified leads, property owners and brokers</div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() =>
                  setActiveModal({
                    type: "new_lead",
                    title: "Add New Buyer / Lead",
                  })
                }
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-8 rounded-xl"
              >
                + Add Lead 🎯
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  setActiveModal({
                    type: "new_person",
                    title: "Add Contact / Owner / Broker",
                  })
                }
                className="bg-emerald-600 text-white font-bold text-xs h-8 rounded-xl"
              >
                + Add Person
              </Button>
            </div>
          </div>

          {/* Sub Filters */}
          <div className="filter-tabs">
            <button className={`filter-chip ${peopleTab === "all" ? "active" : ""}`} onClick={() => setPeopleTab("all")}>
              All People ({db.people.length})
            </button>
            <button className={`filter-chip ${peopleTab === "leads" ? "active" : ""}`} onClick={() => setPeopleTab("leads")}>
              🎯 Leads & Buyers ({db.people.filter((p) => p.roles?.includes("Buyer / Lead") || p.leadStatus).length})
            </button>
            <button className={`filter-chip ${peopleTab === "owners" ? "active" : ""}`} onClick={() => setPeopleTab("owners")}>
              🏡 Owners ({db.people.filter((p) => p.roles?.includes("Owner")).length})
            </button>
            <button className={`filter-chip ${peopleTab === "brokers" ? "active" : ""}`} onClick={() => setPeopleTab("brokers")}>
              🤝 Brokers ({db.people.filter((p) => p.roles?.includes("Broker")).length})
            </button>
            <button className={`filter-chip ${peopleTab === "starred" ? "active" : ""}`} onClick={() => setPeopleTab("starred")}>
              ⭐ Starred ({db.people.filter((p) => p.starred).length})
            </button>
          </div>

          {/* Leads Cards */}
          <div className="space-y-3">
            {db.people
              .filter((p) => {
                if (peopleTab === "leads") return p.roles?.includes("Buyer / Lead") || p.leadStatus
                if (peopleTab === "owners") return p.roles?.includes("Owner")
                if (peopleTab === "brokers") return p.roles?.includes("Broker")
                if (peopleTab === "starred") return p.starred
                return true
              })
              .map((person) => (
                <div key={person.id} className="lead-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateState((d) => {
                              const x = d.people.find((pr) => pr.id === person.id)
                              if (x) x.starred = !x.starred
                              return d
                            })
                          }
                          className="star-btn-sm"
                        >
                          {person.starred ? "⭐" : "☆"}
                        </button>
                        <span
                          onClick={() => navigateTo("person", person.id)}
                          className="font-bold text-base cursor-pointer hover:underline text-gray-900 dark:text-white"
                        >
                          {person.name}
                        </span>
                        {person.leadStatus && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: (LEAD_STATUS_COLORS[person.leadStatus] || "#6b7280") + "20",
                              color: LEAD_STATUS_COLORS[person.leadStatus] || "#6b7280",
                            }}
                          >
                            🎯 {person.leadStatus}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Roles: {(person.roles || []).join(", ")} · 📍 {person.village || "Location not specified"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {person.phone && (
                        <>
                          <a href={`tel:${person.phone}`} className="btn-sm">📞 Call</a>
                          <a href={waUrl(person.phone)} target="_blank" rel="noopener noreferrer" className="btn-sm btn-wa">💬 WhatsApp</a>
                        </>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Delete contact "${person.name}"?`)) {
                            updateState((d) => {
                              d.people = d.people.filter((x) => x.id !== person.id)
                              return d
                            })
                          }
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {(person.budget || person.reqType || person.nextFollowUp) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl text-xs mt-3">
                      {person.budget && <div><span className="text-slate-500">💰 Budget:</span> <b className="text-emerald-600">{formatINR(person.budget)}</b></div>}
                      {person.reqType && <div><span className="text-slate-500">🏡 Desired:</span> <b>{person.reqType}</b></div>}
                      {person.nextFollowUp && <div><span className="text-slate-500">⏰ Follow-up:</span> <b className="text-indigo-600">{formatDate(person.nextFollowUp)}</b></div>}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ) : nav.screen === "person" && getPerson(nav.id) ? (
        /* ══════════════════════════════════════════════════════════════════════
           SINGLE PERSON VIEW
           ══════════════════════════════════════════════════════════════════════ */
        (() => {
          const person = getPerson(nav.id)!
          const id = person.id
          const linkedProps = (db?.props || []).filter((x) => (x?.owners || []).includes(id) || (x?.brokers || []).some((b: any) => (typeof b === "string" ? b === id : b?.pid === id)))

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <button onClick={() => navigateTo("people")} className="text-xs text-slate-400 hover:text-emerald-600 font-bold">
                    ← All People & Leads
                  </button>
                  <h1 className="text-2xl font-black mt-1 text-gray-900 dark:text-white">{person.name}</h1>
                  <div className="text-xs text-slate-500 mt-1">Roles: {(person.roles || []).join(", ")}</div>
                </div>
                {person.phone && (
                  <div className="flex items-center gap-2">
                    <a href={`tel:${person.phone}`} className="btn-sm text-sm py-1.5 px-3">📞 Call</a>
                    <a href={waUrl(person.phone)} target="_blank" rel="noopener noreferrer" className="btn-sm btn-wa text-sm py-1.5 px-3">💬 WhatsApp</a>
                  </div>
                )}
              </div>

              <div className="card">
                <h3 className="font-bold text-sm mb-3">Linked Properties ({linkedProps.length})</h3>
                <div className="space-y-2">
                  {linkedProps.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 border rounded-xl">
                      <span className="font-bold text-sm cursor-pointer hover:underline" onClick={() => navigateTo("prop", p.id)}>{p.name}</span>
                      <Badge>{p.status}</Badge>
                    </div>
                  ))}
                  {linkedProps.length === 0 && <div className="text-xs text-slate-400">No properties linked to this person.</div>}
                </div>
              </div>
            </div>
          )
        })()
      ) : (
        /* ══════════════════════════════════════════════════════════════════════
           BACKUP & SETTINGS
           ══════════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Database Backup & Storage</h2>
          <div className="card">
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              All CRM records, properties, buyers, follow-up rules and tasks are stored in Neon PostgreSQL table <code className="font-bold">crm_store</code> with LZ4 compression.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                size="sm"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `crm-records-${todayStr()}.json`
                  a.click()
                }}
                className="bg-emerald-600 text-white font-bold text-xs h-8 rounded-xl"
              >
                ⬇ Download JSON Backup
              </Button>
            </div>

            <div className="mt-6 p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/40 text-xs">
              <div className="font-bold mb-2">Live Database Statistics (Version {db.version})</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>🏡 <b>{db.props.length}</b> Properties</div>
                <div>👥 <b>{db.people.length}</b> People & Leads</div>
                <div>✅ <b>{db.tasks.length}</b> Tasks</div>
                <div>📁 <b>{db.files.length}</b> Uploaded Files</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="ov" onClick={() => setShowQuickAdd(false)}>
          <div className="dlg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Smart Quick Add</span>
              </h3>
              <button onClick={() => setShowQuickAdd(false)}>✕</button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Type naturally. E.g. <em>"Shetty 2 acre Sullia road 45 lakh 9845055555"</em> or <em>"Call Anita tomorrow 5pm"</em>
            </p>
            <input
              id="quick-add-modal-input"
              placeholder="Owner name, area, village, price, mobile or task..."
              autoFocus
              className="w-full text-sm p-3 rounded-xl border"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const parsed = parseQuickLine(e.currentTarget.value)
                  if (parsed) handleQuickAddSubmit(parsed)
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Generic Modal for Adding Property / Contact */}
      {activeModal && activeModal.type === "new_prop" && (
        <div className="ov" onClick={() => setActiveModal(null)}>
          <form
            className="dlg space-y-3"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault()
              const formEl = e.currentTarget
              const name = (formEl.elements.namedItem("name") as HTMLInputElement)?.value
              const type = (formEl.elements.namedItem("type") as HTMLSelectElement)?.value
              const status = (formEl.elements.namedItem("status") as HTMLSelectElement)?.value
              const village = (formEl.elements.namedItem("village") as HTMLInputElement)?.value
              const price = (formEl.elements.namedItem("price") as HTMLInputElement)?.value
              const area = (formEl.elements.namedItem("area") as HTMLInputElement)?.value
              const unit = (formEl.elements.namedItem("unit") as HTMLSelectElement)?.value

              if (!name) return

              const nextIdNum = 1 + Math.max(0, ...(db?.props || []).map((p) => parseInt(String(p?.id || "").replace(/\D/g, "") || "0", 10)))
              const id = `PROP-${String(nextIdNum).padStart(4, "0")}`

              updateState((d) => {
                d.props.push({
                  id,
                  name,
                  type: type || PROPERTY_TYPES[0],
                  status: status || STATUSES[0],
                  village: village || "",
                  area: area || "",
                  unit: unit || "acre",
                  price: price ? Number(price) : "",
                  quote: price ? Number(price) : "",
                  owners: [],
                  brokers: [],
                  log: [{ t: Date.now(), x: `Created as ${status || STATUSES[0]}` }],
                  updated: Date.now(),
                  starred: false,
                  tags: [],
                  timeline: [],
                })
                return d
              })
              setActiveModal(null)
              navigateTo("prop", id)
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-base">Add New Property</h3>
              <button type="button" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Property Name / Title</label>
              <input name="name" required placeholder="e.g. Sullia Plantation Estate" className="w-full text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold block mb-1">Property Type</label>
                <select name="type" className="w-full text-xs">
                  {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Pipeline Status</label>
                <select name="status" className="w-full text-xs">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold block mb-1">Area / Size</label>
                <input name="area" placeholder="e.g. 5" className="w-full text-xs" />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Unit</label>
                <select name="unit" className="w-full text-xs">
                  <option value="acre">acre</option>
                  <option value="gunta">gunta</option>
                  <option value="cent">cent</option>
                  <option value="sq ft">sq ft</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Location / Village</label>
              <input name="village" placeholder="e.g. Sullia, Puttur" className="w-full text-xs" />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Owner Ask Price (₹)</label>
              <input name="price" type="number" placeholder="e.g. 4500000" className="w-full text-xs" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-emerald-600 text-white font-bold">Save Property ✓</Button>
            </div>
          </form>
        </div>
      )}

      {/* Adjust Task Modal */}
      {adjustTask && (
        <div className="ov" onClick={() => setAdjustTask(null)}>
          <div className="dlg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Reschedule Task</span>
              </h3>
              <button onClick={() => setAdjustTask(null)}>✕</button>
            </div>
            <p className="text-xs text-slate-500 mb-3">Task: <b>{adjustTask.title}</b></p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                className="work-btn"
                onClick={() => {
                  updateState((d) => {
                    const t = d.tasks.find((y) => y.id === adjustTask.id)
                    if (t) { t.due = todayStr(); t.time = "10:00" }
                    return d
                  })
                  setAdjustTask(null)
                }}
              >
                ☀️ Today 10:00 AM
              </button>
              <button
                className="work-btn"
                onClick={() => {
                  updateState((d) => {
                    const t = d.tasks.find((y) => y.id === adjustTask.id)
                    if (t) { t.due = todayStr(1); t.time = "10:00" }
                    return d
                  })
                  setAdjustTask(null)
                }}
              >
                📅 Tomorrow 10:00 AM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

