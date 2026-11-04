"use client"

import { use, useState, useEffect } from "react"
import {
  Heart,
  Star,
  Phone,
  MessageCircle,
  Shield,
  School,
  Hospital,
  ShoppingCart,
  Coffee,
  Bed,
  Bath,
  Square,
  Car,
  Home,
  Zap,
  Droplets,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  Eye,
  Plane,
  X,
  Compass,
  FileCheck,
  Trash2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Lock,
  HelpCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Footer from "@/components/footer"
import Link from "next/link"
import Image from "next/image"
import PropertyHeader from "@/components/property-header"
import PropertyShareModal from "@/components/property-share-modal"
import { getLuxuryPropertyById, LUXURY_PROPERTIES, LuxuryProperty } from "@/lib/luxury-properties"
import { toPublicListing } from "@/lib/public-listing"

export default function PropertyDetailsClient({
  id,
  initialProperty,
}: {
  id: string
  initialProperty?: LuxuryProperty | null
}) {
  const router = useRouter()
  const [property, setProperty] = useState<LuxuryProperty | null>(
    () => initialProperty || getLuxuryPropertyById(id) || null
  )
  const [notFound, setNotFound] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [hasVipAccess, setHasVipAccess] = useState(false)
  const [vipClientName, setVipClientName] = useState<string | null>(null)
  const [vipExpiredError, setVipExpiredError] = useState<{
    reason?: string
    message: string
    viewedAt?: string
    clientName?: string
  } | null>(null)
  const [isVerifyingVip, setIsVerifyingVip] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== "undefined") {
      fetch("/api/admin/check")
        .then((res) => res.json())
        .then((data) => {
          const isAuthed = !!data.authenticated
          setIsAdminUser(isAuthed)
          if (isAuthed) {
            setHasVipAccess(true)
          } else {
            localStorage.removeItem("jaya_admin_authenticated")
            localStorage.removeItem("jaya_admin_token")
          }
        })
        .catch(() => setIsAdminUser(false))

      const sp = new URLSearchParams(window.location.search)
      const token = sp.get("vip_token")
      const legacyAccess = sp.get("access") === "private_vip"

      if (token) {
        // If this same browser tab already consumed and verified this token, allow it
        const sessionActive = sessionStorage.getItem(`jaya_vip_session_${token}`) === "true"
        if (sessionActive) {
          setHasVipAccess(true)
          const storedName = sessionStorage.getItem(`jaya_vip_name_${token}`)
          if (storedName) setVipClientName(storedName)
          return
        }

        setIsVerifyingVip(true)
        fetch(`/api/vip-token/verify?token=${encodeURIComponent(token)}&property_id=${encodeURIComponent(id)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.valid) {
              setHasVipAccess(true)
              if (data.tokenData?.client_name) {
                setVipClientName(data.tokenData.client_name)
                sessionStorage.setItem(`jaya_vip_name_${token}`, data.tokenData.client_name)
              }
              sessionStorage.setItem(`jaya_vip_session_${token}`, "true")
            } else {
              setVipExpiredError({
                reason: data.reason,
                message: data.message,
                viewedAt: data.tokenData?.first_viewed_at,
                clientName: data.tokenData?.client_name,
              })
            }
          })
          .catch((err) => {
            console.error("VIP verification error:", err)
          })
          .finally(() => {
            setIsVerifyingVip(false)
          })
      } else if (legacyAccess) {
        setHasVipAccess(true)
      }
    }
  }, [id])

  useEffect(() => {
    fetch(`/api/properties/${id}?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    })
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true)
          setProperty(null)
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data && data.success && data.data) {
          setProperty(data.data)
          setNotFound(false)
        } else if (data && data.notFound) {
          setNotFound(true)
          setProperty(null)
        }
      })
      .catch((err) => console.log("Property fetch notice:", err))
  }, [id])

  const publicListing = property ? toPublicListing(property) : null

  const handleDeleteProperty = async () => {
    if (!isAdminUser) {
      alert("Unauthorized: Only administrators can delete listings.")
      return
    }
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: "DELETE",
        headers: {
          "Cache-Control": "no-cache",
          "x-admin-key": "jayaadmin",
        },
      })
      const data = await res.json()
      if (data.success) {
        setNotFound(true)
        setProperty(null)
      } else {
        alert("Failed to delete property: " + data.error)
      }
    } catch (err) {
      alert("Error deleting: " + err)
    } finally {
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [showVipModal, setShowVipModal] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)
  const [tourType, setTourType] = useState<"in-person" | "virtual">("in-person")
  const [tourDate, setTourDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d.toISOString().split("T")[0]
  })
  const [tourTime, setTourTime] = useState("11:00 AM")
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [bookingNotes, setBookingNotes] = useState("")
  const [bookingReference, setBookingReference] = useState("")
  const [isSubmittingTour, setIsSubmittingTour] = useState(false)
  const [tourError, setTourError] = useState<string | null>(null)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [dossierDownloaded, setDossierDownloaded] = useState(false)
  const [showAllAmenities, setShowAllAmenities] = useState(false)
  const [showFullDossier, setShowFullDossier] = useState(false)

  // If deleted or not found in PostgreSQL
  if (notFound || !property) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col justify-between">
        <PropertyHeader />
        <div className="container mx-auto px-4 py-20 text-center max-w-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-900/30 mx-auto flex items-center justify-center mb-6 shadow-lg shadow-rose-950/20">
            <Trash2 className="w-8 h-8 text-rose-800 dark:text-rose-400" />
          </div>
          <Badge className="bg-rose-900 text-white mb-3">PostgreSQL Synchronized</Badge>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">
            Estate Removed from Database
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            This trophy listing (ID #{id}) has been permanently deleted or is no longer active in the PostgreSQL database.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/">
              <Button className="bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 hover:from-rose-950 text-white rounded-xl text-xs font-bold px-6 h-11 shadow-lg shadow-rose-900/30">
                Explore Active Portfolios
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline" className="border-rose-900/40 text-rose-900 dark:text-rose-300 hover:bg-rose-50 rounded-xl text-xs font-bold px-6 h-11">
                Open Admin Dashboard
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // 1. One-Time VIP Link Expired / Disabled State
  if (vipExpiredError) {
    return (
      <div className="min-h-screen bg-[#140003] text-stone-100 flex flex-col justify-between font-sans selection:bg-red-900 selection:text-white">
        <PropertyHeader />
        <div className="container mx-auto px-4 py-16 text-center max-w-lg my-auto space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-red-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-2xl">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-widest font-black text-amber-500">
              Single-Use VIP Dossier Protection
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-white">
              {vipExpiredError.reason === "already_used"
                ? "One-Time VIP Dossier Disabled"
                : "VIP Link Expired or Revoked"}
            </h1>
            <p className="text-xs text-stone-300 leading-relaxed max-w-md mx-auto">
              {vipExpiredError.reason === "already_used"
                ? "This private VIP link was designated for 1 person to open once. Because it has already been accessed, it is now permanently disabled to protect confidential property records."
                : vipExpiredError.message}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-amber-900/30 text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex justify-between text-stone-400">
              <span>Asset Reference:</span>
              <span className="font-mono text-stone-200">#{id}</span>
            </div>
            {vipExpiredError.clientName && (
              <div className="flex justify-between text-stone-400">
                <span>Prepared Exclusively For:</span>
                <span className="text-amber-300 font-bold">{vipExpiredError.clientName}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-400">
              <span>Security Rule:</span>
              <span className="text-amber-400 font-bold">1 Person • 1 Open Limit</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Link Status:</span>
              <span className="text-red-400 font-bold">Permanently Deactivated</span>
            </div>
          </div>

          <div className="space-y-3 pt-2 max-w-md mx-auto">
            <a
              href={`https://api.whatsapp.com/send?phone=918296530609&text=${encodeURIComponent(
                `Hello Rohit, I attempted to view the confidential VIP dossier for Estate #${id}, but the single-use link has expired/disabled. Kindly dispatch a fresh private access link.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-stone-950 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg"
            >
              <MessageCircle className="w-4 h-4 text-stone-950" />
              <span>Request Fresh VIP Link via WhatsApp</span>
            </a>

            <Link
              href="/"
              className="block w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold transition border border-stone-800 text-center"
            >
              ← Return to Public Collection
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // 2. Private Off-Market Listing without VIP Token or Admin Session
  if (property.visibility === "private" && !hasVipAccess && !isAdminUser && mounted) {
    return (
      <div className="min-h-screen bg-[#140003] text-stone-100 flex flex-col justify-between font-sans selection:bg-red-900 selection:text-white">
        <PropertyHeader />
        <div className="container mx-auto px-4 py-16 text-center max-w-lg my-auto space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-red-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-2xl">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-widest font-black text-amber-500">
              Off-Market Private Portfolio
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-white">
              Private Invitation Required
            </h1>
            <p className="text-xs text-stone-300 leading-relaxed max-w-md mx-auto">
              This asset is an exclusive off-market private portfolio holding. Direct access requires a single-use VIP link issued by the estate director.
            </p>
          </div>

          <div className="space-y-3 pt-2 max-w-md mx-auto">
            <a
              href={`https://api.whatsapp.com/send?phone=918296530609&text=${encodeURIComponent(
                `Hello Rohit, I would like to request confidential VIP access for Off-Market Estate #${id}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-stone-950 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg"
            >
              <MessageCircle className="w-4 h-4 text-stone-950" />
              <span>Request Private Dossier via WhatsApp</span>
            </a>

            <Link
              href="/"
              className="block w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold transition border border-stone-800 text-center"
            >
              ← Return to Public Portfolios
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length)
  }

  const handleBookTour = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingTour(true)
    setTourError(null)

    try {
      const res = await fetch("/api/vip-tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          propertyTitle: property.title,
          propertyPrice: property.price,
          propertyLocation: `${property.location}, ${property.city}`,
          tourType,
          tourDate,
          tourTime,
          clientName,
          clientPhone,
          clientEmail,
          notes: bookingNotes,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to schedule appointment")
      }

      const refCode = `JAYA-VIP-${property.id}-${data.bookingId || Date.now().toString().slice(-4)}`
      setBookingReference(refCode)
      setBookingConfirmed(true)
    } catch (err: any) {
      setTourError(err.message || "Failed to submit booking. Please try again or contact concierge via WhatsApp.")
    } finally {
      setIsSubmittingTour(false)
    }
  }

  const handleDownloadDossier = () => {
    setDossierDownloaded(true)
    setTimeout(() => setDossierDownloaded(false), 3500)
  }

  // Distinct category badge style
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case "residential":
        return {
          badge: "bg-blue-600 text-white",
          name: "Residential",
          iconColor: "text-blue-500 dark:text-blue-400",
          placeColor: "text-blue-600 dark:text-blue-400",
          mapPinBg: "bg-blue-900/30 text-blue-400",
        }
      case "commercial":
        return {
          badge: "bg-amber-600 text-white",
          name: "Commercial",
          iconColor: "text-amber-500 dark:text-amber-400",
          placeColor: "text-amber-600 dark:text-amber-400",
          mapPinBg: "bg-amber-900/30 text-amber-400",
        }
      case "industrial":
        return {
          badge: "bg-purple-600 text-white",
          name: "Industrial",
          iconColor: "text-purple-500 dark:text-purple-400",
          placeColor: "text-purple-600 dark:text-purple-400",
          mapPinBg: "bg-purple-900/30 text-purple-400",
        }
      case "agriculture":
        return {
          badge: "bg-emerald-600 text-white",
          name: "Agricultural",
          iconColor: "text-emerald-500 dark:text-emerald-400",
          placeColor: "text-emerald-600 dark:text-emerald-400",
          mapPinBg: "bg-emerald-900/30 text-emerald-400",
        }
      default:
        return {
          badge: "bg-rose-900 text-white",
          name: "Estate",
          iconColor: "text-rose-500 dark:text-rose-400",
          placeColor: "text-rose-600 dark:text-rose-400",
          mapPinBg: "bg-rose-900/30 text-rose-400",
        }
    }
  }

  const catTheme = getCategoryTheme(property.category)

  // Related luxury properties in strict sequence
  const relatedProperties = LUXURY_PROPERTIES.filter((p) => p.id !== property.id).slice(0, 3)

  // Reusable Title, Tagline, Badges & Investment Valuation banner
  const renderTitleAndPricing = (isMobileView: boolean) => (
    <div
      className={
        isMobileView
          ? "block lg:hidden space-y-4 pt-1"
          : "hidden lg:flex mb-6 flex-row lg:items-end justify-between gap-4"
      }
    >
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${catTheme.badge} shadow-sm`}>
            {property.propertyType}
          </span>
          {property.isExclusive && (
            <Badge variant="secondary" className="bg-rose-950 text-amber-300 border border-rose-800">
              Exclusive Representation
            </Badge>
          )}
          <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified Freehold Title
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
          {property.title}
        </h1>

        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 max-w-3xl">
          {property.tagline}
        </p>

        <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
          <MapPin className={`w-4 h-4 ${catTheme.iconColor} mr-1.5 flex-shrink-0`} />
          <span className={`font-semibold ${catTheme.placeColor}`}>{property.location}</span>
        </div>
      </div>

      {/* Pricing Box - Royal Red Accented */}
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-rose-900/30 shadow-lg shadow-rose-900/10 lg:text-right min-w-[260px]">
        <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Investment Valuation</div>
        <div className="text-3xl sm:text-4xl font-black text-rose-900 dark:text-rose-400 mt-0.5">
          {property.price}
        </div>
        {property.priceSuffix && (
          <div className="text-xs text-gray-500">{property.priceSuffix}</div>
        )}
        {property.originalPrice && (
          <div className="text-xs text-gray-400 line-through mt-0.5">
            Acquisition Valuation: {property.originalPrice}
          </div>
        )}
        {property.roi && (
          <div className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 inline-block bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md">
            ✦ {property.roi}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header */}
      <PropertyHeader />

      {/* Private Confidential VIP Banner if Private Listing or VIP Access */}
      {mounted && (property.visibility === "private" || hasVipAccess) && (
        <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-black text-amber-200 border-b border-amber-500/40 px-4 py-2 text-xs">
          <div className="container mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-extrabold tracking-wide uppercase text-[11px] text-amber-300">
                🔒 Confidential Single-Use Dossier • Active VIP Session
                {vipClientName ? ` (${vipClientName})` : ""}
              </span>
            </div>
            <span className="text-[10px] text-stone-400 hidden sm:inline">
              Private 1-person briefing • Protected record
            </span>
          </div>
        </div>
      )}

      {/* Breadcrumb & Top Bar */}
      <div className="border-b border-rose-900/10 dark:border-rose-900/30 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-rose-800 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link
              href={`/${property.category === "residential" ? "residential" : property.category === "commercial" ? "commercial" : property.category === "industrial" ? "industrial" : "agriculture"}`}
              className="hover:text-rose-800 capitalize transition-colors font-medium"
            >
              {catTheme.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-200 font-bold truncate max-w-[180px] sm:max-w-xs">
              {property.title}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="border-rose-900/30 text-rose-900 dark:text-rose-300 bg-rose-900/10">
              <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
              Royal Portfolio #{property.id}
            </Badge>

            {/* Admin Delete Action - STRICTLY ADMIN ONLY */}
            {mounted && isAdminUser && (
              confirmDelete ? (
                <div className="flex items-center space-x-1 animate-in fade-in duration-150">
                  <Button
                    onClick={handleDeleteProperty}
                    disabled={isDeleting}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold h-7 px-2.5 rounded-lg shadow-sm"
                  >
                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                  </Button>
                  <Button
                    onClick={() => setConfirmDelete(false)}
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-gray-600 text-xs h-7 px-1.5"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setConfirmDelete(true)}
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 text-[11px] font-bold h-7 px-2.5 rounded-lg"
                  title="Admin Only: Delete listing from database"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete Listing
                </Button>
              )
            )}

            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="p-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-amber-500 hover:border-amber-300 transition-all"
              title="Share Property (Public or Private VIP)"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`p-1.5 rounded-full border transition-all ${
                isSaved
                  ? "bg-rose-50 border-rose-300 text-rose-600"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 hover:text-rose-600 hover:border-rose-200"
              }`}
              title="Save to Private Portfolio"
            >
              <Heart className={`w-4 h-4 ${isSaved ? "fill-rose-600 text-rose-600" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-3 sm:px-4 py-3 sm:py-6 lg:py-8 pb-28 lg:pb-8">
        {/* Desktop Title & Quick Overview Banner (Hidden on mobile) */}
        {renderTitleAndPricing(false)}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* High-Resolution Media Gallery */}
            <Card className="overflow-hidden border border-rose-900/20 dark:border-rose-900/40 shadow-xl bg-black rounded-2xl">
              <div
                onClick={() => setShowLightbox(true)}
                className="relative aspect-[4/3] sm:aspect-[16/10] bg-gray-950 group cursor-pointer"
              >
                <Image
                  src={property.images[currentImageIndex] || property.images[0]}
                  alt={`${property.title} — ${property.category} architectural estate in ${property.location || property.city} (Photo ${currentImageIndex + 1})`}
                  fill
                  priority
                  className="object-cover transition-all duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />

                {/* Gentle bottom-only vignette to keep estate bright and vibrant */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none" />

                {/* Navigation Arrows */}
                {property.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        prevImage()
                      }}
                      className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md flex items-center justify-center border border-white/30 transition-all shadow-lg active:scale-95 z-20"
                      aria-label="Previous Image"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        nextImage()
                      }}
                      className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md flex items-center justify-center border border-white/30 transition-all shadow-lg active:scale-95 z-20"
                      aria-label="Next Image"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </>
                )}

                {/* Top Actions: Fullscreen & 4K Walkthrough */}
                <div className="absolute top-3 right-3 flex items-center space-x-2 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowLightbox(true)
                    }}
                    className="bg-black/60 hover:bg-black/85 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-full shadow-md backdrop-blur-md flex items-center space-x-1 border border-white/20 transition-all active:scale-95"
                    title="Tap to view fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-white" />
                    <span className="hidden sm:inline">Fullscreen</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowVipModal(true)
                    }}
                    className="bg-gradient-to-r from-rose-950/90 to-red-900/90 hover:from-rose-950 hover:to-red-800 text-amber-200 text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center space-x-1.5 border border-amber-400/30 transition-all active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>4K Walkthrough</span>
                  </button>
                </div>

                {/* Bottom: Clean Photo Counter & Tap to enlarge hint */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                  <div className="bg-black/70 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-full border border-white/15">
                    Photo {currentImageIndex + 1} of {property.images.length}
                  </div>
                  <div className="bg-black/60 backdrop-blur-md text-white/80 text-[10px] font-medium px-2.5 py-1 rounded-full border border-white/10 hidden sm:block">
                    Click to enlarge
                  </div>
                </div>
              </div>

              {/* Thumbnails Row */}
              <div className="p-2 sm:p-3 bg-gray-950 border-t border-gray-800">
                <div className="flex space-x-2.5 overflow-x-auto pb-0.5 scrollbar-thin">
                  {property.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? "border-rose-500 scale-105 shadow-md shadow-rose-900/40 opacity-100"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${property.title} — Architectural Gallery View ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Mobile Title & Overview Banner (Appears immediately below hero gallery on mobile) */}
            {renderTitleAndPricing(true)}

            {/* Answer-First Executive Summary (AEO / GEO / Google Featured Snippet target) */}
            {publicListing && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-900/5 via-amber-900/5 to-rose-950/5 border border-rose-900/20 shadow-sm space-y-1">
                <div className="flex items-center text-xs uppercase tracking-wider font-extrabold text-rose-900 dark:text-rose-400">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500 flex-shrink-0" />
                  Executive Summary (AI & Verified Facts)
                </div>
                <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                  {publicListing.answerFirstSummary}
                </p>
              </div>
            )}

            {/* Quick Luxury Tag Pills */}
            <div className="flex flex-wrap gap-2">
              {property.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-900/10 text-rose-950 dark:text-rose-300 border border-rose-900/20 flex items-center"
                >
                  <Sparkles className="w-3 h-3 text-amber-500 mr-1.5" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Mobile Quick-Jump Anchor Bar - Instant 1-tap navigation without long scroll */}
            <div className="lg:hidden sticky top-0 z-30 -mx-3 px-3 py-2 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-y border-rose-900/10 shadow-sm flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
              <a
                href="#specs"
                className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-900/10 text-rose-950 dark:text-rose-300 border border-rose-900/20 whitespace-nowrap active:bg-rose-900 active:text-white transition-colors"
              >
                Specs
              </a>
              {property.amenities && property.amenities.length > 0 && (
                <a
                  href="#amenities"
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 whitespace-nowrap active:bg-rose-900 active:text-white transition-colors"
                >
                  Amenities ({property.amenities.length})
                </a>
              )}
              <a
                href="#dossier"
                className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 whitespace-nowrap active:bg-rose-900 active:text-white transition-colors"
              >
                Dossier
              </a>
              <a
                href="#location"
                className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 whitespace-nowrap active:bg-rose-900 active:text-white transition-colors"
              >
                Location
              </a>
              <a
                href="#advisor"
                className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 whitespace-nowrap active:bg-rose-900 active:text-white transition-colors"
              >
                Advisor
              </a>
            </div>

            {/* Property Key Metrics Grid */}
            <Card id="specs" className="border border-rose-900/15 dark:border-rose-900/30 shadow-sm bg-white dark:bg-gray-900 rounded-2xl scroll-mt-12">
              <CardContent className="p-3.5 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-5 flex items-center">
                  <Compass className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-rose-800 dark:text-rose-400" />
                  Key Architectural & Estate Specifications
                </h3>

                {(() => {
                  const isSpecValid = (val: any) => Boolean(val && val !== "None" && val !== "N/A" && val !== "null" && val !== "undefined")
                  const hasAnySpecs = Boolean(
                    (property.bedrooms && property.bedrooms > 0) ||
                    (property.bathrooms && property.bathrooms > 0) ||
                    isSpecValid(property.area) ||
                    isSpecValid(property.carpetArea) ||
                    isSpecValid(property.parking) ||
                    isSpecValid(property.facing) ||
                    isSpecValid(property.floor) ||
                    isSpecValid(property.age) ||
                    isSpecValid(property.details?.electricity) ||
                    isSpecValid(property.details?.water) ||
                    isSpecValid(property.details?.security) ||
                    isSpecValid(property.details?.capacity)
                  )

                  if (!hasAnySpecs) {
                    return (
                      <div className="py-6 text-center text-xs text-gray-500 italic border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                        Architectural specifications omitted or set to None for this estate.
                      </div>
                    )
                  }

                  return (
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-3 md:gap-4">
                      {property.bedrooms && property.bedrooms > 0 && (
                        <div className="p-2 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col justify-start">
                          <Bed className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mb-1 sm:mb-1.5 flex-shrink-0" />
                          <div className="text-[11px] sm:text-sm font-bold text-gray-900 dark:text-white leading-tight break-words">
                            {property.bedrooms} Suites
                          </div>
                          <div className="text-[9px] sm:text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                            {property.category === "commercial"
                              ? "Executive Cabins"
                              : property.category === "industrial"
                              ? "Admin Office Suites"
                              : property.category === "agriculture"
                              ? "Farmhouse Bedrooms"
                              : "Master Bedrooms"}
                          </div>
                        </div>
                      )}

                      {property.bathrooms && property.bathrooms > 0 && (
                        <div className="p-2 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col justify-start">
                          <Bath className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mb-1 sm:mb-1.5 flex-shrink-0" />
                          <div className="text-[11px] sm:text-sm font-bold text-gray-900 dark:text-white leading-tight break-words">
                            {property.bathrooms} Baths
                          </div>
                          <div className="text-[9px] sm:text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                            {property.category === "commercial"
                              ? "Restrooms & Washrooms"
                              : property.category === "industrial"
                              ? "Staff & Driver Facilities"
                              : property.category === "agriculture"
                              ? "Farmhouse En-Suites"
                              : "Spa En-Suites"}
                          </div>
                        </div>
                      )}

                      {isSpecValid(property.area) && (
                        <div className="p-2 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col justify-start">
                          <Square className="w-4 h-4 sm:w-5 sm:h-5 text-rose-800 mb-1 sm:mb-1.5 flex-shrink-0" />
                          <div className="text-[11px] sm:text-sm font-bold text-gray-900 dark:text-white leading-tight break-words">
                            {property.area}
                          </div>
                          <div className="text-[9px] sm:text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                            Super Built-Up Area
                          </div>
                        </div>
                      )}

                      {isSpecValid(property.carpetArea) && (
                        <div className="p-2 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col justify-start">
                          <Square className="w-4 h-4 sm:w-5 sm:h-5 text-rose-800 mb-1 sm:mb-1.5 flex-shrink-0" />
                          <div className="text-[11px] sm:text-sm font-bold text-gray-900 dark:text-white leading-tight break-words">
                            {property.carpetArea}
                          </div>
                          <div className="text-[9px] sm:text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                            RERA Carpet Area
                          </div>
                        </div>
                      )}

                      {isSpecValid(property.parking) && (
                        <div className="p-2 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col justify-start">
                          <Car className="w-4 h-4 sm:w-5 sm:h-5 text-rose-800 mb-1 sm:mb-1.5 flex-shrink-0" />
                          <div className="text-[11px] sm:text-sm font-bold text-gray-900 dark:text-white leading-tight break-words">
                            {property.parking}
                          </div>
                          <div className="text-[9px] sm:text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                            {property.category === "commercial"
                              ? "Dedicated Parking"
                              : property.category === "industrial"
                              ? "Trailer & Dock Bays"
                              : property.category === "agriculture"
                              ? "Farmstead Parking"
                              : "Private Parking"}
                          </div>
                        </div>
                      )}

                      {isSpecValid(property.facing) && (
                        <div className="p-2 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col justify-start">
                          <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-rose-800 mb-1 sm:mb-1.5 flex-shrink-0" />
                          <div className="text-[11px] sm:text-sm font-bold text-gray-900 dark:text-white leading-tight break-words">
                            {property.facing}
                          </div>
                          <div className="text-[9px] sm:text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                            Orientation & Vista
                          </div>
                        </div>
                      )}

                      {isSpecValid(property.floor) && (
                        <div className="p-2 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col justify-start">
                          <Home className="w-4 h-4 sm:w-5 sm:h-5 text-rose-800 mb-1 sm:mb-1.5 flex-shrink-0" />
                          <div className="text-[11px] sm:text-sm font-bold text-gray-900 dark:text-white leading-tight break-words">
                            {property.floor}
                          </div>
                          <div className="text-[9px] sm:text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                            {property.category === "commercial"
                              ? "Elevation / Floor Plate"
                              : property.category === "industrial"
                              ? "Clear Eaves Height"
                              : property.category === "agriculture"
                              ? "Topography & Terrain"
                              : "Elevation / Tier"}
                          </div>
                        </div>
                      )}

                      {isSpecValid(property.age) && (
                        <div className="p-2 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col justify-start">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-rose-800 mb-1 sm:mb-1.5 flex-shrink-0" />
                          <div className="text-[11px] sm:text-sm font-bold text-gray-900 dark:text-white leading-tight break-words">
                            {property.age}
                          </div>
                          <div className="text-[9px] sm:text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                            Handover Status
                          </div>
                        </div>
                      )}

                      {isSpecValid(property.details?.electricity) && (
                        <div className="p-2 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col justify-start">
                          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mb-1 sm:mb-1.5 flex-shrink-0" />
                          <div className="text-[11px] sm:text-sm font-bold text-gray-900 dark:text-white leading-tight break-words">
                            {property.details.electricity}
                          </div>
                          <div className="text-[9px] sm:text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                            Power Infrastructure
                          </div>
                        </div>
                      )}

                      {isSpecValid(property.details?.water) && (
                        <div className="p-2 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col justify-start">
                          <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mb-1 sm:mb-1.5 flex-shrink-0" />
                          <div className="text-[11px] sm:text-sm font-bold text-gray-900 dark:text-white leading-tight break-words">
                            {property.details.water}
                          </div>
                          <div className="text-[9px] sm:text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                            Water Network
                          </div>
                        </div>
                      )}

                      {isSpecValid(property.details?.security) && (
                        <div className="p-2 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col justify-start">
                          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mb-1 sm:mb-1.5 flex-shrink-0" />
                          <div className="text-[11px] sm:text-sm font-bold text-gray-900 dark:text-white leading-tight break-words">
                            {property.details.security}
                          </div>
                          <div className="text-[9px] sm:text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                            Estate Security
                          </div>
                        </div>
                      )}

                      {isSpecValid(property.details?.capacity) && (
                        <div className="p-2 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col justify-start">
                          <Home className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mb-1 sm:mb-1.5 flex-shrink-0" />
                          <div className="text-[11px] sm:text-sm font-bold text-gray-900 dark:text-white leading-tight break-words">
                            {property.details.capacity}
                          </div>
                          <div className="text-[9px] sm:text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                            Commercial Capacity
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>


            {/* Bespoke Customized Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <Card id="amenities" className="border border-rose-900/30 bg-white dark:bg-gray-900 shadow-sm rounded-2xl overflow-hidden scroll-mt-14">
                <div className="bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 text-white px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-2.5">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base">Bespoke Ultra-Luxury Amenities</h3>
                      <p className="text-[10px] sm:text-[11px] text-rose-200">Verified and curated private client specifications</p>
                    </div>
                  </div>
                  <Badge className="bg-amber-400 text-slate-950 font-black text-[10px]">
                    {property.amenities.length} Features
                  </Badge>
                </div>
                <CardContent className="p-3.5 sm:p-6">
                  {(() => {
                    const displayedAmenities = showAllAmenities ? property.amenities : property.amenities.slice(0, 6)
                    return (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                          {displayedAmenities.map((amenity, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 p-2 sm:p-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-rose-900/15 dark:border-rose-900/30 hover:border-rose-900/40 hover:bg-rose-50/30 dark:hover:bg-rose-950/20 transition-all shadow-sm"
                            >
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-rose-900/10 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 flex items-center justify-center flex-shrink-0 font-bold text-xs border border-rose-900/20">
                                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-800 dark:text-rose-400" />
                              </div>
                              <span className="text-[11px] sm:text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                {amenity}
                              </span>
                            </div>
                          ))}
                        </div>

                        {property.amenities.length > 6 && (
                          <button
                            type="button"
                            onClick={() => setShowAllAmenities(!showAllAmenities)}
                            className="w-full mt-3 py-2 px-3 rounded-xl border border-rose-900/25 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 flex items-center justify-center transition-all"
                          >
                            {showAllAmenities ? (
                              <>Show Less <ChevronUp className="w-3.5 h-3.5 ml-1" /></>
                            ) : (
                              <>View All {property.amenities.length} Bespoke Features (+{property.amenities.length - 6} more) <ChevronDown className="w-3.5 h-3.5 ml-1" /></>
                            )}
                          </button>
                        )}
                      </>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card id="dossier" className="border border-rose-900/15 dark:border-rose-900/30 shadow-sm bg-white dark:bg-gray-900 rounded-2xl scroll-mt-14">
              <CardContent className="p-3.5 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                  Architectural Dossier & Property Overview
                </h3>
                <p className={`text-gray-700 dark:text-gray-300 leading-relaxed text-xs sm:text-base ${!showFullDossier ? "line-clamp-3 sm:line-clamp-none" : ""}`}>
                  {property.description}
                </p>
                {property.description.length > 140 && (
                  <button
                    type="button"
                    onClick={() => setShowFullDossier(!showFullDossier)}
                    className="sm:hidden text-xs font-bold text-rose-800 dark:text-rose-400 mt-2 flex items-center"
                  >
                    {showFullDossier ? "Show Less ↑" : "Read Full Dossier ↓"}
                  </button>
                )}

                <div className="mt-3.5 sm:mt-6 pt-3.5 sm:pt-5 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[10px] sm:text-xs text-gray-500">
                    Confidential portfolio asset. Title verified by Senior Real Estate Counsel.
                  </div>
                  <Button
                    onClick={handleDownloadDossier}
                    variant="outline"
                    size="sm"
                    className="border-rose-900/40 text-rose-900 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold h-8"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    {dossierDownloaded ? "Dossier Sent!" : "Request Dossier"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Landmarks & Location Context */}
            <Card id="location" className="border border-rose-900/15 dark:border-rose-900/30 shadow-sm bg-white dark:bg-gray-900 rounded-2xl scroll-mt-14">
              <CardContent className="p-3.5 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    Prime Micro-Market & Connectivity
                  </h3>
                  <Badge variant="outline" className="text-[10px] sm:text-xs border-rose-900/30 text-rose-900 dark:text-rose-300">
                    {property.city}, {property.state}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  {property.landmarks.map((landmark, idx) => (
                    <div
                      key={idx}
                      className="p-2 sm:p-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-center"
                    >
                      <div className={`w-7 h-7 sm:w-9 sm:h-9 mx-auto rounded-full ${landmark.color} flex items-center justify-center mb-1 sm:mb-2`}>
                        <Plane className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="text-[11px] sm:text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {landmark.name}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-gray-500">{landmark.distance}</div>
                    </div>
                  ))}
                </div>

                {/* Map Presentation Card */}
                <div className="relative h-44 sm:h-60 rounded-xl overflow-hidden bg-slate-900 border border-gray-800 flex flex-col items-center justify-center text-center p-4 sm:p-6 text-white">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${catTheme.mapPinBg} flex items-center justify-center mb-2 sm:mb-3`}>
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                  </div>
                  <div className="font-bold text-sm sm:text-base">{property.location}</div>
                  <div className="text-[10px] sm:text-xs text-gray-400 mt-1 max-w-md line-clamp-2 sm:line-clamp-none">
                    Exact coordinates [{property.coordinates.lat}, {property.coordinates.lng}] will be provided upon signed Confidentiality Agreement (NDA) and appointment validation.
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowVipModal(true)}
                    className="mt-3 bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 hover:from-rose-950 text-white rounded-full text-xs font-bold px-4 h-8"
                  >
                    Request Location Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Private Client Concierge & Actions */}
          <div id="advisor" className="space-y-4 sm:space-y-6 scroll-mt-14">
            {/* VIP Acquisition Action Box - Royal Red Accented */}
            <Card className="border-2 border-rose-900/40 shadow-xl bg-gradient-to-b from-white via-white to-rose-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-rose-950/30 rounded-2xl lg:sticky lg:top-24">
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-rose-900 dark:text-rose-400" />
                    <span className="text-xs uppercase font-black tracking-wider text-rose-900 dark:text-rose-400">
                      JayaListing Suite
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>

                {/* Pricing & duplicate CTAs: ONLY on Desktop (since mobile has sticky bottom bar!) */}
                <div className="hidden lg:block">
                  <div className="text-xs text-gray-500">Offered at</div>
                  <div className="text-3xl font-black text-rose-900 dark:text-rose-400">
                    {property.price}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {property.details.area} • {property.propertyType}
                  </div>
                </div>

                <div className="hidden lg:block space-y-2.5">
                  <Button
                    onClick={() => setShowVipModal(true)}
                    className="w-full h-11 bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 hover:from-rose-950 hover:to-red-950 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-900/30 border border-amber-400/20"
                  >
                    <Calendar className="w-4 h-4 mr-2 text-amber-300" />
                    Book Private VIP Viewing
                  </Button>

                  <a
                    href={`https://wa.me/918296530609?text=Hello,%20I%20am%20interested%20in%20arranging%20a%20private%20confidential%20viewing%20for%20${encodeURIComponent(property.title)}%20(${property.price}).`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center h-10 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs transition-colors shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </a>

                  <a
                    href="tel:+918296530609"
                    className="w-full flex items-center justify-center h-10 rounded-xl border border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-900 dark:text-rose-300 font-bold text-xs transition-colors"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Us: +91 82965 30609
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Confidentiality Guarantee */}
            <Card className="border border-rose-900/15 dark:border-rose-900/30 bg-white dark:bg-gray-900 rounded-2xl">
              <CardContent className="p-3.5 sm:p-5 text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rose-900/10 text-rose-900 dark:text-rose-400 flex items-center justify-center mx-auto mb-1.5">
                  <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                  100% Confidential Transactions
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  All inquiries and buyer identities are held under strict attorney-client privilege non-disclosure protocols.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Similar Trophy Properties Section with WORKING Links */}
        <div className="mt-8 sm:mt-16 pt-6 sm:pt-10 border-t border-rose-900/10 dark:border-rose-900/20">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <div>
              <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider text-rose-900 dark:text-rose-400">
                Exclusive Portfolio
              </span>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-gray-900 dark:text-white mt-0.5">
                Other Trophy Assets You May Acquire
              </h2>
            </div>
            <Link
              href="/residential"
              className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-400 hover:text-rose-800 flex items-center flex-shrink-0"
            >
              <span className="hidden sm:inline">Browse Collection</span>
              <span className="sm:hidden">All</span>
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>

          {/* Touch-swipe horizontal carousel on mobile, clean grid on desktop */}
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
            {relatedProperties.map((relatedProperty) => (
              <Card
                key={relatedProperty.id}
                onClick={() => router.push(`/property/${relatedProperty.id}`)}
                className="w-[78vw] max-w-[290px] sm:w-auto sm:max-w-none flex-shrink-0 snap-start overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-gray-900 border border-rose-900/15 dark:border-rose-900/30 rounded-2xl group flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-900">
                    <Image
                      src={relatedProperty.images[0]}
                      alt={relatedProperty.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 80vw, 33vw"
                    />
                    <Badge className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-amber-300 border border-amber-400/30 text-[10px] sm:text-xs">
                      {relatedProperty.propertyType}
                    </Badge>
                    <div className="absolute bottom-2.5 left-2.5 bg-black/85 backdrop-blur-md text-amber-200 font-extrabold text-sm sm:text-base px-2.5 py-0.5 rounded-lg border border-rose-900/40">
                      {relatedProperty.price}
                    </div>
                  </div>

                  <CardContent className="p-3.5 sm:p-5">
                    <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white line-clamp-1 group-hover:text-rose-800 transition-colors">
                      {relatedProperty.title}
                    </h3>
                    <div className="flex items-center text-[11px] sm:text-xs text-gray-500 mt-1 mb-2">
                      <MapPin className={`w-3.5 h-3.5 ${getCategoryTheme(relatedProperty.category).iconColor} mr-1 flex-shrink-0`} />
                      <span className={`truncate font-medium ${getCategoryTheme(relatedProperty.category).placeColor}`}>{relatedProperty.location}</span>
                    </div>

                    <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-2 py-1.5 border-t border-b border-gray-100 dark:border-gray-800">
                      <span>{relatedProperty.area}</span>
                      <span>•</span>
                      <span>{relatedProperty.bedrooms ? `${relatedProperty.bedrooms} BHK` : relatedProperty.details.area}</span>
                      <span>•</span>
                      <span className={`font-bold ${getCategoryTheme(relatedProperty.category).placeColor}`}>{relatedProperty.city}</span>
                    </div>
                  </CardContent>
                </div>

                <div className="p-3.5 sm:p-5 pt-0">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/property/${relatedProperty.id}`)
                    }}
                    className="w-full border-rose-900/40 text-rose-900 dark:text-rose-300 hover:bg-rose-900 hover:text-white rounded-xl text-xs font-bold transition-all h-9 cursor-pointer"
                  >
                    Click Here
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Frequently Asked Questions Section (Customizable, Fact-Checked, AEO & FAQPage Schema) */}
        {publicListing && publicListing.faqs && publicListing.faqs.length > 0 && (
          <section id="faq" className="mt-8 sm:mt-16 pt-6 sm:pt-10 border-t border-rose-900/10 dark:border-rose-900/20 scroll-mt-14">
            <div className="mb-4 sm:mb-8">
              <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider text-rose-900 dark:text-rose-400">
                Fact-Checked Verification
              </span>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-gray-900 dark:text-white mt-0.5">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Verified answers and direct factual disclosures for buyers, principals, and investors
              </p>
            </div>

            <Card className="border border-rose-900/15 dark:border-rose-900/30 shadow-md bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 text-white px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-white">Direct Advisory Insights</h3>
                    <p className="text-[10px] sm:text-[11px] text-rose-200">Fact-checked answers for {property.title}</p>
                  </div>
                </div>
                <Badge className="bg-amber-400 text-slate-950 font-black text-[10px] tracking-wide">
                  Verified
                </Badge>
              </div>

              <CardContent className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {publicListing.faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-1.5 hover:border-rose-900/30 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-rose-900 dark:text-amber-400 font-black text-xs sm:text-sm">Q:</span>
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white leading-snug">
                        {faq.question}
                      </h4>
                    </div>
                    <div className="flex items-start gap-2 pl-4">
                      <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      {/* Sticky Mobile VIP Action Bar - instant access without scrolling */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-t border-rose-900/30 px-4 py-2.5 shadow-2xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] text-gray-500 truncate">Investment Value</div>
          <div className="text-base font-black text-rose-900 dark:text-rose-400 truncate">
            {property.price}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="p-2.5 rounded-xl border border-rose-900/20 dark:border-rose-900/40 bg-stone-100 dark:bg-gray-800 text-rose-900 dark:text-rose-300 font-bold"
            title="Share Property (Public or Private VIP)"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <a
            href={`https://wa.me/918296530609?text=Hello,%20I%20am%20interested%20in%20arranging%20a%20private%20confidential%20viewing%20for%20${encodeURIComponent(property.title)}%20(${property.price}).`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white shadow-sm flex items-center justify-center gap-1.5 font-bold text-xs"
            title="WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>
          <Button
            onClick={() => setShowVipModal(true)}
            className="bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 hover:from-rose-950 text-white rounded-xl text-xs font-bold px-3.5 h-10 shadow-md shadow-rose-900/30 border border-amber-400/20"
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
            Book VIP Tour
          </Button>
        </div>
      </div>

      {/* Modal for VIP Tour Scheduling */}
      {showVipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-rose-900/40 shadow-2xl relative">
            <button
              onClick={() => setShowVipModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-rose-50 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>

            {bookingConfirmed ? (
              <div className="text-center py-6 sm:py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  VIP Appointment Confirmed
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-sm mx-auto">
                  Your request has been delivered to the Private Client Desk at <strong>jayalisting@gmail.com</strong>. Our executive concierge will reach out via WhatsApp/Call to confirm security escort details.
                </p>
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-xs font-semibold text-rose-900 dark:text-rose-300 border border-rose-900/20">
                  Reference: {bookingReference || `JAYA-ROYAL-${property.id}-2026`}
                </div>
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowVipModal(false)
                      setBookingConfirmed(false)
                    }}
                    className="h-10 px-6 rounded-xl bg-rose-900 hover:bg-rose-950 text-white text-xs font-bold"
                  >
                    Close & Continue Browsing
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-2 text-rose-900 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Royal Private Appointment
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  Schedule Private Viewing
                </h3>
                <p className="text-xs text-gray-500 mt-1 mb-5">
                  Exclusive appointment for {property.title} ({property.price})
                </p>

                {tourError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                    <span>{tourError}</span>
                  </div>
                )}

                <form onSubmit={handleBookTour} className="space-y-4">
                  {/* Honeypot field for bot defense */}
                  <input
                    type="text"
                    name="hp_website"
                    tabIndex={-1}
                    autoComplete="off"
                    style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
                  />

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Viewing Preference
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setTourType("in-person")}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                          tourType === "in-person"
                            ? "border-rose-900 bg-rose-900/10 text-rose-900 dark:text-rose-300 font-bold"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        <Compass className="w-4 h-4" />
                        <span>In-Person VIP Tour</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTourType("virtual")}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                          tourType === "virtual"
                            ? "border-rose-900 bg-rose-900/10 text-rose-900 dark:text-rose-300 font-bold"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        <span>Private 4K Video Tour</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        value={tourDate}
                        onChange={(e) => setTourDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-xs focus:ring-1 focus:ring-rose-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                        Preferred Time
                      </label>
                      <select
                        value={tourTime}
                        onChange={(e) => setTourTime(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-xs focus:ring-1 focus:ring-rose-800"
                      >
                        <option>10:00 AM</option>
                        <option>11:30 AM</option>
                        <option>02:00 PM</option>
                        <option>04:30 PM (Sunset)</option>
                        <option>06:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      Full Legal Name / Entity
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mr. Rajesh Adani or Family Office"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-xs focus:ring-1 focus:ring-rose-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                        Private Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98..."
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        required
                        className="w-full h-10 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-xs focus:ring-1 focus:ring-rose-800"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="vip@domain.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        required
                        className="w-full h-10 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-xs focus:ring-1 focus:ring-rose-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      Special Requirements / Security Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Helipad landing clearance, NDAs required, family office principal attending..."
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 text-xs focus:ring-1 focus:ring-rose-800"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmittingTour}
                    className="w-full h-11 bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 hover:from-rose-950 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-900/30 mt-2 border border-amber-400/20 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isSubmittingTour ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                        <span>Transmitting to VIP Concierge Desk...</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4 text-amber-300" />
                        <span>Confirm Private VIP Appointment</span>
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen High-Resolution Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setShowLightbox(false)}
        >
          {/* Top bar with image info and close button */}
          <div className="flex items-center justify-between text-white z-10 py-1">
            <div className="text-xs sm:text-sm font-semibold tracking-wide truncate max-w-[80vw]">
              {property.title} • <span className="text-amber-400">Photo {currentImageIndex + 1} of {property.images.length}</span>
            </div>
            <button
              onClick={() => setShowLightbox(false)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              title="Close (Esc)"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Centered Large High-Res Image (object-contain so nothing is cropped!) */}
          <div
            className="relative flex-1 w-full flex items-center justify-center my-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full max-h-[78vh] flex items-center justify-center">
              <Image
                src={property.images[currentImageIndex] || property.images[0]}
                alt={`${property.title} Fullview`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {/* Navigation Arrows inside Lightbox */}
            {property.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/70 hover:bg-black/95 text-white backdrop-blur-md flex items-center justify-center border border-white/30 transition-all shadow-xl active:scale-95"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextImage()
                  }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/70 hover:bg-black/95 text-white backdrop-blur-md flex items-center justify-center border border-white/30 transition-all shadow-xl active:scale-95"
                  aria-label="Next"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>

          {/* Bottom thumbnails strip inside Lightbox */}
          <div
            className="flex justify-center space-x-2 overflow-x-auto py-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {property.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`relative w-14 h-10 sm:w-16 sm:h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                  idx === currentImageIndex
                    ? "border-amber-400 scale-105 shadow-md shadow-amber-400/30"
                    : "border-white/20 opacity-50 hover:opacity-100"
                }`}
              >
                <Image src={img} alt={`Thumb ${idx + 1}`} fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        </div>
      )}

      {property && (
        <PropertyShareModal
          property={property}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          isAdmin={isAdminUser}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  )
}
