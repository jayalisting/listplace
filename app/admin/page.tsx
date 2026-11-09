"use client"

import { useState, useEffect, useRef } from "react"
import {
  Building,
  Home,
  Factory,
  TreePine,
  Plus,
  Trash2,
  Database,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Shield,
  ArrowRight,
  Search,
  CheckCircle2,
  MapPin,
  Square,
  Bed,
  Bath,
  Car,
  Image as ImageIcon,
  RotateCcw,
  X,
  AlertCircle,
  Check,
  Edit,
  Sliders,
  Lock,
  Globe,
  Share2,
  Compass,
  Zap,
  Droplets,
  Phone,
  User,
  ShieldCheck,
  HelpCircle,
  Calendar,
  MessageCircle,
  Mail,
  Clock,
  Star,
  ArrowUp,
  ArrowDown,
  Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import Image from "next/image"
import Footer from "@/components/footer"
import { LuxuryProperty } from "@/lib/luxury-properties"
import ImageUploadManager from "@/components/image-upload-manager"
import PropertyShareModal from "@/components/property-share-modal"
import AdminImageSeoManager from "@/components/admin-image-seo-manager"
import AdminDatabaseMonitor from "@/components/admin-database-monitor"
import CrmWorkspace from "@/components/crm-workspace"
import AdminErrorBoundary from "@/components/admin-error-boundary"

export default function AdminPage() {
  const [properties, setProperties] = useState<LuxuryProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [mainAdminTab, setMainAdminTab] = useState<"estates" | "vip_appointments" | "image_seo" | "database_monitor" | "crm">("estates")
  const [vipBookings, setVipBookings] = useState<any[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [updatingBookingId, setUpdatingBookingId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "residential" | "commercial" | "industrial" | "agriculture">("all")
  const [searchFilter, setSearchFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10
  const lastRefreshTime = useRef(Date.now())

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)

  // Admin Security Verification (Ensures regular users cannot access controller or delete listings)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [adminPinInput, setAdminPinInput] = useState("")
  const [pinError, setPinError] = useState(false)
  const [mounted, setMounted] = useState(false)



  // Inline Amenities Editor for Existing PostgreSQL Listings
  const [editingAmenitiesId, setEditingAmenitiesId] = useState<string | null>(null)
  const [currentEditAmenities, setCurrentEditAmenities] = useState<string[]>([])
  const [editAmenityInput, setEditAmenityInput] = useState("")
  const [isSavingAmenities, setIsSavingAmenities] = useState(false)

  // Full Property Customization Modal State (Customizes ALL fields)
  const [editingProperty, setEditingProperty] = useState<LuxuryProperty | null>(null)
  const [isSavingFullProperty, setIsSavingFullProperty] = useState(false)
  const [sharingAdminProp, setSharingAdminProp] = useState<LuxuryProperty | null>(null)
  const [togglingVisibilityId, setTogglingVisibilityId] = useState<string | null>(null)

  const [editPropertyForm, setEditPropertyForm] = useState<{
    title: string
    tagline: string
    category: "residential" | "commercial" | "industrial" | "agriculture"
    propertyType: string
    price: string
    area: string
    carpetArea: string
    location: string
    city: string
    state: string
    bedrooms: number
    bathrooms: number
    parking: string
    facing: string
    floor: string
    age: string
    powerBackup: string
    waterSupply: string
    estateSecurity: string
    status: "For Sale" | "For Lease" | "Private Treaty"
    purpose: "sale" | "lease" | "rent"
    visibility: "public" | "private"
    images: string[]
    description: string
    amenities: string[]
    customFaqs: { question: string; answer: string }[]
    displayOrder: number
    featuredHome: boolean
    sellerName: string
    sellerPhone: string
    sellerTitle: string
  }>({
    title: "",
    tagline: "",
    category: "residential",
    propertyType: "",
    price: "",
    area: "",
    carpetArea: "",
    location: "",
    city: "",
    state: "",
    bedrooms: 0,
    bathrooms: 0,
    parking: "",
    facing: "",
    floor: "",
    age: "",
    powerBackup: "",
    waterSupply: "",
    estateSecurity: "",
    status: "For Sale",
    purpose: "sale",
    visibility: "public",
    images: [],
    description: "",
    amenities: [],
    customFaqs: [],
    displayOrder: 100,
    featuredHome: false,
    sellerName: "Rohit Singhania",
    sellerPhone: "+91 82965 30609",
    sellerTitle: "Senior VP, Jaya Royal Portfolio",
  })
  const [editPropAmenityInput, setEditPropAmenityInput] = useState("")
  const [newAdminFaqQuestion, setNewAdminFaqQuestion] = useState("")
  const [newAdminFaqAnswer, setNewAdminFaqAnswer] = useState("")

  // Category Presets for quick-adding customized amenities
  const AMENITY_SUGGESTIONS: Record<string, string[]> = {
    residential: [
      "Private Helipad",
      "Olympic Infinity Pool",
      "Wine Cellar & Tasting Room",
      "Biometric Vault",
      "IMAX Home Cinema",
      "Private Spa & Sauna",
      "Smart Crestron Automation",
      "Sub-Zero Chef Kitchen",
      "Private Squash Court",
      "Dedicated Butler Quarters",
      "Bulletproof Panic Room",
      "Italian Carrara Marble",
    ],
    commercial: [
      "High-Speed Destination Elevators",
      "LEED Platinum Certified",
      "Executive Boardrooms",
      "Triple Redundant Fiber",
      "100% Dual DG Power",
      "Central HVAC HEPA",
      "Biometric Turnstiles",
      "Rooftop Helipad Access",
      "VIP Valet Concierge",
      "Acoustic Boardroom Suites",
    ],
    industrial: [
      "14m Clear Eaves Height",
      "FM2 Laser-Leveled Flooring",
      "Automated Dock Levelers",
      "2 MVA Dedicated Substation",
      "Heavy-Duty Overhead Crane",
      "24/7 Armed Security",
      "Solar Microgrid 500kW",
      "ESFR Fire Sprinklers",
      "Direct Highway Access",
    ],
    agriculture: [
      "Micro-Drip Irrigation Network",
      "Dedicated Borewells (4x)",
      "Organic Soil Certification",
      "50HP Solar Pump Station",
      "Worker Quarters",
      "Cold Storage Warehouse",
      "Riverfront Access",
      "Perimeter Solar Fencing",
      "Processing Unit Shed",
    ],
  }



  // Handlers for Existing Listings Custom Amenities
  const handleOpenEditAmenities = (property: LuxuryProperty) => {
    if (editingAmenitiesId === property.id) {
      setEditingAmenitiesId(null)
      return
    }
    setEditingAmenitiesId(property.id)
    const existing =
      property.amenities && property.amenities.length > 0
        ? property.amenities
        : property.highlights && property.highlights.length > 0
        ? property.highlights
        : ["24/7 Private Concierge"]
    setCurrentEditAmenities([...existing])
    setEditAmenityInput("")
  }

  const handleAddEditAmenity = (name?: string) => {
    const val = (name || editAmenityInput).trim()
    if (!val) return
    if (!currentEditAmenities.includes(val)) {
      setCurrentEditAmenities([...currentEditAmenities, val])
    }
    setEditAmenityInput("")
  }

  const handleRemoveEditAmenity = (index: number) => {
    setCurrentEditAmenities(currentEditAmenities.filter((_, i) => i !== index))
  }

  const handleSaveAmenitiesToPostgres = async (propertyId: string, title: string) => {
    setIsSavingAmenities(true)
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({ amenities: currentEditAmenities }),
      })
      const data = await res.json()
      if (data.success) {
        setActionMessage(`Customized amenities for "${title}" saved to PostgreSQL!`)
        setEditingAmenitiesId(null)
        fetchProperties()
        setTimeout(() => setActionMessage(null), 4000)
      } else {
        alert("Failed to update amenities: " + data.error)
      }
    } catch (err) {
      alert("Error saving amenities: " + err)
    } finally {
      setIsSavingAmenities(false)
    }
  }

  // Handlers for Full Property Customizer
  const handleOpenEditProperty = (item: LuxuryProperty) => {
    setEditingProperty(item)
    const details = item.details || {}
    const seller = item.seller || {}
    setEditPropertyForm({
      title: item.title,
      tagline: item.tagline || "",
      category: item.category,
      propertyType: item.propertyType,
      price: item.price,
      area: item.area,
      carpetArea: item.carpetArea || (details as any).carpet || "",
      location: item.location,
      city: item.city,
      state: item.state,
      bedrooms: item.bedrooms || 0,
      bathrooms: item.bathrooms || 0,
      parking: item.parking || (details as any).parking || "",
      facing: item.facing || (details as any).facing || "",
      floor: item.floor || (details as any).floor || (details as any).elevationTier || "",
      age: item.age || (details as any).age || "Ready to Move",
      powerBackup: (details as any).electricity || "100% Dual DG Backup",
      waterSupply: (details as any).water || "24/7 Treated Supply",
      estateSecurity: (details as any).security || "Biometric 24/7",
      status: item.status || "For Sale",
      purpose: (item.purpose as any) || (item.listingType === "rent" ? "lease" : "sale"),
      visibility: (item.visibility as "public" | "private") || "public",
      images: item.images && item.images.length > 0 ? [...item.images] : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"],
      description: item.description || "",
      amenities:
        item.amenities && item.amenities.length > 0
          ? [...item.amenities]
          : item.highlights && item.highlights.length > 0
          ? [...item.highlights]
          : ["24/7 Private Concierge"],
      customFaqs:
        item.customFaqs && item.customFaqs.length > 0
          ? [...item.customFaqs]
          : Array.isArray((item.attributes as any)?.customFaqs) && (item.attributes as any).customFaqs.length > 0
          ? [...(item.attributes as any).customFaqs]
          : [],
      displayOrder: item.displayOrder !== undefined ? Number(item.displayOrder) : 100,
      featuredHome: Boolean(item.featuredHome),
      sellerName: seller.name || "Rohit Singhania",
      sellerPhone: seller.phone || "+91 82965 30609",
      sellerTitle: seller.title || "Senior VP, Jaya Royal Portfolio",
    })
    setEditPropAmenityInput("")
  }

  const handleAddEditPropAmenity = (name?: string) => {
    const val = (name || editPropAmenityInput).trim()
    if (!val) return
    if (!editPropertyForm.amenities.includes(val)) {
      setEditPropertyForm((prev) => ({
        ...prev,
        amenities: [...prev.amenities, val],
      }))
    }
    setEditPropAmenityInput("")
  }

  const handleRemoveEditPropAmenity = (index: number) => {
    setEditPropertyForm((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }))
  }

  const handleAddAdminFaq = () => {
    if (newAdminFaqQuestion.trim() && newAdminFaqAnswer.trim()) {
      setEditPropertyForm((prev) => ({
        ...prev,
        customFaqs: [
          ...prev.customFaqs,
          { question: newAdminFaqQuestion.trim(), answer: newAdminFaqAnswer.trim() },
        ],
      }))
      setNewAdminFaqQuestion("")
      setNewAdminFaqAnswer("")
    }
  }

  const handleRemoveAdminFaq = (index: number) => {
    setEditPropertyForm((prev) => ({
      ...prev,
      customFaqs: prev.customFaqs.filter((_, i) => i !== index),
    }))
  }

  const handleUpdateAdminFaq = (index: number, field: "question" | "answer", val: string) => {
    setEditPropertyForm((prev) => ({
      ...prev,
      customFaqs: prev.customFaqs.map((faq, i) => (i === index ? { ...faq, [field]: val } : faq)),
    }))
  }

  const handlePrepopulateAdminFaqs = () => {
    const estateTitle = editPropertyForm.title.trim() || `${editPropertyForm.propertyType} in ${editPropertyForm.location}`
    const priceFormatted = editPropertyForm.price || "₹25.0 Cr"
    const areaStr = editPropertyForm.area || "6,500 sq ft"

    const suggested: { question: string; answer: string }[] = [
      {
        question: `Where is ${estateTitle} located?`,
        answer: `${estateTitle} is situated at ${editPropertyForm.location}, ${editPropertyForm.city}, ${editPropertyForm.state}, India.`,
      },
      {
        question: `What is the price of ${estateTitle}?`,
        answer: `The asking price is ${priceFormatted} under ${editPropertyForm.status} status with verified title documentation.`,
      },
      {
        question: `What are the dimensions and configuration of this ${editPropertyForm.propertyType}?`,
        answer: `${estateTitle} offers Total Area: ${areaStr}${editPropertyForm.carpetArea ? `, Carpet Area: ${editPropertyForm.carpetArea}` : ""}${editPropertyForm.bedrooms ? `, ${editPropertyForm.bedrooms} BHK` : ""}.`,
      },
      {
        question: `Is parking available at ${estateTitle}?`,
        answer: `Yes, this property includes ${editPropertyForm.parking || "Covered Bays"}.`,
      },
    ]

    if (editPropertyForm.amenities.length > 0) {
      suggested.push({
        question: `What signature amenities and infrastructure does ${estateTitle} provide?`,
        answer: `${estateTitle} features ${editPropertyForm.amenities.slice(0, 6).join(", ")}.`,
      })
    }

    setEditPropertyForm((prev) => ({
      ...prev,
      customFaqs: suggested,
    }))
  }

  const handleSaveFullProperty = async () => {
    if (!editingProperty) return
    setIsSavingFullProperty(true)
    try {
      const res = await fetch(`/api/properties/${editingProperty.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({
          title: editPropertyForm.title,
          tagline: editPropertyForm.tagline,
          category: editPropertyForm.category,
          propertyType: editPropertyForm.propertyType,
          price: editPropertyForm.price,
          area: editPropertyForm.area,
          carpetArea: editPropertyForm.carpetArea || undefined,
          location: editPropertyForm.location,
          city: editPropertyForm.city,
          state: editPropertyForm.state,
          bedrooms: editPropertyForm.bedrooms ? Number(editPropertyForm.bedrooms) : null,
          bathrooms: editPropertyForm.bathrooms ? Number(editPropertyForm.bathrooms) : null,
          parking: editPropertyForm.parking,
          facing: editPropertyForm.facing,
          floor: editPropertyForm.floor,
          age: editPropertyForm.age,
          status: editPropertyForm.status,
          purpose: editPropertyForm.purpose,
          visibility: editPropertyForm.visibility,
          images: editPropertyForm.images.length > 0 ? editPropertyForm.images : editingProperty.images,
          description: editPropertyForm.description,
          amenities: editPropertyForm.amenities,
          customFaqs: editPropertyForm.customFaqs.filter((f) => f.question.trim() && f.answer.trim()),
          displayOrder: Number(editPropertyForm.displayOrder) || 100,
          featuredHome: Boolean(editPropertyForm.featuredHome),
          details: {
            ...(editingProperty.details || {}),
            area: editPropertyForm.area,
            carpet: editPropertyForm.carpetArea,
            propertyType: editPropertyForm.propertyType,
            parking: editPropertyForm.parking,
            facing: editPropertyForm.facing,
            floor: editPropertyForm.floor,
            age: editPropertyForm.age,
            electricity: editPropertyForm.powerBackup,
            water: editPropertyForm.waterSupply,
            security: editPropertyForm.estateSecurity,
            elevationTier: editPropertyForm.floor,
            nicheCategory: editPropertyForm.category,
          },
          seller: {
            ...(editingProperty.seller || {}),
            name: editPropertyForm.sellerName,
            phone: editPropertyForm.sellerPhone,
            title: editPropertyForm.sellerTitle,
          },
        }),
      })
      const data = await res.json()
      if (data.success) {
        setActionMessage(`Property #${editingProperty.id} ("${editPropertyForm.title}") updated successfully in PostgreSQL!`)
        setEditingProperty(null)
        fetchProperties()
        setTimeout(() => setActionMessage(null), 5000)
      } else {
        alert("Failed to update property: " + (data.error || "Unknown error"))
      }
    } catch (err: any) {
      alert("Error updating property: " + err.message)
    } finally {
      setIsSavingFullProperty(false)
    }
  }

  // Quick Visibility Toggle on Table row
  const handleToggleTableVisibility = async (prop: LuxuryProperty) => {
    const nextVis = prop.visibility === "private" ? "public" : "private"
    setTogglingVisibilityId(prop.id)
    try {
      const res = await fetch(`/api/properties/${prop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: nextVis }),
      })
      const data = await res.json()
      if (data.success) {
        setProperties((prev) =>
          prev.map((p) => (p.id === prop.id ? { ...p, visibility: nextVis } : p))
        )
        setActionMessage(`Property #${prop.id} is now ${nextVis === "private" ? "Private VIP Share Only" : "Public Directory"}`)
        setTimeout(() => setActionMessage(null), 3500)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setTogglingVisibilityId(null)
    }
  }

  // Fetch properties from PostgreSQL API (bypassing any browser cache and including private listings)
  const fetchProperties = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/properties?includePrivate=true&t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setProperties(data.data)
        setDbConnected(true)
      } else {
        setDbConnected(false)
      }
    } catch (err) {
      console.error("Failed to connect to database:", err)
      setDbConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const fetchVipBookings = async () => {
    setLoadingBookings(true)
    try {
      const res = await fetch(`/api/vip-tours?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", "x-admin-key": "jayaadmin" },
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setVipBookings(data.data)
      }
    } catch (err) {
      console.error("Failed to load VIP tour bookings:", err)
    } finally {
      setLoadingBookings(false)
    }
  }

  const handleUpdateBookingStatus = async (id: number, status: string) => {
    setUpdatingBookingId(id)
    try {
      const res = await fetch(`/api/vip-tours/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": "jayaadmin" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        setVipBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status } : b))
        )
        setActionMessage(`VIP Appointment #${id} marked as ${status}`)
        setTimeout(() => setActionMessage(null), 3500)
      }
    } catch (err) {
      alert("Failed to update status: " + err)
    } finally {
      setUpdatingBookingId(null)
    }
  }

  const handleDeleteBooking = async (id: number) => {
    if (!confirm(`Delete VIP Appointment #${id}?`)) return
    try {
      const res = await fetch(`/api/vip-tours/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": "jayaadmin" },
      })
      const data = await res.json()
      if (data.success) {
        setVipBookings((prev) => prev.filter((b) => b.id !== id))
        setActionMessage(`VIP Appointment #${id} removed from database`)
        setTimeout(() => setActionMessage(null), 3500)
      }
    } catch (err) {
      alert("Failed to delete booking: " + err)
    }
  }

  const handleQuickReorder = async (prop: LuxuryProperty, newOrder: number, newFeatured?: boolean) => {
    try {
      const res = await fetch(`/api/properties/${prop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayOrder: newOrder,
          featuredHome: newFeatured !== undefined ? newFeatured : prop.featuredHome,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setActionMessage(`"${prop.title}" priority updated (Position #${newOrder}${newFeatured ? " - Featured Top" : ""})!`)
        fetchProperties()
        setTimeout(() => setActionMessage(null), 3500)
      }
    } catch (err) {
      alert("Error updating order: " + err)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetch("/api/admin/check")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAdminAuthenticated(true)
          localStorage.setItem("jaya_admin_authenticated", "true")
        } else {
          setIsAdminAuthenticated(false)
          localStorage.removeItem("jaya_admin_authenticated")
          localStorage.removeItem("jaya_admin_token")
        }
      })
      .catch(() => {
        setIsAdminAuthenticated(false)
      })
    fetchProperties()
    fetchVipBookings()

    // Revalidate-on-focus: debounced to 30s so returning to the tab checks for new bookings/changes
    const onFocus = () => {
      const now = Date.now()
      if (now - lastRefreshTime.current > 30000) {
        lastRefreshTime.current = now
        fetchProperties()
        fetchVipBookings()
      }
    }
    window.addEventListener("focus", onFocus)

    // Gentle 45-second background interval, running only when the tab is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        lastRefreshTime.current = Date.now()
        fetchProperties()
        fetchVipBookings()
      }
    }, 45000)

    return () => {
      window.removeEventListener("focus", onFocus)
      clearInterval(interval)
    }
  }, [])

  // Reset pagination when category or search filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchFilter])

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminPinInput) return
    setIsSubmitting(true)
    setPinError(false)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPinInput }),
      })
      const data = await res.json()
      if (data.success) {
        setIsAdminAuthenticated(true)
        localStorage.setItem("jaya_admin_authenticated", "true")
        if (data.token) {
          localStorage.setItem("jaya_admin_token", data.token)
        }
        setAdminPinInput("")
      } else {
        setPinError(true)
      }
    } catch {
      setPinError(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleAdminLogout = async () => {
    setIsLoggingOut(true)
    try {
      localStorage.removeItem("jaya_admin_authenticated")
      localStorage.removeItem("jaya_admin_token")
      sessionStorage.clear()
      document.cookie = "jaya_admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;"
      setIsAdminAuthenticated(false)

      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { "Cache-Control": "no-cache" },
      })
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      window.location.reload()
    }
  }

  // Handle Form Submit -> Insert into PostgreSQL


  // Handle Delete -> Strictly admin-only; calls PostgreSQL DELETE with x-admin-key
  const executeDelete = async (id: string, title: string) => {
    if (!isAdminAuthenticated) {
      alert("Unauthorized: Users cannot delete listings. Only administrator can delete.")
      return
    }
    setIsDeletingId(id)
    setConfirmDeleteId(null)

    // Immediate optimistic removal so the listing vanishes without delay
    setProperties((prev) => prev.filter((p) => p.id !== id))

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
        setActionMessage(`"${title}" (#${id}) successfully deleted from PostgreSQL database!`)
        // Re-sync with database to ensure true state
        fetchProperties()
        setTimeout(() => setActionMessage(null), 4000)
      } else {
        alert("Delete failed: " + data.error)
        fetchProperties()
      }
    } catch (err) {
      alert("Error deleting listing: " + err)
      fetchProperties()
    } finally {
      setIsDeletingId(null)
    }
  }

  // Reset or re-seed database with default luxury assets
  const handleResetDatabase = async () => {
    if (!confirm("Restore default luxury estates in PostgreSQL? Custom estates will be reset.")) {
      return
    }
    setIsResetting(true)
    try {
      const res = await fetch("/api/properties?action=reset", {
        method: "POST",
        headers: { "Cache-Control": "no-cache" },
      })
      const data = await res.json()
      if (data.success) {
        setActionMessage(data.message || "Database restored with luxury estates!")
        fetchProperties()
        setTimeout(() => setActionMessage(null), 4000)
      } else {
        alert("Reset failed: " + data.error)
      }
    } catch (err) {
      alert("Reset error: " + err)
    } finally {
      setIsResetting(false)
    }
  }

  // Filter listings
  const filtered = properties.filter((p) => {
    if (!p) return false
    if (activeTab !== "all" && p.category !== activeTab) return false
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase()
      return (
        (p.title || "").toLowerCase().includes(q) ||
        (p.location || "").toLowerCase().includes(q) ||
        (p.city || "").toLowerCase().includes(q) ||
        (p.propertyType || "").toLowerCase().includes(q)
      )
    }
    return true
  })

  // Pagination for Dashboard Listings
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1
  const paginatedListings = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Category counts
  const residentialCount = properties.filter((p) => p.category === "residential").length
  const commercialCount = properties.filter((p) => p.category === "commercial").length
  const industrialCount = properties.filter((p) => p.category === "industrial").length
  const agricultureCount = properties.filter((p) => p.category === "agriculture").length

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "residential":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-500/30"
      case "commercial":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-500/30"
      case "industrial":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-500/30"
      case "agriculture":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-500/30"
      default:
        return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
    }
  }

  // Admin Security Gate Check: Users CANNOT access admin controller or delete listings
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-red-900 selection:text-white">
        <header className="bg-gradient-to-r from-rose-950 via-red-900 to-slate-950 text-white shadow-xl border-b border-rose-800/40 px-4 py-4">
          <div className="container mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="JayaListing Royal Emblem"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(245,158,11,0.3)] transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <span className="text-amber-300 font-serif font-black text-xl">JayaListing</span>
            </Link>
            <Link href="/" className="text-xs text-rose-300 hover:text-white transition">
              ← Return to Public Site
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-12">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-950 to-stone-900 text-amber-400 flex items-center justify-center mx-auto shadow-md border border-amber-600/30">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-widest font-black text-amber-600 dark:text-amber-400">
                Authorized Administrator Only
              </span>
              <h1 className="text-2xl font-serif font-black text-stone-900 dark:text-white mt-1">
                Admin Estate Controller
              </h1>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
                Database management, listing modifications, and deletions are strictly restricted to the administrator. Regular users cannot delete or edit listings.
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminPinInput}
                  onChange={(e) => {
                    setAdminPinInput(e.target.value)
                    setPinError(false)
                  }}
                  placeholder="Enter Administrator Password"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 dark:bg-stone-800 focus:border-red-900 focus:ring-2 focus:ring-red-900/20 text-center text-sm font-mono tracking-widest outline-none"
                  autoFocus
                  required
                />
                {pinError && (
                  <p className="text-xs text-red-600 font-semibold mt-1.5">
                    Invalid administrator password. Access denied.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-950 via-rose-900 to-red-950 text-amber-300 font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-md shadow-red-950/20 transition flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-amber-300" />
                  <span>{isSubmitting ? "Verifying..." : "Verify Administrator Access"}</span>
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
              <Link href="/" className="hover:text-stone-900 dark:hover:text-white transition font-medium">
                ← Return to Public Site
              </Link>
              <span>Protected Controller</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Royal Red Maroon Admin Header */}
      <header className="bg-gradient-to-r from-rose-950 via-red-900 to-slate-950 text-white shadow-xl border-b border-rose-800/40 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="JayaListing Royal Emblem"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)] transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div>
                <div className="text-lg font-black tracking-tight flex items-center space-x-2">
                  <span>JayaListing Admin</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                    PostgreSQL Suite
                  </span>
                </div>
                <div className="text-[9px] tracking-widest uppercase font-semibold text-rose-300">
                  Estate Database Controller
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {/* Live Database Status Indicator */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-rose-700/60 backdrop-blur-md">
              <Database className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-bold">
                {dbConnected ? "PostgreSQL Connected (grolow_db)" : "Connecting to PostgreSQL..."}
              </span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              <span>Live Website</span>
            </Link>

            <button
              onClick={handleAdminLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-rose-200 font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="End Administrator Session & Lock Controller"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              <span>{isLoggingOut ? "Logging Out..." : "Log Out"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        {/* Success / Alert Banner */}
        {actionMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2 shadow-lg animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Database Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-rose-900/20 shadow-sm text-center">
            <div className="text-[10px] uppercase font-bold text-gray-500">Total in PostgreSQL</div>
            <div className="text-2xl font-black text-rose-900 dark:text-rose-400 mt-1">
              {properties.length} Estates
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-blue-500/20 shadow-sm text-center">
            <div className="text-[10px] uppercase font-bold text-blue-600">1. Residential</div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {residentialCount}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-amber-500/20 shadow-sm text-center">
            <div className="text-[10px] uppercase font-bold text-amber-600">2. Commercial</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {commercialCount}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-purple-500/20 shadow-sm text-center">
            <div className="text-[10px] uppercase font-bold text-purple-600">3. Industrial</div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
              {industrialCount}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-emerald-500/20 shadow-sm text-center">
            <div className="text-[10px] uppercase font-bold text-emerald-600">4. Agricultural</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {agricultureCount}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-rose-900/20 shadow-sm text-center">
            <div className="text-[10px] uppercase font-bold text-gray-500">Portfolio Value</div>
            <div className="text-2xl font-black text-rose-900 dark:text-rose-400 mt-1">
              ₹344+ Cr
            </div>
          </div>
        </div>

        {/* Action Header: Search & Add Property */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-3xl border border-rose-900/20 shadow-sm">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-800" />
            <Input
              placeholder="Filter by title, city, or property type..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl border-gray-200 dark:border-gray-800"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={fetchProperties}
              variant="outline"
              size="sm"
              className="border-rose-900/30 text-rose-900 dark:text-rose-300 hover:bg-rose-50 rounded-xl text-xs font-bold h-9"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              onClick={handleResetDatabase}
              variant="outline"
              size="sm"
              className="border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-50 rounded-xl text-xs font-bold h-9"
              disabled={isResetting}
            >
              <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isResetting ? "animate-spin" : ""}`} />
              {isResetting ? "Restoring..." : "Restore Defaults"}
            </Button>



            <Link href="/add-listing">
              <Button
                className="bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 hover:from-rose-950 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/30 border border-amber-400/20 h-9 px-4"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                + Add New Listing
              </Button>
            </Link>
          </div>
        </div>

        {/* Top-Level Navigation Switcher */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-3 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setMainAdminTab("estates")}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 whitespace-nowrap flex-shrink-0 transition-all ${
              mainAdminTab === "estates"
                ? "bg-rose-900 text-white shadow-md shadow-rose-900/30"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-rose-50"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Estates Portfolio ({properties.length})</span>
          </button>

          <button
            onClick={() => {
              setMainAdminTab("vip_appointments")
              fetchVipBookings()
            }}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 whitespace-nowrap flex-shrink-0 transition-all ${
              mainAdminTab === "vip_appointments"
                ? "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-amber-50"
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>👑 VIP Appointments & Tours</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                mainAdminTab === "vip_appointments"
                  ? "bg-slate-950 text-amber-300"
                  : "bg-rose-900 text-white"
              }`}
            >
              {vipBookings.filter((b) => b.status === "pending").length > 0
                ? `${vipBookings.filter((b) => b.status === "pending").length} New`
                : vipBookings.length}
            </span>
          </button>

          <button
            onClick={() => setMainAdminTab("image_seo")}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 whitespace-nowrap flex-shrink-0 transition-all ${
              mainAdminTab === "image_seo"
                ? "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-amber-50"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>📸 Image SEO & AI Search</span>
          </button>

          <button
            onClick={() => setMainAdminTab("database_monitor")}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 whitespace-nowrap flex-shrink-0 transition-all ${
              mainAdminTab === "database_monitor"
                ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md shadow-emerald-600/20 font-black"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-emerald-50"
            }`}
          >
            <Database className="w-4 h-4 text-emerald-500" />
            <span>⚡ Database & Cost Monitor</span>
          </button>

          <button
            onClick={() => setMainAdminTab("crm")}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 whitespace-nowrap flex-shrink-0 transition-all ${
              mainAdminTab === "crm"
                ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20 font-black"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-indigo-50"
            }`}
          >
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <span>💼 Real Estate CRM</span>
          </button>
        </div>

        <AdminErrorBoundary key={mainAdminTab} fallbackTitle="Admin Section Encountered an Error">
        {mainAdminTab === "estates" ? (
          <>
            {/* Category Tabs: Strictly 1. Residential, 2. Commercial, 3. Industrial, 4. Agricultural */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setActiveTab("all")}
                className={`text-xs px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  activeTab === "all"
                    ? "bg-rose-900 text-white shadow-md shadow-rose-900/30"
                    : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-rose-50"
                }`}
              >
                <span>All Estates ({properties.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("residential")}
                className={`text-xs px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  activeTab === "residential"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>1. Residential ({residentialCount})</span>
              </button>

              <button
                onClick={() => setActiveTab("commercial")}
                className={`text-xs px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  activeTab === "commercial"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                    : "bg-white dark:bg-gray-900 text-amber-700 dark:text-amber-300 hover:bg-amber-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>2. Commercial ({commercialCount})</span>
              </button>

              <button
                onClick={() => setActiveTab("industrial")}
                className={`text-xs px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  activeTab === "industrial"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "bg-white dark:bg-gray-900 text-purple-700 dark:text-purple-300 hover:bg-purple-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>3. Industrial ({industrialCount})</span>
              </button>

              <button
                onClick={() => setActiveTab("agriculture")}
                className={`text-xs px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  activeTab === "agriculture"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "bg-white dark:bg-gray-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>4. Agricultural ({agricultureCount})</span>
              </button>
            </div>

        {/* PostgreSQL Listings Table / Card List */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-rose-900/20 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="font-black text-base sm:text-lg text-gray-900 dark:text-white">
                Active PostgreSQL Listings ({filtered.length})
              </h3>
              <p className="text-xs text-gray-500">
                Connected to `properties` table in PostgreSQL database `grolow_db`
              </p>
            </div>
            <div className="text-xs text-gray-400">
              Synced with PostgreSQL
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedListings.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-rose-50/20 dark:hover:bg-rose-950/10 transition-colors"
              >
                {/* Left: Thumbnail & Info */}
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="relative w-20 h-16 sm:w-24 sm:h-18 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 border border-gray-200 dark:border-gray-700">
                    <Image
                      src={(Array.isArray(item.images) && item.images[0]) || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80"}
                      alt={item.title || "Estate Listing"}
                      fill
                      loading="lazy"
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
                      <span className="text-[11px] font-mono text-gray-400 font-bold">
                        #{item.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadge(item.category)}`}>
                        {item.propertyType}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.visibility === "private"
                          ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                      }`}>
                        {item.visibility === "private" ? "🔒 Private VIP" : "🌐 Public"}
                      </span>
                      {item.featuredHome ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-amber-400 text-slate-950 border-amber-500 shadow-xs flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-slate-950" />
                          <span>Featured on Home</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-gray-300">
                          Priority #{item.displayOrder ?? 100}
                        </span>
                      )}
                    </div>

                    <h4 className="font-black text-sm sm:text-base text-gray-900 dark:text-white truncate">
                      {item.title}
                    </h4>

                    <div className="flex items-center text-xs text-gray-500 space-x-3 mt-0.5">
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 text-rose-800 mr-1" />
                        {item.location}
                      </span>
                      <span>•</span>
                      <span>{item.area}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Price & Admin Actions */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800 flex-wrap gap-y-2">
                  <div className="text-right mr-1">
                    <div className="text-base sm:text-lg font-black text-rose-900 dark:text-rose-400">
                      {item.price}
                    </div>
                    <div className="text-[10px] text-gray-400">{item.status}</div>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {/* Priority & Move Up/Down Controls */}
                    <div className="flex items-center space-x-0.5 border border-gray-200 dark:border-gray-700 rounded-xl p-0.5 bg-white dark:bg-gray-800 shadow-xs">
                      <button
                        type="button"
                        onClick={() => handleQuickReorder(item, Math.max(1, (item.displayOrder ?? 100) - 1))}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                        title="Move higher up in list (Priority -1)"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono font-bold px-1 text-gray-600 dark:text-gray-300" title="Current priority position">
                        #{item.displayOrder ?? 100}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickReorder(item, (item.displayOrder ?? 100) + 1)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                        title="Move lower down in list (Priority +1)"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Feature on Home Page Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleQuickReorder(item, item.featuredHome ? 100 : 1, !item.featuredHome)}
                      className={`h-9 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                        item.featuredHome
                          ? "bg-amber-400 text-slate-950 border-amber-500 hover:bg-amber-300 shadow-xs"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-amber-400 hover:text-amber-600"
                      }`}
                      title={item.featuredHome ? "Featured on Home (Click to unpin)" : "Pin to top of Home Page"}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.featuredHome ? "fill-slate-950" : ""}`} />
                      <span className="hidden lg:inline">{item.featuredHome ? "Featured" : "Pin Home"}</span>
                    </button>

                    {/* Quick Visibility Toggle */}
                    <Button
                      onClick={() => handleToggleTableVisibility(item)}
                      disabled={togglingVisibilityId === item.id}
                      size="sm"
                      variant="outline"
                      className={`text-xs font-bold h-9 px-2.5 rounded-xl border transition-all ${
                        item.visibility === "private"
                          ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300"
                          : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                      title={item.visibility === "private" ? "Click to make Public" : "Click to make Private VIP"}
                    >
                      {item.visibility === "private" ? (
                        <>
                          <Globe className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          <span>Make Public</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          <span>Make Private</span>
                        </>
                      )}
                    </Button>

                    {/* Share Modal Trigger */}
                    <Button
                      onClick={() => setSharingAdminProp(item)}
                      size="sm"
                      variant="outline"
                      className="border-amber-500/40 text-amber-900 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs font-bold h-9 px-2.5 rounded-xl shadow-xs"
                      title="Share Public or Private VIP Link"
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1 text-amber-600" />
                      <span>Share</span>
                    </Button>

                    <Link href={`/property/${item.id}${item.visibility === "private" ? "?access=private_vip" : ""}`} target="_blank">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-900/30 text-rose-900 dark:text-rose-300 hover:bg-rose-50 text-xs font-bold h-9 px-2.5 rounded-xl"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        View
                      </Button>
                    </Link>

                    {/* Customize Entire Listing Button */}
                    <Button
                      onClick={() => handleOpenEditProperty(item)}
                      size="sm"
                      variant="outline"
                      className="border-rose-900/40 text-rose-950 dark:text-rose-200 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 text-xs font-bold h-9 px-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 shadow-xs"
                      title="Customize all property fields in PostgreSQL"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1 text-rose-800 dark:text-rose-400" />
                      Customize
                    </Button>

                    {/* Customize Amenities Button */}
                    <Button
                      onClick={() => handleOpenEditAmenities(item)}
                      size="sm"
                      variant="outline"
                      className={`text-xs font-bold h-9 px-3 rounded-xl border transition-all ${
                        editingAmenitiesId === item.id
                          ? "bg-rose-900 text-white border-rose-900 shadow-md"
                          : "border-amber-400/50 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                      Amenities ({((item.amenities && item.amenities.length > 0) ? item.amenities : (item.highlights || [])).length})
                    </Button>

                    {confirmDeleteId === item.id ? (
                      <div className="flex items-center space-x-1 animate-in fade-in duration-200">
                        <Button
                          onClick={() => executeDelete(item.id, item.title)}
                          disabled={isDeletingId === item.id}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold h-9 px-3 rounded-xl shadow-md shadow-red-600/30"
                        >
                          {isDeletingId === item.id ? "Deleting..." : "Confirm Delete"}
                        </Button>
                        <Button
                          onClick={() => setConfirmDeleteId(null)}
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-gray-600 text-xs h-9 px-2 rounded-xl"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setConfirmDeleteId(item.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 text-xs font-bold h-9 px-3 rounded-xl transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                {/* Inline Custom Amenities Editor for this Listing */}
                {editingAmenitiesId === item.id && (
                  <div className="mt-4 pt-4 border-t border-rose-900/20 bg-rose-50/40 dark:bg-rose-950/20 p-4 rounded-2xl animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <h5 className="font-bold text-xs text-rose-950 dark:text-rose-200 flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Customize Amenities for "{item.title}"</span>
                        </h5>
                        <p className="text-[11px] text-gray-500">
                          Add, customize, or remove luxury features. Saves directly to PostgreSQL.
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => setEditingAmenitiesId(null)}
                          size="sm"
                          variant="ghost"
                          className="text-xs h-8 text-gray-500"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleSaveAmenitiesToPostgres(item.id, item.title)}
                          disabled={isSavingAmenities}
                          size="sm"
                          className="bg-rose-900 hover:bg-rose-950 text-white text-xs font-bold h-8 px-4 rounded-xl shadow-md"
                        >
                          {isSavingAmenities ? "Saving..." : "Save Amenities to PostgreSQL"}
                        </Button>
                      </div>
                    </div>

                    {/* Add Custom Amenity Input */}
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Type custom amenity name..."
                        value={editAmenityInput}
                        onChange={(e) => setEditAmenityInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddEditAmenity()
                          }
                        }}
                        className="flex-1 h-9 px-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium focus:ring-1 focus:ring-rose-800"
                      />
                      <Button
                        type="button"
                        onClick={() => handleAddEditAmenity()}
                        size="sm"
                        className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-950 text-white rounded-xl text-xs font-bold h-9 px-3"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add
                      </Button>
                    </div>

                    {/* Quick Add Presets */}
                    <div className="mb-3">
                      <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                        QUICK SUGGESTIONS FOR {item.category.toUpperCase()}:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(AMENITY_SUGGESTIONS[item.category] || []).map((sug, i) => {
                          const isAlready = currentEditAmenities.includes(sug)
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleAddEditAmenity(sug)}
                              disabled={isAlready}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all ${
                                isAlready
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 opacity-60"
                                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-rose-50 border-gray-200"
                              }`}
                            >
                              {isAlready ? "✓ " : "+ "}{sug}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Active Amenities Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {currentEditAmenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center space-x-1.5 bg-white dark:bg-gray-800 border border-rose-900/30 text-rose-950 dark:text-rose-200 px-2.5 py-1 rounded-xl text-xs font-bold shadow-xs"
                        >
                          <CheckCircle2 className="w-3 h-3 text-rose-800 dark:text-rose-400" />
                          <span>{amenity}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEditAmenity(idx)}
                            className="w-4 h-4 rounded-full hover:bg-red-100 text-red-600 flex items-center justify-center ml-1"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filtered.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500 text-xs">
                No properties found in this category or search filter.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3 text-xs bg-gray-50/50 dark:bg-gray-800/30">
              <span className="text-gray-500 font-medium">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} estates
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 rounded-lg text-xs font-semibold"
                >
                  Previous
                </Button>
                <span className="px-2 font-bold text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-3 rounded-lg text-xs font-semibold"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </>
    ) : mainAdminTab === "vip_appointments" ? (
      <div className="space-y-4 sm:space-y-6">
        {/* VIP Appointments Header Card */}
        <div className="bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 rounded-3xl p-5 sm:p-7 text-white border border-rose-900/30 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold uppercase tracking-widest mb-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Private Client Office • Direct Booking Stream</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Royal VIP Tour Appointments ({vipBookings.length})
              </h3>
              <p className="text-xs sm:text-sm text-rose-200 mt-1 max-w-2xl leading-relaxed">
                All client viewing appointments are synchronized in PostgreSQL and dispatched instantly to <strong>jayalisting@gmail.com</strong> with direct WhatsApp and Call action buttons.
              </p>
            </div>
            <Button
              onClick={fetchVipBookings}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-xs font-bold self-start sm:self-auto h-10 px-4"
              disabled={loadingBookings}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingBookings ? "animate-spin" : ""}`} />
              Refresh Appointments
            </Button>
          </div>
        </div>

        {/* Bookings List */}
        {vipBookings.length === 0 && !loadingBookings ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-rose-900/15 shadow-sm space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-base text-gray-900 dark:text-white">
              No VIP Appointments Booked Yet
            </h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              When a client schedules an in-person or virtual viewing from any property detail page, their booking record will appear here and trigger an email to <strong>jayalisting@gmail.com</strong>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {vipBookings.map((b) => {
              const waDigits = String(b.client_phone || "").replace(/\D/g, "")
              const waPhone = waDigits.length === 10 ? `91${waDigits}` : waDigits
              const isVirtual = b.tour_type === "virtual"

              return (
                <div
                  key={b.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-rose-900/15 dark:border-rose-900/30 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-900/10 text-rose-900 dark:text-rose-300 flex items-center justify-center font-black text-sm">
                        #{b.id}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-black text-base text-gray-900 dark:text-white">
                            {b.client_name}
                          </h4>
                          <Badge
                            className={
                              b.status === "confirmed"
                                ? "bg-emerald-500 text-white font-bold text-[10px]"
                                : b.status === "completed"
                                ? "bg-blue-600 text-white font-bold text-[10px]"
                                : b.status === "cancelled"
                                ? "bg-gray-400 text-white font-bold text-[10px]"
                                : "bg-amber-400 text-slate-950 font-black text-[10px]"
                            }
                          >
                            {b.status ? b.status.toUpperCase() : "PENDING"}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Booked on {new Date(b.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
                        </div>
                      </div>
                    </div>

                    {/* Status Switcher Buttons */}
                    <div className="flex items-center space-x-1.5 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleUpdateBookingStatus(b.id, "confirmed")}
                        disabled={updatingBookingId === b.id || b.status === "confirmed"}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 disabled:opacity-40"
                        title="Mark appointment confirmed"
                      >
                        ✓ Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateBookingStatus(b.id, "completed")}
                        disabled={updatingBookingId === b.id || b.status === "completed"}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300 disabled:opacity-40"
                        title="Mark tour completed"
                      >
                        Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateBookingStatus(b.id, "cancelled")}
                        disabled={updatingBookingId === b.id || b.status === "cancelled"}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300 disabled:opacity-40"
                        title="Cancel appointment"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBooking(b.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                        title="Delete record from database"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Booking Content Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Target Estate Info */}
                    <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-900/10 space-y-1.5">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-rose-900 dark:text-rose-400">
                        Requested Estate (ID #{b.property_id})
                      </div>
                      <div className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                        {b.property_title}
                      </div>
                      <div className="text-rose-900 dark:text-amber-400 font-extrabold text-xs">
                        {b.property_price || "Price on Request"}
                      </div>
                      {b.property_location && (
                        <div className="text-gray-500 text-[11px] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-900" />
                          <span>{b.property_location}</span>
                        </div>
                      )}
                      <div className="pt-1">
                        <Link
                          href={`/property/${b.property_id}`}
                          target="_blank"
                          className="text-[11px] font-bold text-rose-900 dark:text-rose-300 hover:underline inline-flex items-center gap-1"
                        >
                          <span>View Estate Page</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Schedule & Contact Details */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                          Schedule Preference
                        </span>
                        <Badge className="bg-rose-950 text-amber-300 font-bold text-[10px]">
                          {isVirtual ? "Virtual 4K Video Tour" : "In-Person VIP Tour"}
                        </Badge>
                      </div>

                      <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-rose-900" />
                        <span>📅 {b.tour_date} at ⏰ {b.tour_time}</span>
                      </div>

                      {/* Client Contact Links */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200 dark:border-gray-700">
                        <a
                          href={`https://wa.me/${waPhone}?text=Hello%20${encodeURIComponent(b.client_name || "")},%20this%20is%20the%20Private%20Client%20Office%20at%20JayaListing%20regarding%20your%20VIP%20viewing%20request%20for%20${encodeURIComponent(b.property_title || "")}.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-[11px] transition-colors shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={`tel:${String(b.client_phone || "").replace(/\s+/g, "")}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:bg-gray-100 text-gray-900 dark:text-white font-bold text-[11px] transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-rose-900" />
                          <span>{b.client_phone || "No Phone"}</span>
                        </a>

                        <a
                          href={`mailto:${b.client_email || ""}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:bg-gray-100 text-gray-900 dark:text-white font-bold text-[11px] transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-rose-900" />
                          <span>{b.client_email || "No Email"}</span>
                        </a>
                      </div>

                      {b.notes && (
                        <div className="pt-1.5 text-[11px] text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-800">
                          <strong className="text-gray-900 dark:text-white">Client Notes:</strong> {b.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    ) : mainAdminTab === "image_seo" ? (
      <AdminErrorBoundary fallbackTitle="Image SEO Manager encountered an error">
        <AdminImageSeoManager />
      </AdminErrorBoundary>
    ) : mainAdminTab === "database_monitor" ? (
      <AdminErrorBoundary fallbackTitle="Database Monitor encountered an error">
        <AdminDatabaseMonitor />
      </AdminErrorBoundary>
    ) : mainAdminTab === "crm" ? (
      <AdminErrorBoundary fallbackTitle="Real Estate CRM encountered an error" onReset={() => setMainAdminTab("estates")}>
        <CrmWorkspace />
      </AdminErrorBoundary>
    ) : null}
        </AdminErrorBoundary>
      </main>

      {/* Full Property Customizer Modal (Make ALL fields customizable) */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-gray-900 border border-rose-900/40 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-rose-950/90 via-red-900/90 to-rose-950/90 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-200 font-bold flex-shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                      Property #{editingProperty.id} Customizer
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20 uppercase">
                      {editPropertyForm.category}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black truncate text-white">
                    {editPropertyForm.title || "Untitled Property"}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setEditingProperty(null)}
                className="w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors flex-shrink-0"
                aria-label="Close customizer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
              {/* 0. Visibility & Confidentiality (Public vs Private VIP Share Only) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border-2 border-amber-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-white text-xs font-bold flex items-center justify-center">
                      ★
                    </div>
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-amber-950 dark:text-amber-200">
                      Listing Visibility & Access Permissions
                    </h4>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    editPropertyForm.visibility === "private"
                      ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200"
                      : "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200"
                  }`}>
                    {editPropertyForm.visibility === "private" ? "🔒 Private VIP Share Only" : "🌐 Public Directory"}
                  </span>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Control whether this asset is listed publicly on the website or kept strictly confidential for direct private sharing.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditPropertyForm({ ...editPropertyForm, visibility: "public" })}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                      editPropertyForm.visibility === "public"
                        ? "border-rose-900 bg-rose-50/70 dark:bg-rose-950/40 shadow-xs ring-1 ring-rose-900/30"
                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:border-gray-300"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${editPropertyForm.visibility === "public" ? "bg-rose-900 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}>
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-gray-900 dark:text-white block">
                        🌐 Public Listing (Standard)
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5 leading-snug">
                        Visible to all visitors across homepage, category pages, and search filters.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditPropertyForm({ ...editPropertyForm, visibility: "private" })}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                      editPropertyForm.visibility === "private"
                        ? "border-amber-600 bg-amber-50 dark:bg-amber-950/40 shadow-xs ring-1 ring-amber-600/40"
                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:border-gray-300"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${editPropertyForm.visibility === "private" ? "bg-amber-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}>
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-gray-900 dark:text-white block">
                        🔒 Private VIP Share Only (Off-Market)
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5 leading-snug">
                        <strong>Hidden from public site & searches.</strong> Only clients you share the private VIP link with can open it.
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Home Page Placement & Display Ordering */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-900/10 to-amber-500/10 border-2 border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-rose-950 dark:text-rose-200">
                      Home Page Placement & Display Priority
                    </h4>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 rounded-full">
                    List Position Control
                  </span>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Control where this estate appears on the Home Page and category pages. Lower priority numbers appear first (Priority 1 = Top of list).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Feature on Home Page Toggle */}
                  <div
                    onClick={() => setEditPropertyForm({ ...editPropertyForm, featuredHome: !editPropertyForm.featuredHome })}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      editPropertyForm.featuredHome
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 shadow-xs ring-1 ring-amber-500/30"
                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:border-gray-300"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${editPropertyForm.featuredHome ? "bg-amber-500 text-slate-950" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}>
                      <Star className={`w-5 h-5 ${editPropertyForm.featuredHome ? "fill-slate-950" : ""}`} />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-gray-900 dark:text-white block">
                        ⭐ Feature on Home Page (Pin to Top)
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5 leading-snug">
                        {editPropertyForm.featuredHome
                          ? "Active: Asset is pinned to the top of the Home Page portfolio."
                          : "Inactive: Follows regular priority order."}
                      </span>
                    </div>
                  </div>

                  {/* Priority Number Input */}
                  <div className="p-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                      Display Priority Number (Order)
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min={1}
                        max={9999}
                        value={editPropertyForm.displayOrder}
                        onChange={(e) => setEditPropertyForm({ ...editPropertyForm, displayOrder: Number(e.target.value) || 1 })}
                        className="h-10 text-xs rounded-xl font-bold font-mono"
                        placeholder="1, 2, 3..."
                      />
                      <span className="text-[11px] text-gray-500 whitespace-nowrap">
                        (1 = Top, 2 = 2nd...)
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Set 1 to display first, 2 to display second, etc.
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. Identity & Classification */}
              <div>
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-rose-900 dark:text-rose-400 mb-3 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  <span>1. Identity & Classification</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Title</label>
                    <Input
                      value={editPropertyForm.title}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, title: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="e.g. The Imperial Sky Penthouse"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Category (Niche)</label>
                    <select
                      value={editPropertyForm.category}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, category: e.target.value as any })}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-xs font-bold text-gray-900 dark:text-white"
                    >
                      <option value="residential">1. Residential</option>
                      <option value="commercial">2. Commercial</option>
                      <option value="industrial">3. Industrial</option>
                      <option value="agriculture">4. Agricultural</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Tagline / Key Hook</label>
                    <Input
                      value={editPropertyForm.tagline}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, tagline: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="e.g. Unrivaled 360° Arabian Sea panoramic views with private elevator"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Property Sub-Type</label>
                    <Input
                      value={editPropertyForm.propertyType}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, propertyType: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="e.g. Duplex Sky Villa, 45 Cents Land, PEB Shed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Purpose</label>
                    <select
                      value={editPropertyForm.purpose}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, purpose: e.target.value as any })}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-xs font-bold text-gray-900 dark:text-white"
                    >
                      <option value="sale">For Sale (Direct Purchase)</option>
                      <option value="lease">For Lease (Commercial/Industrial)</option>
                      <option value="rent">For Rent (Monthly)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Listing Status Badge</label>
                    <select
                      value={editPropertyForm.status}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, status: e.target.value as any })}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-xs font-bold text-gray-900 dark:text-white"
                    >
                      <option value="For Sale">For Sale</option>
                      <option value="For Lease">For Lease</option>
                      <option value="Private Treaty">Private Treaty</option>
                      <option value="Under Offer">Under Offer</option>
                      <option value="Sold">Sold</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Key Architectural & Estate Specifications */}
              <div>
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-rose-900 dark:text-rose-400 mb-3 flex items-center gap-1.5">
                  <Square className="w-3.5 h-3.5" />
                  <span>2. Key Architectural & Estate Specifications</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Price Display</label>
                    <Input
                      value={editPropertyForm.price}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, price: e.target.value })}
                      className="h-10 text-xs rounded-xl font-bold text-rose-900 dark:text-rose-400"
                      placeholder="e.g. ₹35.0 Cr or Price on Request"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Super Built-Up Area / Acreage</label>
                    <Input
                      value={editPropertyForm.area}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, area: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="e.g. 6,500 sq ft or 45 Cents"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Carpet / Usable Area</label>
                    <Input
                      value={editPropertyForm.carpetArea}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, carpetArea: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="e.g. 5,200 sq ft"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Suites / Cabins / Bedrooms</label>
                    <Input
                      type="number"
                      value={editPropertyForm.bedrooms}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, bedrooms: parseInt(e.target.value) || 0 })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="5"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Baths / Washrooms</label>
                    <Input
                      type="number"
                      value={editPropertyForm.bathrooms}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, bathrooms: parseInt(e.target.value) || 0 })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="6"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Dedicated Parking Bays</label>
                    <Input
                      value={editPropertyForm.parking}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, parking: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="e.g. 4 Covered Bays / 12 Trailer Bays"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Orientation & Vista (Facing)</label>
                    <Input
                      value={editPropertyForm.facing}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, facing: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="e.g. Sea-Facing (West), East"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Elevation / Tier / Floor</label>
                    <Input
                      value={editPropertyForm.floor}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, floor: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="e.g. Duplex Penthouse, G+2 Villa"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Handover Status & Age</label>
                    <Input
                      value={editPropertyForm.age}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, age: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="e.g. Ready to Move, Immediate"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Power Infrastructure</label>
                    <Input
                      value={editPropertyForm.powerBackup}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, powerBackup: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="e.g. 100% Dual DG Backup, Substation"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Water Network & Supply</label>
                    <Input
                      value={editPropertyForm.waterSupply}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, waterSupply: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="e.g. 24/7 Treated Supply, 4x Borewells"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Estate Security</label>
                    <Input
                      value={editPropertyForm.estateSecurity}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, estateSecurity: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="e.g. Biometric 24/7, Armed Guard"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Geographic Location */}
              <div>
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-rose-900 dark:text-rose-400 mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>3. Geographic Location</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Location / Landmark / Locality</label>
                    <Input
                      value={editPropertyForm.location}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, location: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="Worli Sea Face, Mumbai"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">City (e.g. Mangaluru, Udupi, Mumbai)</label>
                    <Input
                      value={editPropertyForm.city}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, city: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="Mumbai"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">State</label>
                    <Input
                      value={editPropertyForm.state}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, state: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="Karnataka / Maharashtra"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Assigned Luxury Representative */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-gray-800/50 border border-stone-200 dark:border-gray-800 space-y-3">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-rose-900 dark:text-rose-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>4. Assigned Luxury Representative (Direct Contact)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Representative Name</label>
                    <Input
                      value={editPropertyForm.sellerName}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, sellerName: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="Rohit Singhania"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Official Phone / WhatsApp</label>
                    <Input
                      value={editPropertyForm.sellerPhone}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, sellerPhone: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="+91 82965 30609"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Official Title</label>
                    <Input
                      value={editPropertyForm.sellerTitle}
                      onChange={(e) => setEditPropertyForm({ ...editPropertyForm, sellerTitle: e.target.value })}
                      className="h-10 text-xs rounded-xl"
                      placeholder="Senior VP, Jaya Royal Portfolio"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Media & Imagery */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800">
                <ImageUploadManager
                  images={editPropertyForm.images}
                  onChange={(imgs) => setEditPropertyForm({ ...editPropertyForm, images: imgs })}
                  label="4. Property Imagery & Gallery (WebP & Image SEO)"
                  helperText="First photo is the primary cover photo. Click 'SEO' on any thumbnail to configure Alt text, AI descriptions, or rename."
                  propertyContext={{
                    title: editPropertyForm.title,
                    location: editPropertyForm.location,
                    category: editPropertyForm.category,
                    price: editPropertyForm.price,
                  }}
                />
              </div>

              {/* 5. Description */}
              <div>
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-rose-900 dark:text-rose-400 mb-3 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>5. Private Treaty Narrative / Description</span>
                </h4>
                <Textarea
                  value={editPropertyForm.description}
                  onChange={(e) => setEditPropertyForm({ ...editPropertyForm, description: e.target.value })}
                  rows={3}
                  className="text-xs rounded-xl resize-none"
                  placeholder="Architectural dossier description for ultra high-net-worth buyers..."
                />
              </div>

              {/* 6. Signature Customized Amenities Manager */}
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-900/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>6. Signature Customized Amenities ({editPropertyForm.amenities.length})</span>
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      These amenities display directly on user listing cards and the bespoke dossier section.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Input
                      value={editPropAmenityInput}
                      onChange={(e) => setEditPropAmenityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddEditPropAmenity()
                        }
                      }}
                      placeholder="Add custom amenity..."
                      className="h-8 text-xs w-48 rounded-lg bg-white dark:bg-gray-900"
                    />
                    <Button
                      type="button"
                      onClick={() => handleAddEditPropAmenity()}
                      size="sm"
                      className="h-8 px-3 text-xs bg-rose-900 text-white rounded-lg hover:bg-rose-950"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                {/* Suggestions Pills */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400 mb-1.5">
                    Click to quick-add signature suggestions:
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {(AMENITY_SUGGESTIONS[editPropertyForm.category] || AMENITY_SUGGESTIONS.residential).map((sug, i) => {
                      const isAlready = editPropertyForm.amenities.includes(sug)
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            if (isAlready) {
                              setEditPropertyForm((prev) => ({
                                ...prev,
                                amenities: prev.amenities.filter((a) => a !== sug),
                              }))
                            } else {
                              handleAddEditPropAmenity(sug)
                            }
                          }}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all border ${
                            isAlready
                              ? "bg-rose-900 text-white border-rose-900 shadow-xs"
                              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-rose-900"
                          }`}
                        >
                          {isAlready ? "✓ " : "+ "}{sug}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Active Amenities Chips */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-rose-900/10">
                  {editPropertyForm.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1.5 bg-white dark:bg-gray-800 border border-rose-900/30 text-rose-950 dark:text-rose-200 px-2.5 py-1 rounded-xl text-xs font-bold shadow-xs"
                    >
                      <CheckCircle2 className="w-3 h-3 text-rose-800 dark:text-rose-400" />
                      <span>{amenity}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEditPropAmenity(idx)}
                        className="w-4 h-4 rounded-full hover:bg-red-100 text-red-600 flex items-center justify-center ml-1"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Custom FAQs Section */}
              <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-300/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200/50 dark:border-amber-900/40">
                  <div>
                    <div className="flex items-center space-x-2">
                      <HelpCircle className="w-4 h-4 text-rose-900 dark:text-amber-400" />
                      <h4 className="text-xs uppercase font-extrabold tracking-wider text-rose-950 dark:text-rose-200">
                        Custom Frequently Asked Questions (FAQs)
                      </h4>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Rendered below the Exclusive Portfolio section. Leave empty to use auto-generated verified answers.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePrepopulateAdminFaqs}
                    className="text-xs h-8 border-rose-900/30 text-rose-900 dark:text-rose-300 hover:bg-rose-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                    Pre-populate Suggested
                  </Button>
                </div>

                {/* List of FAQs */}
                {editPropertyForm.customFaqs.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {editPropertyForm.customFaqs.map((faq, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-rose-900 dark:text-amber-400">
                            FAQ #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAdminFaq(idx)}
                            className="text-gray-400 hover:text-red-600 text-xs p-0.5"
                            title="Delete Question"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => handleUpdateAdminFaq(idx, "question", e.target.value)}
                          placeholder="Question..."
                          className="w-full p-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                        <textarea
                          rows={2}
                          value={faq.answer}
                          onChange={(e) => handleUpdateAdminFaq(idx, "answer", e.target.value)}
                          placeholder="Answer..."
                          className="w-full p-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New FAQ */}
                <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-900/50 space-y-2">
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Plus className="w-3 h-3 text-rose-900" /> Add Custom Question
                  </span>
                  <input
                    type="text"
                    value={newAdminFaqQuestion}
                    onChange={(e) => setNewAdminFaqQuestion(e.target.value)}
                    placeholder="e.g. Is clear title verified?"
                    className="w-full p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                  <textarea
                    rows={2}
                    value={newAdminFaqAnswer}
                    onChange={(e) => setNewAdminFaqAnswer(e.target.value)}
                    placeholder="e.g. Yes, 100% verified freehold title."
                    className="w-full p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddAdminFaq}
                    disabled={!newAdminFaqQuestion.trim() || !newAdminFaqAnswer.trim()}
                    className="h-8 text-xs bg-rose-900 hover:bg-rose-950 text-white"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add FAQ
                  </Button>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/80 flex items-center justify-between">
              <div className="text-xs text-gray-500 hidden sm:block">
                All changes commit directly to PostgreSQL `grolow_db.properties`
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  variant="outline"
                  className="h-10 text-xs px-4 rounded-xl border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveFullProperty}
                  disabled={isSavingFullProperty}
                  className="h-10 text-xs px-5 rounded-xl bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 hover:from-rose-950 hover:to-red-950 text-white font-bold shadow-md shadow-rose-900/30 border border-amber-400/20"
                >
                  {isSavingFullProperty ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Saving to PostgreSQL...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 mr-2" />
                      Save All Changes to PostgreSQL
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Share Modal Trigger */}
      {sharingAdminProp && (
        <PropertyShareModal
          property={sharingAdminProp}
          isOpen={!!sharingAdminProp}
          onClose={() => setSharingAdminProp(null)}
          isAdmin={true}
        />
      )}

      <Footer />
    </div>
  )
}
