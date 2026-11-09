"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2,
  Wheat,
  Factory,
  Home,
  Sparkles,
  Check,
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  MapPin,
  DollarSign,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  FileText,
  Bed,
  Bath,
  Square,
  Car,
  Compass,
  Calendar,
  Zap,
  Droplets,
  Shield,
  RotateCcw,
  Ban,
  Lock,
  Globe,
  KeyRound,
  Share2,
  LogOut,
  Eye,
  EyeOff,
  Star,
  ArrowUpDown,
} from "lucide-react"

import PropertyHeader from "@/components/property-header"
import Footer from "@/components/footer"
import ImageUploadManager from "@/components/image-upload-manager"
import PropertyShareModal from "@/components/property-share-modal"
import { LuxuryProperty } from "@/lib/luxury-properties"
import { formatIndianCurrency, convertArea, AreaUnit, AREA_UNIT_LABELS } from "@/lib/indian-units"

const CATEGORIES = [
  { id: "residential", label: "1. Residential", icon: Home, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "commercial", label: "2. Commercial", icon: Building2, color: "text-amber-700 bg-amber-50 border-amber-200" },
  { id: "industrial", label: "3. Industrial", icon: Factory, color: "text-purple-700 bg-purple-50 border-purple-200" },
  { id: "agriculture", label: "4. Agricultural", icon: Wheat, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
]

const SUB_TYPES_BY_CATEGORY: Record<string, string[]> = {
  residential: ["Villa", "Individual House", "Penthouse", "Luxury Apartment", "Residential Plot"],
  commercial: ["Commercial Land / Plot", "Retail Showroom / Shop", "Hotel / Resort / Banquet", "Office Building"],
  industrial: ["Industrial Land / Plot", "Factory / Manufacturing Unit", "Logistics Warehouse", "Cold Storage"],
  agriculture: ["Arecanut / Coconut Plantation", "Agricultural Land / Plot", "Luxury Farm House", "Estate Land"],
}

// Niche-specific configuration for Key Architectural & Estate Specifications
interface NicheConfig {
  nicheTitle: string
  badgeColor: string
  suitesLabel: string
  suitesSublabel: string
  suitesPresets: string[]
  bathsLabel: string
  bathsSublabel: string
  bathsPresets: string[]
  areaLabel: string
  areaSublabel: string
  areaPresets: string[]
  carpetLabel: string
  carpetSublabel: string
  parkingLabel: string
  parkingSublabel: string
  parkingPresets: string[]
  orientationLabel: string
  orientationSublabel: string
  orientationPresets: string[]
  handoverLabel: string
  handoverSublabel: string
  handoverPresets: string[]
  powerLabel: string
  powerSublabel: string
  powerPresets: string[]
  waterLabel: string
  waterSublabel: string
  waterPresets: string[]
  securityLabel: string
  securitySublabel: string
  securityPresets: string[]
  elevationLabel: string
  elevationSublabel: string
  elevationPresets: string[]
  elevationDefault: string
}

const NICHE_SPEC_CONFIG: Record<string, NicheConfig> = {
  residential: {
    nicheTitle: "Residential Estate Niche",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
    suitesLabel: "Suites / Master Bedrooms",
    suitesSublabel: "Master Bedrooms",
    suitesPresets: ["3 Suites", "4 Suites", "5 Suites", "6 Suites", "8 Suites"],
    bathsLabel: "Baths / Spa En-Suites",
    bathsSublabel: "Spa En-Suites",
    bathsPresets: ["3 Baths", "4 Baths", "5 Baths", "6 Baths", "8 Baths"],
    areaLabel: "Super Built-Up Area *",
    areaSublabel: "Super Built-Up Area",
    areaPresets: ["6,500 sq ft", "45 Cents (Mangaluru / Udupi)", "12,000 sq ft", "85,000 sq ft"],
    carpetLabel: "RERA Carpet Area",
    carpetSublabel: "RERA Carpet Area",
    parkingLabel: "Private Parking / Bays *",
    parkingSublabel: "Private Parking",
    parkingPresets: ["4 Covered Bays", "Dedicated Parking Bays", "6 Covered Bays", "VIP Valet Bay"],
    orientationLabel: "Orientation & Vista",
    orientationSublabel: "Orientation & Vista",
    orientationPresets: ["East", "North-East", "Sea-Facing (West)", "Hill View", "North"],
    handoverLabel: "Handover Status *",
    handoverSublabel: "Handover Status",
    handoverPresets: ["Ready to Move", "Immediate Possession", "Under Construction", "New Launch"],
    powerLabel: "Power Infrastructure *",
    powerSublabel: "Power Infrastructure",
    powerPresets: ["100% Dual DG Backup", "100% Dual Backup", "Sanctioned 3-Phase", "Solar 500kW"],
    waterLabel: "Water Network *",
    waterSublabel: "Water Network",
    waterPresets: ["24/7 Treated Supply", "Treated 24/7", "Borewell & Corporation", "Micro-Drip Network"],
    securityLabel: "Estate Security *",
    securitySublabel: "Estate Security",
    securityPresets: ["Biometric 24/7", "Armed Guard & CCTV", "Gated Security", "Smart Turnstiles"],
    elevationLabel: "Elevation / Tier",
    elevationSublabel: "Elevation / Tier",
    elevationPresets: [
      "Duplex Penthouse (Top Tier)",
      "Triplex Sky Villa (Lvl 38-40)",
      "G+2 Independent Villa",
      "Private Ground Manor",
      "Mid-Rise Floor 14",
    ],
    elevationDefault: "Duplex Penthouse (Top Tier)",
  },
  commercial: {
    nicheTitle: "Commercial Trophy Niche",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    suitesLabel: "Executive Cabins / Boardrooms",
    suitesSublabel: "Executive Cabins",
    suitesPresets: ["4 Executive Cabins", "8 Cabins + Boardroom", "12 Executive Cabins", "Full Floor Open Layout"],
    bathsLabel: "Commercial Restrooms / Facilities",
    bathsSublabel: "Restrooms & Washrooms",
    bathsPresets: ["4 Restrooms", "6 Restrooms", "Executive + Multi-Stall", "8 Restrooms"],
    areaLabel: "Super Built-Up / Floor Plate Area *",
    areaSublabel: "Super Built-Up Area",
    areaPresets: ["15,000 sq ft", "25,000 sq ft", "50,000 sq ft", "45 Cents (Mangaluru / Udupi)"],
    carpetLabel: "Carpet / Usable Area",
    carpetSublabel: "Leasable Carpet Area",
    parkingLabel: "Dedicated Parking Bays / Valet *",
    parkingSublabel: "Private Parking",
    parkingPresets: ["Dedicated Parking Bays", "25 Reserved Bays", "50 Basement Bays", "VIP Valet Bay"],
    orientationLabel: "Main Frontage & Vista",
    orientationSublabel: "Orientation & Vista",
    orientationPresets: ["East", "Highway Frontage", "Main Arterial Road", "North-East"],
    handoverLabel: "Handover / Fit-Out Condition *",
    handoverSublabel: "Handover Status",
    handoverPresets: ["Ready to Move", "Warm Shell Ready", "Fully Furnished Grade-A", "Bare Shell"],
    powerLabel: "Power Infrastructure *",
    powerSublabel: "Power Infrastructure",
    powerPresets: ["100% Dual DG Backup", "Dedicated 1 MVA Substation", "Triple Redundant Feeder", "100% Dual Backup"],
    waterLabel: "Water Network *",
    waterSublabel: "Water Network",
    waterPresets: ["24/7 Treated Supply", "Treated 24/7", "Dual Source Corporation & RO", "Borewell & Corporation"],
    securityLabel: "Turnstiles & Commercial Security *",
    securitySublabel: "Estate Security",
    securityPresets: ["Biometric 24/7", "Biometric Turnstiles & 24/7 CCTV", "RFID Keycard Access", "Smart Turnstiles"],
    elevationLabel: "Elevation / Floor Plate",
    elevationSublabel: "Elevation / Floor Plate",
    elevationPresets: [
      "Full Floor Plate (High-Rise)",
      "Double-Height Ground Retail",
      "Level 14-16 Executive Tier",
      "Penthouse Boardroom Suite",
      "Showroom + Mezzanine",
    ],
    elevationDefault: "Full Floor Plate (High-Rise)",
  },
  industrial: {
    nicheTitle: "Industrial Logistics Niche",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
    suitesLabel: "Admin / Supervisory Cabins",
    suitesSublabel: "Admin Office Suites",
    suitesPresets: ["2 Admin Cabins", "4 Supervisory Cabins", "Mezzanine Office Suite", "6 Cabins + Conference"],
    bathsLabel: "Restrooms & Staff Facilities",
    bathsSublabel: "Staff & Driver Facilities",
    bathsPresets: ["4 Restrooms", "8 Washrooms", "Driver Rest Block", "Multi-Unit Restrooms"],
    areaLabel: "Total Built-Up / Shed Area *",
    areaSublabel: "Super Built-Up Area",
    areaPresets: ["45,000 sq ft", "65,000 sq ft", "85,000 sq ft", "140,000 sq ft"],
    carpetLabel: "Clear Warehouse Usable Area",
    carpetSublabel: "Shed Floor Area",
    parkingLabel: "Dedicated Trailer / Dock Bays *",
    parkingSublabel: "Private Parking",
    parkingPresets: ["12 Dedicated Trailer Bays", "16 Hydraulic Dock Bays", "Trailer Parking Yard", "Dedicated Parking Bays"],
    orientationLabel: "Entry Corridor & Orientation",
    orientationSublabel: "Orientation & Vista",
    orientationPresets: ["East", "Direct Highway Access", "Expressway Corridor", "North-East"],
    handoverLabel: "Handover Status *",
    handoverSublabel: "Handover Status",
    handoverPresets: ["Ready to Move", "Immediate Possession", "Fit-Out Stage", "Under Construction"],
    powerLabel: "Power Infrastructure *",
    powerSublabel: "Power Infrastructure",
    powerPresets: ["100% Dual DG Backup", "2 MVA Dedicated Substation", "HT Industrial Feeder", "Solar 500kW"],
    waterLabel: "Water Network & Fire Ring *",
    waterSublabel: "Water Network",
    waterPresets: ["24/7 Treated Supply", "Treated 24/7", "High-Flow Borewell & Hydrant Ring", "Micro-Drip Network"],
    securityLabel: "Industrial Security & Perimeter *",
    securitySublabel: "Estate Security",
    securityPresets: ["Biometric 24/7", "Armed Guard & CCTV", "Biometric 24/7 & Perimeter Guard", "Smart Turnstiles"],
    elevationLabel: "Clear Eaves Height / Structure Type",
    elevationSublabel: "Clear Eaves Height",
    elevationPresets: [
      "14m Clear Eaves Height (PEB)",
      "12m Heavy Industrial Shed",
      "Single-Level High-Bay PEB",
      "Heavy Ground + Mezzanine",
      "FM2 Laser Leveled Tier",
    ],
    elevationDefault: "14m Clear Eaves Height (PEB)",
  },
  agriculture: {
    nicheTitle: "Agricultural & Farm Estate Niche",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    suitesLabel: "Farmhouse Manor Suites",
    suitesSublabel: "Farmhouse Bedrooms",
    suitesPresets: ["2 Suites", "4 Suites", "6 Suites Manor", "Worker Quarters Only"],
    bathsLabel: "Attached Bathrooms / En-Suites",
    bathsSublabel: "Farmhouse En-Suites",
    bathsPresets: ["2 Baths", "4 Baths", "6 Baths", "Attached En-Suites"],
    areaLabel: "Total Land Extent / Acreage *",
    areaSublabel: "Super Built-Up Area",
    areaPresets: ["45 Cents (Mangaluru / Udupi)", "5 Acres Domain", "25 Acres Plantation", "50 Acres Estate"],
    carpetLabel: "Farmhouse Built-Up Area",
    carpetSublabel: "Farmhouse Carpet Area",
    parkingLabel: "Farmstead Parking Bays & Yard *",
    parkingSublabel: "Private Parking",
    parkingPresets: ["Dedicated Parking Bays", "Tractor & Vehicle Shed", "Gated Courtyard", "4 Covered Bays"],
    orientationLabel: "Orientation & Natural Vista",
    orientationSublabel: "Orientation & Vista",
    orientationPresets: ["East", "Riverfront Facing", "Valley Panorama", "Hill Ridge (Panoramic)"],
    handoverLabel: "Handover Status & Title *",
    handoverSublabel: "Handover Status",
    handoverPresets: ["Ready to Move", "Immediate Possession", "Clear RTC Title Ready", "Operational Plantation"],
    powerLabel: "Power Infrastructure *",
    powerSublabel: "Power Infrastructure",
    powerPresets: ["100% Dual Backup", "50HP Solar Pump Station", "Sanctioned 3-Phase Agro", "100% Dual DG Backup"],
    waterLabel: "Irrigation & Water Network *",
    waterSublabel: "Water Network",
    waterPresets: ["Dedicated 4x Borewells", "Treated 24/7", "Riverfront Access & Drip", "Micro-Drip Network"],
    securityLabel: "Farm Security & Boundary *",
    securitySublabel: "Estate Security",
    securityPresets: ["Biometric 24/7", "Perimeter Solar Fencing", "Gated Security & CCTV", "Armed Guard & CCTV"],
    elevationLabel: "Topography & Elevation / Terrain",
    elevationSublabel: "Topography & Terrain",
    elevationPresets: [
      "Gentle Hill Slope (Valley View)",
      "Riverfront Level Terrain",
      "Plateau Plantation Tier",
      "Highland Mountain Domain",
      "Tiered Terrace Plantation",
    ],
    elevationDefault: "Gentle Hill Slope (Valley View)",
  },
}

const COMMON_AMENITIES = [
  "Clear Title Vetted by Legal Counsel",
  "Paved Highway Access",
  "Sanctioned 3-Phase Power",
  "100% DG Power Backup",
  "Borewell & Water Connection",
  "24/7 Security & CCTV",
  "Vastu Compliant",
  "Commercial / Converted Status",
  "Solar Ready",
  "Direct Sea / Hill View",
  "Private Parking Bays",
  "Gated Boundary Fencing",
]

export default function SimpleAddListingPage() {
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false)
  const [adminPinInput, setAdminPinInput] = useState("")
  const [pinError, setPinError] = useState(false)

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
  }, [])

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

  const handleAdminLogout = async () => {
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

  // Listing Visibility: "public" vs "private" (Off-Market VIP)
  const [visibility, setVisibility] = useState<"public" | "private">("public")
  const [displayOrder, setDisplayOrder] = useState<number>(1)
  const [featuredHome, setFeaturedHome] = useState<boolean>(false)

  // Status & Submit (declared before useEffect)
  const [publishedId, setPublishedId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Admin Listings Hub (with Public/Private share and toggle)
  const [adminProperties, setAdminProperties] = useState<LuxuryProperty[]>([])
  const [sharingAdminProp, setSharingAdminProp] = useState<LuxuryProperty | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showAdminHub, setShowAdminHub] = useState(false)

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetch(`/api/properties?includePrivate=true&t=${Date.now()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setAdminProperties(data.data)
          }
        })
        .catch((err) => console.log("Failed to load admin properties:", err))
    }
  }, [isAdminAuthenticated, publishedId])

  const handleToggleVisibility = async (prop: LuxuryProperty) => {
    const nextVis = prop.visibility === "private" ? "public" : "private"
    setTogglingId(prop.id)
    try {
      const res = await fetch(`/api/properties/${prop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: nextVis }),
      })
      const data = await res.json()
      if (data.success) {
        setAdminProperties((prev) =>
          prev.map((p) => (p.id === prop.id ? { ...p, visibility: nextVis } : p))
        )
      }
    } catch (e) {
      console.error(e)
    } finally {
      setTogglingId(null)
    }
  }

  // 1. Estate Category & Type
  const [category, setCategory] = useState<string>("residential")
  const [propertyType, setPropertyType] = useState<string>("Duplex Penthouse")
  const [title, setTitle] = useState("")
  const [tagline, setTagline] = useState("")
  const [askingPrice, setAskingPrice] = useState<number | "">(350000000)
  const [priceOnRequest, setPriceOnRequest] = useState(false)
  const [purpose, setPurpose] = useState<"sale" | "lease" | "rent">("sale")

  // 2. Area & Units (for quick conversion)
  const [areaValue, setAreaValue] = useState<number | "">(6500)
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("sq_ft")

  // Location
  const [locality, setLocality] = useState("Worli Sea Face")
  const [city, setCity] = useState("Mumbai")
  const [state, setState] = useState("Maharashtra")

  // 3. KEY ARCHITECTURAL & ESTATE SPECIFICATIONS (Fully Customizable)
  const [bedrooms, setBedrooms] = useState<number | "">(5)
  const [bathrooms, setBathrooms] = useState<number | "">(6)
  const [superBuiltUpArea, setSuperBuiltUpArea] = useState<string>("6,500 sq ft")
  const [carpetArea, setCarpetArea] = useState<string>("5,200 sq ft")
  const [parking, setParking] = useState<string>("4 Covered Bays")
  const [facing, setFacing] = useState<string>("East")
  const [floor, setFloor] = useState<string>("Duplex Penthouse (Top Tier)")
  const [handoverStatus, setHandoverStatus] = useState<string>("Ready to Move")
  const [powerBackup, setPowerBackup] = useState<string>("100% Dual DG Backup")
  const [waterSupply, setWaterSupply] = useState<string>("24/7 Treated Supply")
  const [estateSecurity, setEstateSecurity] = useState<string>("Biometric 24/7")

  // Active Niche Spec Config
  const nicheConfig = NICHE_SPEC_CONFIG[category] || NICHE_SPEC_CONFIG.residential

  // Description & Extra Information
  const [description, setDescription] = useState(
    "Architectural masterpiece with panoramic vistas and private elevator access. Featuring 5 Master Suites, 6 Spa En-Suites, 4 Covered Parking Bays, 100% Dual DG Backup, 24/7 Treated Supply, and Biometric 24/7 Security."
  )

  // Customized Amenities
  const [amenities, setAmenities] = useState<string[]>([
    "Clear Title Vetted by Legal Counsel",
    "100% DG Power Backup",
    "Biometric 24/7 Estate Security",
    "Private Parking Bays",
  ])
  const [newAmenityInput, setNewAmenityInput] = useState("")

  // Images
  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
  ])
  const [imageUrlInput, setImageUrlInput] = useState("")

  // Custom FAQs
  const [customFaqs, setCustomFaqs] = useState<{ question: string; answer: string }[]>([])
  const [newFaqQuestion, setNewFaqQuestion] = useState("")
  const [newFaqAnswer, setNewFaqAnswer] = useState("")

  const handleAddFaq = () => {
    if (newFaqQuestion.trim() && newFaqAnswer.trim()) {
      setCustomFaqs([...customFaqs, { question: newFaqQuestion.trim(), answer: newFaqAnswer.trim() }])
      setNewFaqQuestion("")
      setNewFaqAnswer("")
    }
  }

  const handleRemoveFaq = (index: number) => {
    setCustomFaqs(customFaqs.filter((_, i) => i !== index))
  }

  const handleUpdateFaq = (index: number, field: "question" | "answer", val: string) => {
    setCustomFaqs(customFaqs.map((faq, i) => (i === index ? { ...faq, [field]: val } : faq)))
  }

  const handlePrepopulateFaqs = () => {
    const estateTitle = title.trim() || `${propertyType} in ${locality}, ${city}`
    const priceFormatted = priceOnRequest ? "Price on Request" : askingPrice ? formatIndianCurrency(Number(askingPrice)) : "₹25.0 Cr"
    const areaStr = superBuiltUpArea.trim() || (areaValue ? `${areaValue} ${AREA_UNIT_LABELS[areaUnit]}` : "6,500 sq ft")

    const suggested: { question: string; answer: string }[] = [
      {
        question: `Where is ${estateTitle} located?`,
        answer: `${estateTitle} is situated at ${locality}, ${city}, ${state}, India.`,
      },
      {
        question: `What is the price of ${estateTitle}?`,
        answer: `The asking price is ${priceFormatted} under ${purpose === "sale" ? "For Sale" : purpose === "lease" ? "For Lease" : "For Rent"} status with verified legal documentation.`,
      },
      {
        question: `What are the dimensions and configuration of this ${propertyType}?`,
        answer: `${estateTitle} offers Total Area: ${areaStr}${carpetArea && carpetArea !== "None" ? `, Carpet Area: ${carpetArea}` : ""}${bedrooms ? `, ${bedrooms} BHK` : ""}.`,
      },
      {
        question: `Is parking available at ${estateTitle}?`,
        answer: `Yes, this property includes ${parking || "Covered Bays"}.`,
      },
    ]

    if (amenities.length > 0) {
      suggested.push({
        question: `What signature amenities and infrastructure does ${estateTitle} provide?`,
        answer: `${estateTitle} features ${amenities.slice(0, 6).join(", ")}.`,
      })
    }

    setCustomFaqs(suggested)
  }


  // Set all Key Specifications to None (Clear Specs)
  const handleChooseNoneAllSpecs = () => {
    setBedrooms("")
    setBathrooms("")
    setSuperBuiltUpArea("None")
    setCarpetArea("None")
    setParking("None")
    setFacing("None")
    setFloor("None")
    setHandoverStatus("None")
    setPowerBackup("None")
    setWaterSupply("None")
    setEstateSecurity("None")
  }

  // Restore Niche Defaults for Section 3
  const handleRestoreNicheDefaults = () => {
    const niche = NICHE_SPEC_CONFIG[category] || NICHE_SPEC_CONFIG.residential
    setFloor(niche.elevationDefault)
    if (category === "residential") {
      setSuperBuiltUpArea("6,500 sq ft")
      setCarpetArea("5,200 sq ft")
      setBedrooms(5)
      setBathrooms(6)
      setParking("4 Covered Bays")
      setFacing("East")
      setHandoverStatus("Ready to Move")
      setPowerBackup("100% Dual DG Backup")
      setWaterSupply("24/7 Treated Supply")
      setEstateSecurity("Biometric 24/7")
    } else if (category === "commercial") {
      setSuperBuiltUpArea("45 Cents (Mangaluru / Udupi)")
      setCarpetArea("")
      setBedrooms("")
      setBathrooms("")
      setParking("Dedicated Parking Bays")
      setFacing("East")
      setHandoverStatus("Ready to Move")
      setPowerBackup("100% Dual DG Backup")
      setWaterSupply("24/7 Treated Supply")
      setEstateSecurity("Biometric 24/7")
    } else if (category === "industrial") {
      setSuperBuiltUpArea("85,000 sq ft")
      setCarpetArea("80,000 sq ft")
      setBedrooms("")
      setBathrooms("")
      setParking("16 Dedicated Trailer Bays")
      setFacing("East")
      setHandoverStatus("Ready to Move")
      setPowerBackup("100% Dual DG Backup")
      setWaterSupply("24/7 Treated Supply")
      setEstateSecurity("Biometric 24/7")
    } else if (category === "agriculture") {
      setSuperBuiltUpArea("45 Cents (Mangaluru / Udupi)")
      setCarpetArea("")
      setBedrooms("")
      setBathrooms("")
      setParking("Dedicated Parking Bays")
      setFacing("East")
      setHandoverStatus("Ready to Move")
      setPowerBackup("100% Dual Backup")
      setWaterSupply("Treated 24/7")
      setEstateSecurity("Biometric 24/7")
    }
  }

  // Quick Preset Handlers
  const applySpecPreset = (type: "penthouse_6500" | "mangaluru_45cents" | "commercial_industrial" | "bare_land_none") => {
    if (type === "penthouse_6500") {
      setCategory("residential")
      setPropertyType("Duplex Penthouse")
      setTitle("The Royal Horizon Penthouse")
      setTagline("Panoramic Ocean Panoramas with Private Heated Lap Pool")
      setAskingPrice(350000000)
      setBedrooms(5)
      setBathrooms(6)
      setSuperBuiltUpArea("6,500 sq ft")
      setCarpetArea("5,200 sq ft")
      setParking("4 Covered Bays")
      setFacing("East")
      setFloor("Duplex Penthouse (Top Tier)")
      setHandoverStatus("Ready to Move")
      setPowerBackup("100% Dual DG Backup")
      setWaterSupply("24/7 Treated Supply")
      setEstateSecurity("Biometric 24/7")
      setDescription(
        "Architectural masterpiece with panoramic ocean sunset views and private high-speed elevator access. 5 Master Bedrooms, 6 Spa En-Suites, 6,500 sq ft Super Built-Up Area, 4 Covered Parking Bays, 100% Dual DG Backup, 24/7 Treated Water Supply, Biometric 24/7 Estate Security."
      )
    } else if (type === "mangaluru_45cents") {
      setCategory("commercial")
      setPropertyType("Commercial Land / Plot")
      setTitle("45 Cents Prime Coastal Domain")
      setTagline("Highway Frontage with Conversion Order Ready for Development")
      setAskingPrice(45000000)
      setLocality("Kadri Hills")
      setCity("Mangaluru")
      setState("Karnataka")
      setBedrooms("")
      setBathrooms("")
      setSuperBuiltUpArea("45 Cents (Mangaluru / Udupi)")
      setCarpetArea("")
      setParking("Dedicated Parking Bays")
      setFacing("East")
      setFloor("Full Floor Plate (High-Rise)")
      setHandoverStatus("Ready to Move")
      setPowerBackup("100% Dual Backup")
      setWaterSupply("Treated 24/7")
      setEstateSecurity("Biometric 24/7")
      setDescription(
        "45 Cents super prime land parcel positioned strategically along the growth corridor. Super Built-Up Area: 45 Cents (Mangaluru / Udupi), Dedicated Parking Bays, East Orientation & Vista, Ready to Move Handover Status, 100% Dual Backup Power Infrastructure, Treated 24/7 Water Network, Biometric 24/7 Estate Security."
      )
    } else if (type === "commercial_industrial") {
      setCategory("industrial")
      setPropertyType("Logistics Warehouse")
      setTitle("The Sovereign Automated Logistics Hub")
      setTagline("FM2 Laser Leveled Flooring & Automated Dock Levelers")
      setAskingPrice(680000000)
      setLocality("Bhiwandi Corridor")
      setCity("Mumbai")
      setBedrooms("")
      setBathrooms("")
      setSuperBuiltUpArea("65,000 sq ft")
      setCarpetArea("60,000 sq ft")
      setParking("16 Dedicated Trailer Bays")
      setFacing("East")
      setFloor("14m Clear Eaves Height (PEB)")
      setHandoverStatus("Ready to Move")
      setPowerBackup("100% Dual DG Backup")
      setWaterSupply("24/7 Treated Supply")
      setEstateSecurity("Biometric 24/7")
      setDescription(
        "Institutional-grade mega industrial distribution hub with 14m eaves height, 65,000 sq ft Super Built-Up Area, 16 Trailer Bays, 100% Dual DG Backup, Treated 24/7 Water Network, and Biometric 24/7 Estate Security."
      )
    } else if (type === "bare_land_none") {
      setCategory("commercial")
      setPropertyType("Commercial Land / Plot")
      setTitle("Prime Commercial Freehold Plot")
      setTagline("Strategic Corner Land Parcel with Direct Highway Access")
      setAskingPrice(25000000)
      setLocality("Airport Road")
      setCity("Mangaluru")
      handleChooseNoneAllSpecs()
      setDescription(
        "Clear titled commercial freehold plot. Unencumbered property without pre-existing structures; all architectural specifications omitted."
      )
    }
  }

  // Handle Category Change (updates niche specific defaults)
  const handleCategoryChange = (catId: string) => {
    setCategory(catId)
    const defaults = SUB_TYPES_BY_CATEGORY[catId] || []
    if (defaults.length > 0) {
      setPropertyType(defaults[0])
    }

    const niche = NICHE_SPEC_CONFIG[catId]
    if (niche) {
      // Dynamically adapt Elevation/Tier and fields based on property niche
      setFloor(niche.elevationDefault)
      if (catId === "residential") {
        setSuperBuiltUpArea("6,500 sq ft")
        setCarpetArea("5,200 sq ft")
        setBedrooms(5)
        setBathrooms(6)
        setParking("4 Covered Bays")
        setPowerBackup("100% Dual DG Backup")
        setWaterSupply("24/7 Treated Supply")
        setEstateSecurity("Biometric 24/7")
      } else if (catId === "commercial") {
        setSuperBuiltUpArea("45 Cents (Mangaluru / Udupi)")
        setCarpetArea("")
        setBedrooms("")
        setBathrooms("")
        setParking("Dedicated Parking Bays")
        setPowerBackup("100% Dual DG Backup")
        setWaterSupply("24/7 Treated Supply")
        setEstateSecurity("Biometric 24/7")
      } else if (catId === "industrial") {
        setSuperBuiltUpArea("85,000 sq ft")
        setCarpetArea("80,000 sq ft")
        setBedrooms("")
        setBathrooms("")
        setParking("16 Dedicated Trailer Bays")
        setPowerBackup("100% Dual DG Backup")
        setWaterSupply("24/7 Treated Supply")
        setEstateSecurity("Biometric 24/7")
      } else if (catId === "agriculture") {
        setSuperBuiltUpArea("45 Cents (Mangaluru / Udupi)")
        setCarpetArea("")
        setBedrooms("")
        setBathrooms("")
        setParking("Dedicated Parking Bays")
        setPowerBackup("100% Dual Backup")
        setWaterSupply("Treated 24/7")
        setEstateSecurity("Biometric 24/7")
      }
    }
  }

  // Toggle Amenity
  const toggleAmenity = (name: string) => {
    if (amenities.includes(name)) {
      setAmenities(amenities.filter((a) => a !== name))
    } else {
      setAmenities([...amenities, name])
    }
  }

  // Add Custom Amenity
  const handleAddCustomAmenity = () => {
    if (newAmenityInput.trim() && !amenities.includes(newAmenityInput.trim())) {
      setAmenities([...amenities, newAmenityInput.trim()])
      setNewAmenityInput("")
    }
  }

  // Add Image URL
  const handleAddImage = () => {
    if (imageUrlInput.trim()) {
      setImages([...images, imageUrlInput.trim()])
      setImageUrlInput("")
    }
  }

  // Form Submit to PostgreSQL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const finalArea = superBuiltUpArea.trim() || (areaValue ? `${areaValue} ${AREA_UNIT_LABELS[areaUnit]}` : "6,500 sq ft")
      const priceNumeric = priceOnRequest ? 0 : Number(askingPrice) || 0
      const priceDisplay = priceOnRequest ? "Price on Request" : formatIndianCurrency(priceNumeric)

      const isNoneOrEmpty = (val?: string | number | null) => !val || val === "None" || val === "N/A"

      const customHighlights: string[] = []
      if (!isNoneOrEmpty(finalArea)) customHighlights.push(`${finalArea} ${nicheConfig.areaSublabel}`)
      if (!isNoneOrEmpty(parking)) customHighlights.push(`${parking} ${nicheConfig.parkingSublabel}`)
      if (!isNoneOrEmpty(powerBackup)) customHighlights.push(`${powerBackup} ${nicheConfig.powerSublabel}`)
      if (!isNoneOrEmpty(estateSecurity)) customHighlights.push(`${estateSecurity} ${nicheConfig.securitySublabel}`)
      if (customHighlights.length === 0) {
        customHighlights.push(
          `${propertyType} • ${locality}`,
          "Vetted Freehold Title",
          "Admin Direct Listing"
        )
      }

      const specSummaryParts: string[] = []
      if (!isNoneOrEmpty(finalArea)) specSummaryParts.push(finalArea)
      if (!isNoneOrEmpty(parking)) specSummaryParts.push(parking)
      if (!isNoneOrEmpty(facing)) specSummaryParts.push(`${facing} orientation`)
      if (!isNoneOrEmpty(handoverStatus)) specSummaryParts.push(handoverStatus)

      const defaultDesc = `Premium ${propertyType} positioned in ${locality}, ${city}. ${
        specSummaryParts.length > 0 ? `Architectural specifications: ${specSummaryParts.join(", ")}.` : "Clear freehold title and unencumbered possession."
      }`

      const payload = {
        title: title || `${propertyType} in ${locality}, ${city}`,
        tagline: tagline || `Exclusive ${propertyType} Portfolio • ${city}`,
        category: category,
        subType: propertyType.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        propertyType: propertyType,
        price: priceDisplay,
        priceNumeric: priceNumeric,
        priceSuffix: purpose === "lease" || purpose === "rent" ? "/ month" : undefined,
        location: `${locality}, ${city}`,
        city: city,
        state: state,
        area: finalArea,
        carpetArea: isNoneOrEmpty(carpetArea) ? undefined : carpetArea,
        bedrooms: bedrooms !== "" ? Number(bedrooms) : undefined,
        bathrooms: bathrooms !== "" ? Number(bathrooms) : undefined,
        parking: parking || "None",
        facing: facing || "None",
        floor: isNoneOrEmpty(floor) ? undefined : floor,
        age: handoverStatus || "None",
        status: purpose === "sale" ? "For Sale" : purpose === "lease" ? "For Lease" : "For Rent",
        listingType: purpose === "sale" ? "sell" : "rent",
        rating: 4.98,
        reviews: 12,
        isNew: true,
        isExclusive: true,
        isTrophy: true,
        tags: [propertyType, "Vetted Freehold Title", "Admin Direct Listing", city],
        images: images.length > 0 ? images : [
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
        ],
        description: description || defaultDesc,
        highlights: customHighlights,
        amenities: amenities,
        details: {
          area: finalArea,
          superBuiltUpArea: finalArea,
          carpet: isNoneOrEmpty(carpetArea) ? undefined : carpetArea,
          propertyType: propertyType,
          purpose: purpose,
          locality: locality,
          city: city,
          bedrooms: bedrooms !== "" ? Number(bedrooms) : undefined,
          bathrooms: bathrooms !== "" ? Number(bathrooms) : undefined,
          parking: parking,
          facing: facing,
          floor: floor,
          age: handoverStatus,
          electricity: powerBackup,
          water: waterSupply,
          security: estateSecurity,
          elevationTier: floor,
          nicheCategory: category,
        },
        landmarks: [
          { name: "Executive Aviation / Airport", type: "airport", distance: "12 km", color: "bg-blue-50 text-blue-900 border border-blue-200" },
          { name: "Commercial Central Hub", type: "hub", distance: "4 km", color: "bg-emerald-50 text-emerald-900 border border-emerald-200" },
        ],
        seller: {
          name: "Jaya Royal Admin",
          title: "Principal Estate Director",
          phone: "+91 82965 30609",
          email: "admin@jaya-estates.com",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
          verified: true,
          portfolioCount: 25,
        },
        roi: "9.5% Target Yield",
        coordinates: { lat: 18.9696, lng: 72.8081 },
        purpose: purpose,
        ownership: "freehold",
        visibility: visibility,
        displayOrder: Number(displayOrder) || 1,
        featuredHome: Boolean(featuredHome),
        strengthScore: 95,
        verificationTier: "documents_verified",
        attributes: {
          listedBy: "admin",
          superBuiltUpArea: finalArea,
          carpetArea: carpetArea,
          parking: parking,
          facing: facing,
          handoverStatus: handoverStatus,
          powerBackup: powerBackup,
          waterSupply: waterSupply,
          estateSecurity: estateSecurity,
          elevationTier: floor,
          nicheType: category,
          areaValue,
          areaUnit,
        },
        facilities: amenities.map((a) => ({ facility_key: a, available: true })),
        documents: [
          { doc_type: "sale_deed", verification_status: "verified" },
          { doc_type: "khata", verification_status: "verified" },
        ],
        customFaqs: customFaqs.filter((f) => f.question.trim() && f.answer.trim()),
      }

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create listing")
      }

      setPublishedId(data.data.id)
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mount check to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-sans">
        <PropertyHeader />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-xs uppercase tracking-widest font-bold text-amber-700 animate-pulse">
            Authenticating Jaya Royal Portal...
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Admin Security Gate Check
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-sans selection:bg-red-900 selection:text-white">
        <PropertyHeader />

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
          <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 shadow-xl p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-950 to-stone-900 text-amber-400 flex items-center justify-center mx-auto shadow-md border border-amber-600/30">
              <KeyRound className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-widest font-black text-amber-600">
                Authorized Administrator Only
              </span>
              <h1 className="text-2xl font-serif font-black text-stone-900 mt-1">
                Admin Direct Portal
              </h1>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Add Listing is restricted strictly to the administrator. Public users and buyers do not have listing permissions. Enter your passcode or verify access below.
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
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-red-900 focus:ring-2 focus:ring-red-900/20 text-center text-sm font-mono tracking-widest outline-none bg-stone-50/50"
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

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <Link href="/" className="hover:text-stone-900 transition font-medium">
                ← Return to Public Site
              </Link>
              <span>Protected Portal</span>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-sans selection:bg-red-900 selection:text-white">
      <PropertyHeader />

      {/* Top Banner */}
      <section className="bg-gradient-to-r from-[#2B0008] via-[#1D0005] to-[#120003] text-stone-100 py-6 px-4 sm:px-6 lg:px-8 border-b border-amber-900/40">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-400">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Jaya Royal Portal • Admin Direct Listing Only</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white mt-1">
              Add Property Listing
            </h1>
            <p className="text-xs text-stone-300 mt-0.5">
              Admin Exclusive Portal. Publish public listings or create confidential off-market private shares.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdminHub(!showAdminHub)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                showAdminHub
                  ? "bg-amber-400 text-stone-950 border-amber-400"
                  : "bg-stone-900/90 text-amber-300 border-amber-600/40 hover:bg-stone-900"
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{showAdminHub ? "Hide Share Hub" : `Portfolio Share Hub (${adminProperties.length})`}</span>
            </button>

            <Link
              href="/admin"
              className="px-3.5 py-2 rounded-xl bg-stone-900 text-amber-300 border border-amber-600/40 text-xs font-bold hover:bg-black transition flex items-center gap-1.5"
            >
              <span>Admin Console</span>
            </Link>

            <button
              type="button"
              onClick={handleAdminLogout}
              title="Log Out Administrator Session"
              className="px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800/40 text-red-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ADMIN PORTFOLIO & SHARE HUB */}
        {showAdminHub && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-amber-900/40 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <h2 className="text-base font-serif font-bold text-stone-900">
                    Administrator Portfolio & Share Hub
                  </h2>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  Manage all properties, toggle between Public Directory and Private VIP Share Only, and dispatch instant share links.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  {adminProperties.filter((p) => p.visibility !== "private").length} Public
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                  {adminProperties.filter((p) => p.visibility === "private").length} Private VIP
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {adminProperties.map((prop) => {
                const isPrivate = prop.visibility === "private"
                const isToggling = togglingId === prop.id
                return (
                  <div
                    key={prop.id}
                    className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:border-amber-900/30 transition flex flex-col justify-between gap-3"
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-200 flex-shrink-0 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={prop.images?.[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80"}
                          alt={prop.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isPrivate
                              ? "bg-amber-100 text-amber-900 border-amber-300"
                              : "bg-emerald-100 text-emerald-900 border-emerald-300"
                          }`}>
                            {isPrivate ? "🔒 Private VIP Only" : "🌐 Public"}
                          </span>
                          <span className="text-xs font-bold text-red-950">{prop.price}</span>
                        </div>
                        <h4 className="text-xs font-bold text-stone-900 truncate mt-1">
                          {prop.title}
                        </h4>
                        <p className="text-[11px] text-stone-500 truncate">
                          {prop.location || prop.city} • {prop.area}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200/80">
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleVisibility(prop)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition flex items-center gap-1.5 ${
                          isPrivate
                            ? "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                            : "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                        }`}
                      >
                        {isPrivate ? (
                          <>
                            <Globe className="w-3 h-3 text-emerald-700" />
                            <span>Make Public</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-amber-700" />
                            <span>Make Private</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/property/${prop.id}${isPrivate ? "?access=private_vip" : ""}`}
                          target="_blank"
                          className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => setSharingAdminProp(prop)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-900 to-red-950 text-white text-[11px] font-bold hover:bg-black transition flex items-center gap-1.5 shadow-xs"
                        >
                          <Share2 className="w-3 h-3 text-amber-400" />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {publishedId ? (
          /* SUCCESS STATE */
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-stone-200 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <span className="text-xs uppercase tracking-widest font-bold text-amber-600">
                PostgreSQL Committed & Live
              </span>
              <h2 className="text-2xl font-serif font-bold text-stone-900">
                Estate Successfully Listed!
              </h2>
              <p className="text-xs text-stone-600">
                Your asset is recorded in PostgreSQL ({visibility === "private" ? "🔒 Private VIP Share Only" : "🌐 Public Directory"}).
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href={`/property/${publishedId}${visibility === "private" ? "?access=private_vip" : ""}`}
                className="px-5 py-2.5 rounded-full bg-[#800020] text-white text-xs font-bold hover:bg-red-950 transition shadow"
              >
                View Property Page
              </Link>
              <button
                type="button"
                onClick={() => {
                  const created = adminProperties.find((p) => p.id === publishedId) || {
                    id: publishedId,
                    title: title || `${propertyType} in ${locality}, ${city}`,
                    category,
                    propertyType,
                    price: typeof askingPrice === "number" ? formatIndianCurrency(askingPrice) : "Price on Request",
                    location: `${locality}, ${city}`,
                    city,
                    area: `${areaValue} ${AREA_UNIT_LABELS[areaUnit]}`,
                    images,
                    visibility,
                    specs: { bedrooms, bathrooms, parking, facing, floor, handoverStatus },
                  } as LuxuryProperty
                  setSharingAdminProp(created)
                }}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-red-950 to-stone-900 text-amber-300 text-xs font-bold hover:opacity-95 transition border border-amber-600/40 flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Share Listing Now</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPublishedId(null)
                  setTitle("")
                  setAskingPrice(350000000)
                  setDescription("")
                }}
                className="px-5 py-2.5 rounded-full bg-stone-100 text-stone-800 text-xs font-bold hover:bg-stone-200 transition border"
              >
                + Add Another Listing
              </button>
            </div>
          </div>
        ) : (
          /* SINGLE PRIMARY LISTING FORM */
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* LISTING VISIBILITY CONTROLLER (PUBLIC vs PRIVATE SHARE ONLY) */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-amber-900/30 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-white text-xs font-bold flex items-center justify-center">
                    ★
                  </div>
                  <h3 className="font-serif font-bold text-sm text-stone-900 uppercase tracking-wide">
                    Listing Visibility & Share Access
                  </h3>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  visibility === "private"
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-emerald-100 text-emerald-900 border-emerald-300"
                }`}>
                  {visibility === "private" ? "🔒 Private VIP Share Only" : "🌐 Public Directory"}
                </span>
              </div>

              <p className="text-xs text-stone-600">
                Choose whether this asset is publicly browsable by everyone or kept strictly confidential for direct private sharing.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setVisibility("public")}
                  className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                    visibility === "public"
                      ? "border-[#800020] bg-rose-50/50 shadow-xs ring-1 ring-red-900/20"
                      : "border-stone-200 hover:border-stone-300 bg-stone-50/50"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${visibility === "public" ? "bg-red-900 text-white" : "bg-stone-200 text-stone-600"}`}>
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-stone-900 block">
                      🌐 Public Listing (Standard)
                    </span>
                    <span className="text-[11px] text-stone-600 block mt-0.5 leading-snug">
                      Visible to all website visitors across homepage, category pages, and search filters.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility("private")}
                  className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                    visibility === "private"
                      ? "border-amber-600 bg-amber-50/60 shadow-xs ring-1 ring-amber-600/30"
                      : "border-stone-200 hover:border-stone-300 bg-stone-50/50"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${visibility === "private" ? "bg-amber-600 text-white" : "bg-stone-200 text-stone-600"}`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-stone-900 block flex items-center gap-1.5">
                      <span>🔒 Private VIP Share Only (Off-Market)</span>
                    </span>
                    <span className="text-[11px] text-stone-600 block mt-0.5 leading-snug">
                      <strong>Hidden from public website & searches.</strong> Only the clients you send the private link to can open and view it.
                    </span>
                  </div>
                </button>
              </div>

              {/* HOME PAGE PLACEMENT & DISPLAY PRIORITY */}
              <div className="mt-4 pt-4 border-t border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                      Display Priority & Home Page Placement
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500">Modify what appears up first</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pin to Top Toggle */}
                  <div
                    onClick={() => setFeaturedHome(!featuredHome)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      featuredHome
                        ? "border-amber-500 bg-amber-50 shadow-xs ring-1 ring-amber-500/20"
                        : "border-stone-200 hover:border-stone-300 bg-stone-50/50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        featuredHome ? "bg-amber-500 text-white shadow-sm" : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      <Star className={`w-4 h-4 ${featuredHome ? "fill-white" : ""}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-stone-900">Pin to Top of Home Page</p>
                      <p className="text-[10px] text-stone-500 leading-tight">Estates with this enabled appear first in the public catalog showcase.</p>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        featuredHome ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-stone-200 text-stone-600"
                      }`}
                    >
                      {featuredHome ? "PINNED" : "OFF"}
                    </span>
                  </div>

                  {/* Priority Order Number */}
                  <div className="p-3.5 rounded-xl border-2 border-stone-200 bg-stone-50/50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center font-black text-xs">
                      #{displayOrder || 1}
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-stone-900 block">Catalog Priority Order Rank</label>
                      <p className="text-[10px] text-stone-500 leading-tight">Lower number = appears higher on Home & Category pages (e.g. 1, 2, 3...)</p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-18 px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-bold text-stone-900 bg-white text-center focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK PRESET TEMPLATES BAR */}
            <div className="bg-gradient-to-r from-amber-950/20 via-rose-950/10 to-amber-950/20 p-4 rounded-2xl border border-amber-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-rose-950">
                    Quick Specification Presets:
                  </span>
                  <p className="text-[11px] text-stone-600">Click to autofill exact architectural estate specifications</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applySpecPreset("penthouse_6500")}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-900 border border-rose-900/20 text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                >
                  <Home className="w-3.5 h-3.5 text-blue-600" />
                  <span>6,500 sq ft Luxury Penthouse (5 Suites / 6 Baths)</span>
                </button>

                <button
                  type="button"
                  onClick={() => applySpecPreset("mangaluru_45cents")}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-900 border border-amber-900/20 text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>45 Cents Prime Land (Dedicated Bays, East)</span>
                </button>

                <button
                  type="button"
                  onClick={() => applySpecPreset("commercial_industrial")}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-purple-900 border border-purple-900/20 text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                >
                  <Factory className="w-3.5 h-3.5 text-purple-600" />
                  <span>Commercial / Industrial Mega-Hub</span>
                </button>

                <button
                  type="button"
                  onClick={() => applySpecPreset("bare_land_none")}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                >
                  <Ban className="w-3.5 h-3.5 text-rose-800" />
                  <span>Unbuilt Plot (All Specs None)</span>
                </button>
              </div>
            </div>

            {/* 1. ESTATE CATEGORY */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-900 text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="font-serif font-bold text-sm text-stone-900 uppercase tracking-wide">
                  Select Estate Category (Niche)
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon
                  const isSelected = category === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? "border-[#800020] bg-rose-50/50 shadow-xs"
                          : "border-stone-200 hover:border-stone-300 bg-stone-50/50"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? "text-red-900" : "text-stone-500"}`} />
                      <span className={`block text-xs font-bold ${isSelected ? "text-red-950" : "text-stone-700"}`}>
                        {cat.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Sub-Type Quick Selector & Custom Input */}
              <div className="pt-2 space-y-2">
                <label className="text-xs font-semibold text-stone-600 block">
                  Property Sub-Type:
                </label>
                <div className="flex flex-wrap gap-2">
                  {(SUB_TYPES_BY_CATEGORY[category] || []).map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setPropertyType(sub)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        propertyType === sub
                          ? "bg-red-900 text-white border-red-900 shadow-xs"
                          : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Or enter custom property type..."
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-stone-300 bg-stone-50/50 mt-1"
                />
              </div>
            </div>

            {/* 2. CORE DETAILS: TITLE, PRICE & LOCATION */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-900 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="font-serif font-bold text-sm text-stone-900 uppercase tracking-wide">
                  Title, Valuation & Location
                </h3>
              </div>

              {/* Title & Tagline */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Property Headline Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Sovereign Sky Citadel"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-10 px-3.5 text-sm rounded-lg border border-stone-300 bg-stone-50/50 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Luxury Tagline / Vista Highlight
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Unobstructed Ocean Panoramas with Private Heated Lap Pool"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full h-9 px-3.5 text-xs rounded-lg border border-stone-300 bg-stone-50/50"
                  />
                </div>
              </div>

              {/* Price & Purpose Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Asking Price */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-700">Valuation Price *</label>
                    <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={priceOnRequest}
                        onChange={(e) => setPriceOnRequest(e.target.checked)}
                        className="rounded text-red-900"
                      />
                      <span>Price on Request</span>
                    </label>
                  </div>

                  {!priceOnRequest && (
                    <div className="space-y-1">
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-stone-500 font-serif text-sm">₹</span>
                        <input
                          type="number"
                          required={!priceOnRequest}
                          placeholder="e.g. 350000000 for ₹35.00 Cr"
                          value={askingPrice}
                          onChange={(e) =>
                            setAskingPrice(e.target.value ? Number(e.target.value) : "")
                          }
                          className="w-full h-9 pl-7 pr-3 text-xs font-bold text-stone-900 rounded-lg border border-stone-300 bg-white"
                        />
                      </div>
                      {Number(askingPrice) > 0 && (
                        <p className="text-xs font-bold text-red-900 font-serif">
                          Indian Value: {formatIndianCurrency(Number(askingPrice))}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Purpose */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
                  <label className="text-xs font-semibold text-stone-700 block">Transaction Structure</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as any)}
                    className="w-full h-9 px-2.5 text-xs rounded-lg border border-stone-300 bg-white font-medium"
                  >
                    <option value="sale">Outright Sale / Freehold Title</option>
                    <option value="lease">Long-Term Institutional Lease</option>
                    <option value="rent">High-Yield Rental</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Micro-Market / Locality *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Worli Sea Face / Kadri Hills"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs rounded-lg border border-stone-300 bg-stone-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">City / Region *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DK (Dakshina Kannada) / Udupi / Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs rounded-lg border border-stone-300 bg-stone-50/50"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5 text-[10px]">
                    <span className="text-stone-400 font-semibold">Quick select:</span>
                    {[
                      { label: "DK (Dakshina Kannada)", val: "DK (Dakshina Kannada)" },
                      { label: "Udupi", val: "Udupi" },
                      { label: "Mangaluru", val: "Mangaluru" },
                      { label: "Mumbai", val: "Mumbai" },
                      { label: "Bangalore", val: "Bangalore" },
                    ].map((c) => (
                      <button
                        key={c.val}
                        type="button"
                        onClick={() => setCity(c.val)}
                        className={`px-2 py-0.5 rounded font-bold transition-all border ${
                          city === c.val
                            ? "bg-rose-900 text-white border-rose-900"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200 border-stone-300"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs rounded-lg border border-stone-300 bg-stone-50/50"
                  />
                </div>
              </div>
            </div>

            {/* 3. KEY ARCHITECTURAL & ESTATE SPECIFICATIONS (Dynamically tailored to property niche) */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-rose-900/30 shadow-md space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-900 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <div>
                    <h3 className="font-serif font-black text-base text-stone-900 tracking-tight flex items-center gap-2">
                      <Compass className="w-4 h-4 text-rose-800" />
                      <span>Key Architectural & Estate Specifications</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Fully customizable specifications with individual and global &quot;None&quot; options for unbuilt plots, open land, or bespoke estates.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleChooseNoneAllSpecs}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-900 border border-stone-300 transition"
                    title="Set all specifications to None"
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-800" />
                    <span>Choose None (All Specs)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRestoreNicheDefaults}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition"
                    title="Restore default presets for this niche"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
                    <span>Reset Defaults</span>
                  </button>

                  <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${nicheConfig.badgeColor}`}>
                    {nicheConfig.nicheTitle}
                  </span>
                </div>
              </div>

              {/* SPECIFICATION INPUTS GRID (11 Adaptable Metrics with dedicated None chips) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* 1. Suites / Master Bedrooms */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800">
                      <Bed className="w-4 h-4 text-blue-600" />
                      <span>{nicheConfig.suitesLabel}</span>
                    </div>
                    {bedrooms === "" && (
                      <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        None Selected
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5 (or leave empty for None)"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value ? Number(e.target.value) : "")}
                    className="w-full h-9 px-3 text-xs font-bold rounded-lg border border-stone-300 bg-white"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {nicheConfig.suitesPresets.map((preset, idx) => {
                      const num = parseInt(preset.replace(/\D/g, ""), 10)
                      const isSel = bedrooms === num
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setBedrooms(isNaN(num) ? "" : num)}
                          className={`text-[10px] px-2 py-0.5 rounded font-bold transition ${
                            isSel ? "bg-blue-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                          }`}
                        >
                          {preset}
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => setBedrooms("")}
                      className={`text-[10px] px-2.5 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                        bedrooms === "" ? "bg-rose-900 text-white shadow-xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>None</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-500 block">
                    {bedrooms !== "" ? (
                      <>Displays as: &quot;{bedrooms} Suites • {nicheConfig.suitesSublabel}&quot;</>
                    ) : (
                      <span className="text-rose-800 font-medium">Status: None (Omitted from estate view)</span>
                    )}
                  </span>
                </div>

                {/* 2. Baths / Spa En-Suites */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800">
                      <Bath className="w-4 h-4 text-blue-600" />
                      <span>{nicheConfig.bathsLabel}</span>
                    </div>
                    {bathrooms === "" && (
                      <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        None Selected
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 6 (or leave empty for None)"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value ? Number(e.target.value) : "")}
                    className="w-full h-9 px-3 text-xs font-bold rounded-lg border border-stone-300 bg-white"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {nicheConfig.bathsPresets.map((preset, idx) => {
                      const num = parseInt(preset.replace(/\D/g, ""), 10)
                      const isSel = bathrooms === num
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setBathrooms(isNaN(num) ? "" : num)}
                          className={`text-[10px] px-2 py-0.5 rounded font-bold transition ${
                            isSel ? "bg-blue-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                          }`}
                        >
                          {preset}
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => setBathrooms("")}
                      className={`text-[10px] px-2.5 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                        bathrooms === "" ? "bg-rose-900 text-white shadow-xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>None</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-500 block">
                    {bathrooms !== "" ? (
                      <>Displays as: &quot;{bathrooms} Baths • {nicheConfig.bathsSublabel}&quot;</>
                    ) : (
                      <span className="text-rose-800 font-medium">Status: None (Omitted from estate view)</span>
                    )}
                  </span>
                </div>

                {/* 3. Super Built-Up Area */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800">
                      <Square className="w-4 h-4 text-rose-800" />
                      <span>{nicheConfig.areaLabel}</span>
                    </div>
                    {superBuiltUpArea === "None" && (
                      <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        None Selected
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 6,500 sq ft or None"
                    value={superBuiltUpArea}
                    onChange={(e) => setSuperBuiltUpArea(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-bold rounded-lg border border-stone-300 bg-white"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {nicheConfig.areaPresets.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSuperBuiltUpArea(val)}
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold transition ${
                          superBuiltUpArea === val ? "bg-rose-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSuperBuiltUpArea("None")}
                      className={`text-[10px] px-2.5 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                        superBuiltUpArea === "None" ? "bg-rose-900 text-white shadow-xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>None</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-500 block">
                    {superBuiltUpArea === "None" ? (
                      <span className="text-rose-800 font-medium">Status: None (Omitted from estate view)</span>
                    ) : (
                      <>Sub-label: &quot;{nicheConfig.areaSublabel}&quot;</>
                    )}
                  </span>
                </div>

                {/* 4. RERA Carpet Area */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800">
                      <Square className="w-4 h-4 text-amber-700" />
                      <span>{nicheConfig.carpetLabel}</span>
                    </div>
                    {(carpetArea === "None" || carpetArea === "") && (
                      <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        None Selected
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 5,200 sq ft or None"
                    value={carpetArea}
                    onChange={(e) => setCarpetArea(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-stone-300 bg-white"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {["5,200 sq ft", "4,800 sq ft", "12,500 sq ft"].map((cp) => (
                      <button
                        key={cp}
                        type="button"
                        onClick={() => setCarpetArea(cp)}
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold transition ${
                          carpetArea === cp ? "bg-amber-700 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                        }`}
                      >
                        {cp}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCarpetArea("None")}
                      className={`text-[10px] px-2.5 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                        carpetArea === "None" || carpetArea === "" ? "bg-rose-900 text-white shadow-xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>None</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-500 block">
                    {carpetArea === "None" || carpetArea === "" ? (
                      <span className="text-rose-800 font-medium">Status: None (Omitted from estate view)</span>
                    ) : (
                      <>Sub-label: &quot;{nicheConfig.carpetSublabel}&quot;</>
                    )}
                  </span>
                </div>

                {/* 5. Private Parking */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800">
                      <Car className="w-4 h-4 text-rose-800" />
                      <span>{nicheConfig.parkingLabel}</span>
                    </div>
                    {parking === "None" && (
                      <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        None Selected
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 4 Covered Bays or None"
                    value={parking}
                    onChange={(e) => setParking(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-bold rounded-lg border border-stone-300 bg-white"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {nicheConfig.parkingPresets.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setParking(p)}
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold transition ${
                          parking === p ? "bg-rose-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setParking("None")}
                      className={`text-[10px] px-2.5 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                        parking === "None" ? "bg-rose-900 text-white shadow-xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>None</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-500 block">
                    {parking === "None" ? (
                      <span className="text-rose-800 font-medium">Status: None (Omitted from estate view)</span>
                    ) : (
                      <>Sub-label: &quot;{nicheConfig.parkingSublabel}&quot;</>
                    )}
                  </span>
                </div>

                {/* 6. Orientation & Vista */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800">
                      <Compass className="w-4 h-4 text-emerald-700" />
                      <span>{nicheConfig.orientationLabel}</span>
                    </div>
                    {facing === "None" && (
                      <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        None Selected
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. East or None"
                    value={facing}
                    onChange={(e) => setFacing(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-bold rounded-lg border border-stone-300 bg-white"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {nicheConfig.orientationPresets.map((dir) => (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => setFacing(dir)}
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold transition ${
                          facing === dir ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                        }`}
                      >
                        {dir}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFacing("None")}
                      className={`text-[10px] px-2.5 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                        facing === "None" ? "bg-rose-900 text-white shadow-xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>None</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-500 block">
                    {facing === "None" ? (
                      <span className="text-rose-800 font-medium">Status: None (Omitted from estate view)</span>
                    ) : (
                      <>Sub-label: &quot;{nicheConfig.orientationSublabel}&quot;</>
                    )}
                  </span>
                </div>

                {/* 7. Handover Status */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800">
                      <Calendar className="w-4 h-4 text-rose-800" />
                      <span>{nicheConfig.handoverLabel}</span>
                    </div>
                    {handoverStatus === "None" && (
                      <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        None Selected
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Ready to Move or None"
                    value={handoverStatus}
                    onChange={(e) => setHandoverStatus(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-bold rounded-lg border border-stone-300 bg-white"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {nicheConfig.handoverPresets.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setHandoverStatus(st)}
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold transition ${
                          handoverStatus === st ? "bg-rose-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setHandoverStatus("None")}
                      className={`text-[10px] px-2.5 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                        handoverStatus === "None" ? "bg-rose-900 text-white shadow-xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>None</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-500 block">
                    {handoverStatus === "None" ? (
                      <span className="text-rose-800 font-medium">Status: None (Omitted from estate view)</span>
                    ) : (
                      <>Sub-label: &quot;{nicheConfig.handoverSublabel}&quot;</>
                    )}
                  </span>
                </div>

                {/* 8. Power Infrastructure */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span>{nicheConfig.powerLabel}</span>
                    </div>
                    {powerBackup === "None" && (
                      <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        None Selected
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 100% Dual DG Backup or None"
                    value={powerBackup}
                    onChange={(e) => setPowerBackup(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-bold rounded-lg border border-stone-300 bg-white"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {nicheConfig.powerPresets.map((pwr) => (
                      <button
                        key={pwr}
                        type="button"
                        onClick={() => setPowerBackup(pwr)}
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold transition ${
                          powerBackup === pwr ? "bg-amber-700 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                        }`}
                      >
                        {pwr}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPowerBackup("None")}
                      className={`text-[10px] px-2.5 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                        powerBackup === "None" ? "bg-rose-900 text-white shadow-xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>None</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-500 block">
                    {powerBackup === "None" ? (
                      <span className="text-rose-800 font-medium">Status: None (Omitted from estate view)</span>
                    ) : (
                      <>Sub-label: &quot;{nicheConfig.powerSublabel}&quot;</>
                    )}
                  </span>
                </div>

                {/* 9. Water Network */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800">
                      <Droplets className="w-4 h-4 text-blue-600" />
                      <span>{nicheConfig.waterLabel}</span>
                    </div>
                    {waterSupply === "None" && (
                      <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        None Selected
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 24/7 Treated Supply or None"
                    value={waterSupply}
                    onChange={(e) => setWaterSupply(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-bold rounded-lg border border-stone-300 bg-white"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {nicheConfig.waterPresets.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setWaterSupply(w)}
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold transition ${
                          waterSupply === w ? "bg-blue-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setWaterSupply("None")}
                      className={`text-[10px] px-2.5 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                        waterSupply === "None" ? "bg-rose-900 text-white shadow-xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>None</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-500 block">
                    {waterSupply === "None" ? (
                      <span className="text-rose-800 font-medium">Status: None (Omitted from estate view)</span>
                    ) : (
                      <>Sub-label: &quot;{nicheConfig.waterSublabel}&quot;</>
                    )}
                  </span>
                </div>

                {/* 10. Estate Security */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-800">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <span>{nicheConfig.securityLabel}</span>
                    </div>
                    {estateSecurity === "None" && (
                      <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        None Selected
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Biometric 24/7 or None"
                    value={estateSecurity}
                    onChange={(e) => setEstateSecurity(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-bold rounded-lg border border-stone-300 bg-white"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {nicheConfig.securityPresets.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setEstateSecurity(sec)}
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold transition ${
                          estateSecurity === sec ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                        }`}
                      >
                        {sec}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEstateSecurity("None")}
                      className={`text-[10px] px-2.5 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                        estateSecurity === "None" ? "bg-rose-900 text-white shadow-xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>None</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-500 block">
                    {estateSecurity === "None" ? (
                      <span className="text-rose-800 font-medium">Status: None (Omitted from estate view)</span>
                    ) : (
                      <>Sub-label: &quot;{nicheConfig.securitySublabel}&quot;</>
                    )}
                  </span>
                </div>

                {/* 11. Elevation / Tier (DYNAMICALLY ADAPTED BASED ON PROPERTY NICHE) */}
                <div className="p-3.5 rounded-xl border-2 border-rose-900/30 bg-rose-50/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-950">
                      <Home className="w-4 h-4 text-rose-800" />
                      <span>{nicheConfig.elevationLabel}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {floor === "None" && (
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                          None Selected
                        </span>
                      )}
                      <span className="text-[9px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                        Niche Adapted
                      </span>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder={`e.g. ${nicheConfig.elevationDefault} or None`}
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-bold rounded-lg border border-stone-300 bg-white focus:ring-1 focus:ring-rose-800"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {nicheConfig.elevationPresets.map((el) => (
                      <button
                        key={el}
                        type="button"
                        onClick={() => setFloor(el)}
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold transition ${
                          floor === el ? "bg-rose-900 text-white" : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-100"
                        }`}
                      >
                        {el}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFloor("None")}
                      className={`text-[10px] px-2.5 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                        floor === "None" ? "bg-rose-900 text-white shadow-xs" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      <Ban className="w-3 h-3" />
                      <span>None</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-rose-900 font-semibold block">
                    {floor === "None" ? (
                      <span className="text-rose-800 font-medium">Status: None (Omitted from estate view)</span>
                    ) : (
                      <>Sub-label: &quot;{nicheConfig.elevationSublabel}&quot;</>
                    )}
                  </span>
                </div>
              </div>

              {/* LIVE ARCHITECTURAL PREVIEW CARD (Mirrors the live estate details page) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-stone-950 text-white border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Live Estate Specification Preview ({nicheConfig.nicheTitle})</span>
                  </span>
                  <span className="text-[10px] text-stone-400">Renders on Property Details Page</span>
                </div>

                {((bedrooms !== "" && bedrooms !== 0) ||
                  (bathrooms !== "" && bathrooms !== 0) ||
                  (superBuiltUpArea && superBuiltUpArea !== "None" && superBuiltUpArea !== "N/A") ||
                  (carpetArea && carpetArea !== "None" && carpetArea !== "N/A") ||
                  (parking && parking !== "None" && parking !== "N/A") ||
                  (facing && facing !== "None" && facing !== "N/A") ||
                  (handoverStatus && handoverStatus !== "None" && handoverStatus !== "N/A") ||
                  (powerBackup && powerBackup !== "None" && powerBackup !== "N/A") ||
                  (waterSupply && waterSupply !== "None" && waterSupply !== "N/A") ||
                  (estateSecurity && estateSecurity !== "None" && estateSecurity !== "N/A") ||
                  (floor && floor !== "None" && floor !== "N/A")) ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
                    {bedrooms !== "" && bedrooms !== 0 && (
                      <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-center">
                        <Bed className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                        <div className="text-xs font-black text-white">{bedrooms} Suites</div>
                        <div className="text-[9px] text-stone-300">{nicheConfig.suitesSublabel}</div>
                      </div>
                    )}

                    {bathrooms !== "" && bathrooms !== 0 && (
                      <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-center">
                        <Bath className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                        <div className="text-xs font-black text-white">{bathrooms} Baths</div>
                        <div className="text-[9px] text-stone-300">{nicheConfig.bathsSublabel}</div>
                      </div>
                    )}

                    {superBuiltUpArea && superBuiltUpArea !== "None" && superBuiltUpArea !== "N/A" && (
                      <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-center">
                        <Square className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                        <div className="text-xs font-black text-white truncate">{superBuiltUpArea}</div>
                        <div className="text-[9px] text-stone-300">{nicheConfig.areaSublabel}</div>
                      </div>
                    )}

                    {carpetArea && carpetArea !== "None" && carpetArea !== "N/A" && (
                      <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-center">
                        <Square className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                        <div className="text-xs font-black text-white truncate">{carpetArea}</div>
                        <div className="text-[9px] text-stone-300">{nicheConfig.carpetSublabel}</div>
                      </div>
                    )}

                    {parking && parking !== "None" && parking !== "N/A" && (
                      <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-center">
                        <Car className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                        <div className="text-xs font-black text-white truncate">{parking}</div>
                        <div className="text-[9px] text-stone-300">{nicheConfig.parkingSublabel}</div>
                      </div>
                    )}

                    {facing && facing !== "None" && facing !== "N/A" && (
                      <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-center">
                        <Compass className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <div className="text-xs font-black text-white truncate">{facing}</div>
                        <div className="text-[9px] text-stone-300">{nicheConfig.orientationSublabel}</div>
                      </div>
                    )}

                    {handoverStatus && handoverStatus !== "None" && handoverStatus !== "N/A" && (
                      <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-center">
                        <Calendar className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                        <div className="text-xs font-black text-white truncate">{handoverStatus}</div>
                        <div className="text-[9px] text-stone-300">{nicheConfig.handoverSublabel}</div>
                      </div>
                    )}

                    {powerBackup && powerBackup !== "None" && powerBackup !== "N/A" && (
                      <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-center">
                        <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                        <div className="text-xs font-black text-white truncate">{powerBackup}</div>
                        <div className="text-[9px] text-stone-300">{nicheConfig.powerSublabel}</div>
                      </div>
                    )}

                    {waterSupply && waterSupply !== "None" && waterSupply !== "N/A" && (
                      <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-center">
                        <Droplets className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                        <div className="text-xs font-black text-white truncate">{waterSupply}</div>
                        <div className="text-[9px] text-stone-300">{nicheConfig.waterSublabel}</div>
                      </div>
                    )}

                    {estateSecurity && estateSecurity !== "None" && estateSecurity !== "N/A" && (
                      <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-center">
                        <Shield className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <div className="text-xs font-black text-white truncate">{estateSecurity}</div>
                        <div className="text-[9px] text-stone-300">{nicheConfig.securitySublabel}</div>
                      </div>
                    )}

                    {floor && floor !== "None" && floor !== "N/A" && (
                      <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-center">
                        <Home className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                        <div className="text-xs font-black text-white truncate">{floor}</div>
                        <div className="text-[9px] text-stone-300">{nicheConfig.elevationSublabel}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-5 px-4 rounded-xl bg-white/5 border border-dashed border-white/20 text-center space-y-2">
                    <div className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
                      <Ban className="w-3.5 h-3.5 text-rose-400" />
                      <span>All Architectural Specifications Set to &quot;None&quot;</span>
                    </div>
                    <p className="text-[11px] text-stone-300 max-w-md mx-auto">
                      No specification badge cards will be displayed on the property details page. Ideal for plots, land parcels, or unconstructed tracts.
                    </p>
                    <button
                      type="button"
                      onClick={handleRestoreNicheDefaults}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-rose-900/80 hover:bg-rose-900 px-3 py-1.5 rounded-lg transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore {nicheConfig.nicheTitle} Defaults
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 4. IMAGES & VISUALS (With Auto WebP Conversion & Storage Optimization) */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-900 text-white text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <div>
                  <h3 className="font-serif font-bold text-sm text-stone-900 uppercase tracking-wide flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-rose-800" />
                    <span>Property Images & Gallery (Auto WebP Optimization)</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Drag & drop or select photos. Automatically converts to WebP with 85–95% file size reduction and crystal-clear visual quality.
                  </p>
                </div>
              </div>

              <ImageUploadManager
                images={images}
                onChange={setImages}
                label="Estate Gallery & Visual Assets"
                helperText="Upload any camera or phone photo. Click 'SEO' on any thumbnail to configure Alt text, AI Search & AEO descriptions, and 301 redirects."
                propertyContext={{
                  title: title || `${propertyType} in ${locality}, ${city}`,
                  location: `${locality}, ${city}`,
                  category,
                  price: priceOnRequest ? "Price on Request" : typeof askingPrice === "number" ? formatIndianCurrency(askingPrice) : "Price on Request",
                }}
              />
            </div>


            {/* 5. CUSTOMIZABLE AMENITIES & FEATURES */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-900 text-white text-xs font-bold flex items-center justify-center">
                    5
                  </span>
                  <h3 className="font-serif font-bold text-sm text-stone-900 uppercase tracking-wide">
                    Custom Amenities & Features
                  </h3>
                </div>
                <span className="text-xs text-stone-500">{amenities.length} selected</span>
              </div>

              <p className="text-xs text-stone-500">
                Click presets or type any custom amenity below to add it instantly to this property.
              </p>

              {/* Preset Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {COMMON_AMENITIES.map((name) => {
                  const isChecked = amenities.includes(name)
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleAmenity(name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                        isChecked
                          ? "bg-red-900 text-white border-red-900 shadow-xs"
                          : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{name}</span>
                    </button>
                  )
                })}
              </div>

              {/* Add Custom Amenity Input */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Type any custom amenity (e.g. Private Helipad, Wine Cellar, Beach Frontage)..."
                  value={newAmenityInput}
                  onChange={(e) => setNewAmenityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddCustomAmenity()
                    }
                  }}
                  className="flex-1 h-9 px-3 text-xs rounded-lg border border-stone-300"
                />
                <button
                  type="button"
                  onClick={handleAddCustomAmenity}
                  className="px-4 text-xs font-bold bg-red-900 hover:bg-red-950 text-white rounded-lg transition"
                >
                  + Add Custom
                </button>
              </div>
            </div>

            {/* 6. DESCRIPTION & EXTRA INFORMATION */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-900 text-white text-xs font-bold flex items-center justify-center">
                  6
                </span>
                <h3 className="font-serif font-bold text-sm text-stone-900 uppercase tracking-wide">
                  Description & Extra Specifications
                </h3>
              </div>
              <p className="text-xs text-stone-500">
                Detailed notes, survey numbers, land conversion details, tenancy records, and custom architectural highlights.
              </p>

              <textarea
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter comprehensive description, survey number, land conversion order details, frontage, tree inventory, tenancy details, or any special terms..."
                className="w-full p-3.5 text-xs rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 transition leading-relaxed"
              />
            </div>

            {/* 7. CUSTOM FREQUENTLY ASKED QUESTIONS (FAQS) (OPTIONAL) */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-900 text-white text-xs font-bold flex items-center justify-center">
                    7
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-stone-900 uppercase tracking-wide">
                      Custom Frequently Asked Questions (Optional)
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Customize questions and answers displayed below the Exclusive Portfolio section. Leave empty to auto-generate verified answers.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePrepopulateFaqs}
                  className="px-3 py-1.5 rounded-lg border border-red-900/30 text-red-900 hover:bg-red-50 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pre-populate Suggested FAQs</span>
                </button>
              </div>

              {/* Existing Custom FAQs List */}
              {customFaqs.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-stone-700">Configured FAQs ({customFaqs.length})</div>
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {customFaqs.map((faq, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2 relative group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-red-900 bg-red-50 px-2 py-0.5 rounded">
                            FAQ #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFaq(idx)}
                            className="text-stone-400 hover:text-red-600 text-xs p-1"
                            title="Remove FAQ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => handleUpdateFaq(idx, "question", e.target.value)}
                          placeholder="Question..."
                          className="w-full p-2 text-xs font-semibold rounded-lg border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-red-900"
                        />
                        <textarea
                          rows={2}
                          value={faq.answer}
                          onChange={(e) => handleUpdateFaq(idx, "answer", e.target.value)}
                          placeholder="Answer..."
                          className="w-full p-2 text-xs rounded-lg border border-stone-200 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-red-900"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New FAQ Inputs */}
              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-2.5">
                <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-red-900" />
                  <span>Add a Custom Question & Answer</span>
                </div>
                <input
                  type="text"
                  value={newFaqQuestion}
                  onChange={(e) => setNewFaqQuestion(e.target.value)}
                  placeholder="e.g. Is clear freehold title guaranteed?"
                  className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-red-900"
                />
                <textarea
                  rows={2}
                  value={newFaqAnswer}
                  onChange={(e) => setNewFaqAnswer(e.target.value)}
                  placeholder="e.g. Yes, 100% unencumbered freehold title vetted by tier-1 legal counsel."
                  className="w-full p-2 text-xs rounded-lg border border-stone-300 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-red-900"
                />
                <button
                  type="button"
                  onClick={handleAddFaq}
                  disabled={!newFaqQuestion.trim() || !newFaqAnswer.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-red-900 hover:bg-red-950 text-white text-xs font-bold transition disabled:opacity-40 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add FAQ</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-red-900 via-rose-900 to-red-950 hover:from-red-950 hover:to-black text-white text-sm font-bold uppercase tracking-wider shadow-lg shadow-red-950/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Saving Custom Specifications to PostgreSQL...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Publish Estate to PostgreSQL Database</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Admin Quick Share Modal */}
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
