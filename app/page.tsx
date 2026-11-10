"use client"

import {
  Search,
  MapPin,
  TrendingUp,
  Users,
  Building,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sparkles,
  Shield,
  Phone,
  Bed,
  Bath,
  Square,
  Award,
  ArrowRight,
  CheckCircle2,
  Lock,
  SlidersHorizontal,
  Home,
  Building2,
  Factory,
  TreePine,
  Share2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import Footer from "@/components/footer"
import SlidingSidebar from "@/components/sliding-sidebar"
import PropertyShareModal from "@/components/property-share-modal"
import { LUXURY_PROPERTIES, LuxuryProperty } from "@/lib/luxury-properties"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [sharingProperty, setSharingProperty] = useState<LuxuryProperty | null>(null)
  // STRICT SEQUENCE: all -> residential -> commercial -> industrial -> agriculture
  const [activeCategory, setActiveCategory] = useState<"all" | "residential" | "commercial" | "industrial" | "agriculture">("all")
  const [searchCity, setSearchCity] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [priceTier, setPriceTier] = useState("all")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  // Slide images in strict sequence: Residential -> Commercial -> Industrial -> Agricultural
  const slideImages = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=85",
      title: "The Billionaires' Sky Penthouse",
      subtitle: "Unobstructed 360° Arabian Sea Panoramas • Altamount Road, Mumbai • ₹48.5 Cr",
      categoryName: "1. Residential Estate",
      badgeColor: "bg-blue-600 text-white",
      link: "/property/1",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=85",
      title: "The Sovereign Financial Tower (Full Level)",
      subtitle: "LEED Platinum Institutional Headquarters • G-Block BKC, Mumbai • ₹85.0 Cr",
      categoryName: "2. Commercial Trophy",
      badgeColor: "bg-amber-600 text-white",
      link: "/property/4",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1920&q=85",
      title: "The Gateway Automated Logistics Park",
      subtitle: "Grade-A 140,000 sq ft Mega Facility • Bhiwandi Express Corridor • ₹68.0 Cr",
      categoryName: "3. Industrial Logistics",
      badgeColor: "bg-purple-600 text-white",
      link: "/property/6",
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=85",
      title: "The Highland Heritage Vineyard & Estate",
      subtitle: "48-Acre Sprawling Mountain Domain • Natural Waterfall & Manor • ₹18.5 Cr",
      categoryName: "4. Agricultural Farmland",
      badgeColor: "bg-emerald-600 text-white",
      link: "/property/8",
    },
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slideImages.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slideImages.length) % slideImages.length)
  }

  useEffect(() => {
    const timer = setInterval(nextSlide, 6500)
    return () => clearInterval(timer)
  }, [])

  const [properties, setProperties] = useState<LuxuryProperty[]>(() =>
    LUXURY_PROPERTIES.filter((p) => p.visibility !== "private")
  )

  useEffect(() => {
    fetch(`/api/properties?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    })
      .then(async (res) => {
        if (!res.ok) return null
        const ct = res.headers.get("content-type") || ""
        if (!ct.includes("application/json")) return null
        return res.json()
      })
      .then((data) => {
        if (data && data.success && Array.isArray(data.data)) {
          setProperties(data.data.filter((p: LuxuryProperty) => p.visibility !== "private"))
        }
      })
      .catch((err) => console.log("Using cached luxury properties:", err))
  }, [])

  // Filter properties in strict order
  const filteredProperties = properties.filter((property) => {
    if (property.visibility === "private") return false
    if (activeCategory !== "all" && property.category !== activeCategory) return false

    // Search by Micro-Market / City / District
    if (searchCity !== "all") {
      const target = searchCity.toLowerCase()
      const haystack = (
        (property.city || "") + " " +
        (property.location || "") + " " +
        (property.state || "") + " " +
        (property.title || "") + " " +
        (property.tags || []).join(" ")
      ).toLowerCase()

      if (target === "dk" || target.includes("dakshina")) {
        const isDkMatch =
          haystack.includes("dk") ||
          haystack.includes("dakshina") ||
          haystack.includes("mangal") ||
          haystack.includes("belthangady") ||
          haystack.includes("panambur") ||
          haystack.includes("baikampady") ||
          haystack.includes("kadri") ||
          haystack.includes("bejai") ||
          haystack.includes("surathkal") ||
          haystack.includes("bantwal") ||
          haystack.includes("puttur") ||
          haystack.includes("sullia") ||
          haystack.includes("ullal") ||
          haystack.includes("mulki")
        if (!isDkMatch) return false
      } else if (target === "udupi") {
        const isUdupiMatch =
          haystack.includes("udupi") ||
          haystack.includes("manipal") ||
          haystack.includes("malpe") ||
          haystack.includes("kundapur") ||
          haystack.includes("karkala") ||
          haystack.includes("kaup") ||
          haystack.includes("hebri") ||
          haystack.includes("byndoor")
        if (!isUdupiMatch) return false
      } else if (target === "mangalore" || target === "mangaluru") {
        const isMangalMatch =
          haystack.includes("mangal") ||
          haystack.includes("kadri") ||
          haystack.includes("panambur") ||
          haystack.includes("baikampady") ||
          haystack.includes("bejai")
        if (!isMangalMatch) return false
      } else {
        if (!haystack.includes(target)) return false
      }
    }

    // Free text query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const haystack = (
        (property.title || "") + " " +
        (property.location || "") + " " +
        (property.city || "") + " " +
        (property.state || "") + " " +
        (property.propertyType || "") + " " +
        (property.tagline || "") + " " +
        (property.tags || []).join(" ")
      ).toLowerCase()

      if (q === "dk" || q === "d.k" || q === "d.k.") {
        const isDkMatch =
          haystack.includes("dk") ||
          haystack.includes("dakshina") ||
          haystack.includes("mangal") ||
          haystack.includes("belthangady") ||
          haystack.includes("panambur") ||
          haystack.includes("kadri")
        if (!isDkMatch) return false
      } else if (q === "udupi") {
        const isUdupiMatch =
          haystack.includes("udupi") ||
          haystack.includes("manipal") ||
          haystack.includes("malpe") ||
          haystack.includes("kundapur") ||
          haystack.includes("karkala")
        if (!isUdupiMatch) return false
      } else {
        const words = q.split(/\s+/).filter(Boolean)
        const allWordsMatch = words.every((w) => haystack.includes(w))
        if (!allWordsMatch) return false
      }
    }

    if (priceTier === "tier-1" && property.priceNumeric > 20) return false
    if (priceTier === "tier-2" && (property.priceNumeric <= 20 || property.priceNumeric > 45)) return false
    if (priceTier === "tier-3" && property.priceNumeric <= 45) return false
    return true
  })

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const el = document.getElementById("luxury-catalog")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Distinct category badge styling while maintaining royal red base
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case "residential":
        return {
          badge: "bg-blue-950/80 text-blue-300 border-blue-500/40",
          pillActive: "bg-blue-600 text-white shadow-md shadow-blue-600/30",
          iconColor: "text-blue-500 dark:text-blue-400",
          placeColor: "text-blue-600 dark:text-blue-400",
          placeBadge: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-500/20",
          amenityBadge: "bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border-blue-500/20",
          amenityIcon: "text-blue-600 dark:text-blue-400",
          name: "Residential",
        }
      case "commercial":
        return {
          badge: "bg-amber-950/80 text-amber-300 border-amber-500/40",
          pillActive: "bg-amber-600 text-white shadow-md shadow-amber-600/30",
          iconColor: "text-amber-500 dark:text-amber-400",
          placeColor: "text-amber-600 dark:text-amber-400",
          placeBadge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20",
          amenityBadge: "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-500/20",
          amenityIcon: "text-amber-600 dark:text-amber-400",
          name: "Commercial",
        }
      case "industrial":
        return {
          badge: "bg-purple-950/80 text-purple-300 border-purple-500/40",
          pillActive: "bg-purple-600 text-white shadow-md shadow-purple-600/30",
          iconColor: "text-purple-500 dark:text-purple-400",
          placeColor: "text-purple-600 dark:text-purple-400",
          placeBadge: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-500/20",
          amenityBadge: "bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 border border-purple-500/20",
          amenityIcon: "text-purple-600 dark:text-purple-400",
          name: "Industrial",
        }
      case "agriculture":
        return {
          badge: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40",
          pillActive: "bg-emerald-600 text-white shadow-md shadow-emerald-600/30",
          iconColor: "text-emerald-500 dark:text-emerald-400",
          placeColor: "text-emerald-600 dark:text-emerald-400",
          placeBadge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
          amenityBadge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-500/20",
          amenityIcon: "text-emerald-600 dark:text-emerald-400",
          name: "Agricultural",
        }
      default:
        return {
          badge: "bg-rose-950/80 text-rose-300 border-rose-500/40",
          pillActive: "bg-rose-900 text-white shadow-md shadow-rose-900/30",
          iconColor: "text-rose-500 dark:text-rose-400",
          placeColor: "text-rose-600 dark:text-rose-400",
          placeBadge: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-500/20",
          amenityBadge: "bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border border-rose-900/15",
          amenityIcon: "text-rose-700 dark:text-rose-400",
          name: "All",
        }
    }
  }

  const stats = [
    { icon: Building, label: "Private Asset Portfolio", value: "₹4,850+ Cr" },
    { icon: Users, label: "UHNWI & Family Offices", value: "1,400+ Clients" },
    { icon: MapPin, label: "Prime Micro-Markets", value: "Mumbai, Bangalore, DK & Goa" },
    { icon: TrendingUp, label: "Average Capital CAGR", value: "11.4% Annual" },
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* Luxury Top Navigation - Royal Red / Maroon Theme */}
        <header className="border-b border-rose-900/20 dark:border-rose-900/30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
          <div className="container mx-auto px-4 py-2.5 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              {/* Left Section - Menu + Logo */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-900 dark:text-rose-300 p-2"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>

                <Link href="/" className="flex items-center space-x-2.5 group">
                  {/* Royal Emblem */}
                  <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
                    <Image
                      src="/logo.png"
                      alt="JayaListing Royal Emblem"
                      width={40}
                      height={40}
                      priority
                      className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)] transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 dark:from-rose-400 dark:via-red-300 dark:to-rose-400 bg-clip-text text-transparent">
                      JayaListing
                    </div>
                    <div className="text-[8px] sm:text-[9px] tracking-widest uppercase font-bold text-rose-900 dark:text-rose-400 leading-none">
                      Royal Estates
                    </div>
                  </div>
                </Link>
              </div>

              {/* Center - Strict 4 Categories Order: Residential -> Commercial -> Industrial -> Agricultural */}
              <nav className="hidden lg:flex items-center space-x-5 text-xs font-bold text-gray-700 dark:text-gray-300">
                <Link
                  href="/residential"
                  className="flex items-center space-x-1.5 hover:text-blue-600 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>Residential</span>
                </Link>
                <Link
                  href="/commercial"
                  className="flex items-center space-x-1.5 hover:text-amber-600 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Commercial</span>
                </Link>
                <Link
                  href="/industrial"
                  className="flex items-center space-x-1.5 hover:text-purple-600 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  <span>Industrial</span>
                </Link>
                <Link
                  href="/agriculture"
                  className="flex items-center space-x-1.5 hover:text-emerald-600 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>Agricultural</span>
                </Link>
              </nav>

              {/* Right Section */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleTheme}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-600 dark:text-gray-300 transition-colors"
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-rose-900" />}
                </button>

                <a
                  href="tel:+918296530609"
                  className="hidden md:inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-rose-900/10 text-rose-900 dark:text-rose-300 hover:bg-rose-900/20 border border-rose-900/30 transition-all"
                >
                  <Phone className="w-3 h-3 text-rose-800 dark:text-rose-400" />
                  <span>Contact Us: +91 82965 30609</span>
                </a>

                <a
                  href="https://wa.me/918296530609?text=Hello%20JayaListing%20Team%2C%20I%20am%20interested%20in%20your%20portfolio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-md shadow-[#25D366]/20 transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-white" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Slideshow Section - COMPACT ON MOBILE to eliminate excessive scroll */}
        <section className="relative overflow-hidden bg-black text-white">
          <div className="relative h-[250px] sm:h-[380px] lg:h-[580px]">
            {slideImages.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  className="object-cover scale-105 transition-transform duration-10000 ease-out"
                  sizes="100vw"
                />

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-black/45 to-black/35" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-4 sm:px-8">
                    <div className="max-w-xl space-y-2 sm:space-y-3">
                      <div className="inline-flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${slide.badgeColor}`}>
                          {slide.categoryName}
                        </span>
                        <span className="hidden sm:inline-flex items-center text-[11px] font-semibold text-rose-300">
                          <Sparkles className="w-3 h-3 mr-1 text-amber-300" />
                          Royal Red Collection
                        </span>
                      </div>

                      <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                        {slide.title}
                      </h1>

                      <p className="text-xs sm:text-sm md:text-base text-gray-200 line-clamp-1 sm:line-clamp-2">
                        {slide.subtitle}
                      </p>

                      <div className="pt-1 flex items-center gap-2">
                        <Link href={slide.link}>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-rose-800 via-red-800 to-rose-900 hover:from-rose-900 text-white font-bold rounded-lg sm:rounded-xl text-xs px-3.5 py-1.5 h-8 sm:h-9 shadow-lg shadow-rose-900/40 border border-amber-400/30"
                          >
                            Explore Dossier
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                          </Button>
                        </Link>

                        <button
                          onClick={() => {
                            const el = document.getElementById("luxury-catalog")
                            if (el) el.scrollIntoView({ behavior: "smooth" })
                          }}
                          className="px-3 py-1.5 h-8 sm:h-9 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-md border border-white/20 transition-all flex items-center"
                        >
                          View Estates ({properties.length})
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Slider Controls */}
          <button
            onClick={prevSlide}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all z-20"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all z-20"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 z-20">
            {slideImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentSlide ? "w-6 bg-red-500" : "w-1.5 bg-white/40"
                }`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Compact Royal Red Search & Category Filter Bar */}
        <div className="relative -mt-6 sm:-mt-10 z-30 container mx-auto px-3 sm:px-4">
          <form
            onSubmit={handleHeroSearch}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl border border-rose-900/25 dark:border-rose-900/40 max-w-5xl mx-auto"
          >
            {/* Quick Search Row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-800 dark:text-rose-400" />
                <Input
                  placeholder="Search Altamount, BKC, Mangalore, Coffee Estates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 h-10 sm:h-11 text-xs font-medium rounded-xl border-rose-900/20 dark:border-rose-900/40 bg-slate-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Mobile Filter Toggle */}
              <button
                type="button"
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className={`sm:hidden h-10 px-3 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  isFilterExpanded
                    ? "bg-rose-900 border-rose-900 text-white"
                    : "border-rose-900/30 bg-rose-50/50 dark:bg-gray-800 text-rose-900 dark:text-rose-300"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>

              {/* Desktop Direct Search Button - Royal Red */}
              <Button
                type="submit"
                className="hidden sm:inline-flex h-11 bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 hover:from-rose-950 hover:to-red-950 text-white rounded-xl font-bold text-xs px-5 shadow-md shadow-rose-900/30 border border-amber-400/20"
              >
                <Search className="w-4 h-4 mr-1.5" />
                Search ({filteredProperties.length})
              </Button>
            </div>

            {/* Desktop Filters / Mobile Collapsible Filters */}
            <div
              className={`mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 ${
                isFilterExpanded ? "block" : "hidden sm:grid"
              }`}
            >
              {/* Micro-Market */}
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                  Micro-Market
                </label>
                <select
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-gray-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="all">All Prime Regions</option>
                  <option value="DK">DK (Dakshina Kannada / Mangaluru)</option>
                  <option value="Udupi">Udupi (Manipal, Malpe, Coastal)</option>
                  <option value="Mangalore">Mangaluru / Mangalore</option>
                  <option value="Mumbai">Mumbai (Altamount, BKC, Worli)</option>
                  <option value="Bangalore">Bangalore (Whitefield, UB City)</option>
                  <option value="Chikmagalur">Chikmagalur (Western Ghats)</option>
                </select>
              </div>

              {/* Price Tier Selection */}
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                  Capital Allocation
                </label>
                <select
                  value={priceTier}
                  onChange={(e) => setPriceTier(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="all">All Budgets (₹10 Cr+)</option>
                  <option value="tier-1">₹10 Cr to ₹20 Cr</option>
                  <option value="tier-2">₹20 Cr to ₹45 Cr</option>
                  <option value="tier-3">₹45 Cr to ₹150 Cr+</option>
                </select>
              </div>

              {/* Submit CTA on mobile when expanded */}
              <div className="sm:hidden">
                <Button
                  type="submit"
                  className="w-full h-10 bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 text-white rounded-xl font-bold text-xs"
                >
                  Apply Filters ({filteredProperties.length})
                </Button>
              </div>
            </div>

            {/* Quick Location Filter Chips (DK, Udupi, Mangalore, Mumbai, Bangalore) */}
            <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0 mr-1">Locations:</span>
              {[
                { label: "All Regions", val: "all" },
                { label: "📍 DK (Dakshina Kannada)", val: "DK" },
                { label: "🌊 Udupi", val: "Udupi" },
                { label: "Mangaluru", val: "Mangalore" },
                { label: "Mumbai", val: "Mumbai" },
                { label: "Bangalore", val: "Bangalore" },
              ].map((loc) => (
                <button
                  key={loc.val}
                  type="button"
                  onClick={() => setSearchCity(loc.val)}
                  className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                    searchCity === loc.val
                      ? "bg-rose-900 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  }`}
                >
                  {loc.label}
                </button>
              ))}
            </div>

            {/* Quick Filter Horizontal Scroll Chips - ALWAYS IN ORDER:
                1. Residential (Blue)
                2. Commercial (Amber)
                3. Industrial (Purple)
                4. Agricultural (Emerald)
            */}
            <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              {/* All Trophy Assets */}
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`text-[11px] sm:text-xs px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all flex-shrink-0 flex items-center space-x-1.5 ${
                  activeCategory === "all"
                    ? "bg-rose-900 text-white shadow-md shadow-rose-900/30"
                    : "bg-slate-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-rose-50"
                }`}
              >
                <span>✦ All Portfolios</span>
              </button>

              {/* 1. Residential (Blue Accent) */}
              <button
                type="button"
                onClick={() => setActiveCategory("residential")}
                className={`text-[11px] sm:text-xs px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all flex-shrink-0 flex items-center space-x-1.5 ${
                  activeCategory === "residential"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 hover:bg-blue-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>1. Residential</span>
              </button>

              {/* 2. Commercial (Amber Accent) */}
              <button
                type="button"
                onClick={() => setActiveCategory("commercial")}
                className={`text-[11px] sm:text-xs px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all flex-shrink-0 flex items-center space-x-1.5 ${
                  activeCategory === "commercial"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 hover:bg-amber-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>2. Commercial</span>
              </button>

              {/* 3. Industrial (Purple Accent) */}
              <button
                type="button"
                onClick={() => setActiveCategory("industrial")}
                className={`text-[11px] sm:text-xs px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all flex-shrink-0 flex items-center space-x-1.5 ${
                  activeCategory === "industrial"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900 hover:bg-purple-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>3. Industrial</span>
              </button>

              {/* 4. Agricultural (Emerald Accent) */}
              <button
                type="button"
                onClick={() => setActiveCategory("agriculture")}
                className={`text-[11px] sm:text-xs px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all flex-shrink-0 flex items-center space-x-1.5 ${
                  activeCategory === "agriculture"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>4. Agricultural</span>
              </button>
            </div>
          </form>
        </div>

        {/* First Listings Appear Immediately Right Here! */}
        <section id="luxury-catalog" className="container mx-auto px-4 pt-8 pb-12 sm:py-12">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-[11px] uppercase font-extrabold tracking-wider text-rose-900 dark:text-rose-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Royal Red Trophy Showcase</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Curated Private Estates & Trophy Assets
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {filteredProperties.length} verified luxury assets organized by Residential, Commercial, Industrial & Agricultural
              </p>
            </div>
          </div>

          {/* Properties Grid - Each Card has Distinct Category Badge while Base Theme is Royal Red */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProperties.map((property, idx) => {
              const theme = getCategoryTheme(property.category)
              return (
                <Card
                  key={property.id}
                  onClick={() => router.push(`/property/${property.id}`)}
                  className="overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-gray-900 border border-rose-900/15 dark:border-rose-900/30 rounded-2xl sm:rounded-3xl group flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Photo Container */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                      <Image
                        src={property.images[0]}
                        alt={property.title}
                        fill
                        priority={idx === 0}
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />

                      {/* Category Badge with DISTINCT COLOR */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold backdrop-blur-md border ${theme.badge}`}>
                          {property.propertyType}
                        </span>
                        {property.isExclusive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-900 text-white">
                            Exclusive
                          </span>
                        )}
                      </div>

                      {/* Share Button Overlay */}
                      <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setSharingProperty(property)
                          }}
                          className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-amber-400 transition-colors shadow-sm"
                          title="Share Property (Public or Private VIP)"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Price Tag Overlay - Royal Red Accent */}
                      <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md text-white font-black text-lg sm:text-xl px-3 py-1 rounded-xl border border-rose-900/40 shadow-lg">
                        <span className="text-amber-200">{property.price}</span>
                        {property.priceSuffix && (
                          <span className="text-xs font-normal text-gray-300 ml-1">
                            {property.priceSuffix}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body Content */}
                    <CardContent className="p-4 sm:p-6 space-y-2.5">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-0.5">
                          {theme.name} Asset
                        </div>
                        <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white line-clamp-1 group-hover:text-rose-800 dark:group-hover:text-rose-400 transition-colors">
                          {property.title}
                        </h3>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <MapPin className={`w-3.5 h-3.5 ${theme.iconColor} mr-1 flex-shrink-0`} />
                          <span className={`truncate font-medium ${theme.placeColor}`}>{property.location}</span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {property.tagline}
                      </p>

                      {/* Key Metrics Chips */}
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] sm:text-xs text-gray-600 dark:text-gray-400">
                        {property.area && property.area !== "None" && property.area !== "N/A" ? (
                          <div className="flex items-center">
                            <Square className={`w-3.5 h-3.5 ${theme.iconColor} mr-1`} />
                            <span>{property.area}</span>
                          </div>
                        ) : (
                          <div className="flex items-center font-medium">
                            <span>{property.propertyType || "Estate Land"}</span>
                          </div>
                        )}
                        {property.bedrooms && property.bedrooms > 0 ? (
                          <div className="flex items-center">
                            <Bed className={`w-3.5 h-3.5 ${theme.iconColor} mr-1`} />
                            <span>{property.bedrooms} Suites</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 font-medium">{property.details?.facing || property.details?.age || property.state || "Karnataka"}</span>
                        )}
                        <div className={`font-bold ${theme.placeColor}`}>
                          {property.city}
                        </div>
                      </div>

                      {/* Signature Amenities for High Net-Worth Users */}
                      {((property.amenities && property.amenities.length > 0) ? property.amenities : (property.highlights || [])).length > 0 && (
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                          <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.placeColor} flex items-center gap-1`}>
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>Signature Amenities</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {((property.amenities && property.amenities.length > 0) ? property.amenities : (property.highlights || []))
                              .slice(0, 3)
                              .map((amenity, i) => (
                                <span
                                  key={i}
                                  className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md ${theme.amenityBadge} max-w-[140px] truncate`}
                                  title={amenity}
                                >
                                  <CheckCircle2 className={`w-2.5 h-2.5 mr-1 ${theme.amenityIcon} flex-shrink-0`} />
                                  <span className="truncate">{amenity}</span>
                                </span>
                              ))}
                            {((property.amenities && property.amenities.length > 0) ? property.amenities : (property.highlights || [])).length > 3 && (
                              <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                +{((property.amenities && property.amenities.length > 0) ? property.amenities : (property.highlights || [])).length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </div>

                  {/* Royal Red Action Button & Share */}
                  <div className="p-4 sm:p-6 pt-0 flex items-center gap-2">
                    <Button
                      onClick={() => router.push(`/property/${property.id}`)}
                      className="flex-1 h-10 sm:h-11 bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 hover:from-rose-950 hover:to-red-950 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/30 group-hover:shadow-rose-900/50 transition-all border border-amber-400/20"
                    >
                      Click Here
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSharingProperty(property)
                      }}
                      title="Share Property (Public / Private VIP)"
                      className="h-10 sm:h-11 px-3.5 rounded-xl border border-rose-900/20 dark:border-rose-900/40 bg-stone-100 dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-900 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all relative z-10 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-rose-800 dark:text-rose-400" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Portfolio Metrics Banner (Below Listings) */}
        <section className="container mx-auto px-4 py-8 sm:py-12 border-t border-rose-900/10 dark:border-rose-900/20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 border border-rose-900/15 dark:border-rose-900/30 shadow-sm text-center space-y-1.5 hover:border-rose-800 transition-colors"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-900/10 text-rose-900 dark:text-rose-400 flex items-center justify-center mx-auto">
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-[11px] sm:text-xs text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Private Client Advisory - Royal Maroon Background */}
        <section className="container mx-auto px-4 py-12 sm:py-16">
          <div className="rounded-3xl bg-gradient-to-br from-rose-950 via-red-950 to-black border border-rose-800/40 p-6 sm:p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-900/50 text-rose-200 border border-rose-700 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5 text-amber-300" />
                <span>Royal Red Family Office Advisory</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                Looking for an Off-Market Trophy Estate?
              </h2>

              <p className="text-xs sm:text-base text-gray-300 leading-relaxed">
                Over 60% of ultra-luxury transactions take place privately without public listings. Our Private Client Partners represent prominent family offices, industrialists, and high-net-worth investors across India and internationally.
              </p>

              <div className="pt-2 sm:pt-4 flex flex-wrap gap-3">
                <a
                  href="https://wa.me/918296530609?text=Hello%20JayaListing%20Private%20Client%20Office%2C%20I%20am%20inquiring%20about%20an%20Off-Market%20Trophy%20Estate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-slate-950 font-black text-xs shadow-xl transition-all h-10"
                >
                  <Lock className="w-3.5 h-3.5 mr-1.5" />
                  Request Off-Market Private Dossier
                </a>

                <a
                  href="tel:+918296530609"
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all h-10"
                >
                  <Phone className="w-3.5 h-3.5 mr-2 text-rose-300" />
                  Contact Us: +91 82965 30609
                </a>
              </div>
            </div>
          </div>
        </section>

        {sharingProperty && (
          <PropertyShareModal
            property={sharingProperty}
            isOpen={!!sharingProperty}
            onClose={() => setSharingProperty(null)}
          />
        )}

        {/* Sliding Sidebar */}
        <SlidingSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}
