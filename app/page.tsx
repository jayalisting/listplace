"use client"

import {
  Search,
  MapPin,
  Menu,
  Moon,
  Sun,
  Phone,
  ArrowRight,
  Share2,
  Sparkles,
  RotateCcw,
  Building2,
  Home,
  Factory,
  TreePine,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
  const [sharingProperty, setSharingProperty] = useState<LuxuryProperty | null>(null)
  const [activeCategory, setActiveCategory] = useState<"all" | "residential" | "commercial" | "industrial" | "agriculture">("all")
  const [searchCity, setSearchCity] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

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
      .catch((err) => console.log("Using cached properties:", err))
  }, [])

  // Filter properties by Property Type, Location option, and Search Keyword
  const filteredProperties = properties.filter((property) => {
    if (property.visibility === "private") return false
    if (activeCategory !== "all" && property.category !== activeCategory) return false

    // Location dropdown filter
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
          haystack.includes("moodbidri") ||
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

    // Keyword search filter
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

      const words = q.split(/\s+/).filter(Boolean)
      const allWordsMatch = words.every((w) => haystack.includes(w))
      if (!allWordsMatch) return false
    }

    return true
  })

  const resetFilters = () => {
    setActiveCategory("all")
    setSearchCity("all")
    setSearchQuery("")
  }

  const isFiltered = activeCategory !== "all" || searchCity !== "all" || searchQuery.trim() !== ""

  const propertyTypePills = [
    { label: "All Types", val: "all" },
    { label: "Residential", val: "residential" },
    { label: "Commercial", val: "commercial" },
    { label: "Industrial", val: "industrial" },
    { label: "Agricultural", val: "agriculture" },
  ] as const

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* Simple Top Navigation */}
        <header className="border-b border-rose-900/15 dark:border-rose-900/30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md sticky top-0 z-40">
          <div className="container mx-auto px-4 py-2.5 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              {/* Menu & Brand Logo */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-900 dark:text-rose-300 p-2"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>

                <Link href="/" className="flex items-center space-x-2.5 group">
                  <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
                    <Image
                      src="/logo.png"
                      alt="JayaListing Emblem"
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

              {/* Navigation by Property Type */}
              <nav className="hidden lg:flex items-center space-x-5 text-xs font-bold text-gray-700 dark:text-gray-300">
                <Link href="/residential" className="hover:text-rose-900 dark:hover:text-rose-400 transition-colors">
                  Residential
                </Link>
                <Link href="/commercial" className="hover:text-rose-900 dark:hover:text-rose-400 transition-colors">
                  Commercial
                </Link>
                <Link href="/industrial" className="hover:text-rose-900 dark:hover:text-rose-400 transition-colors">
                  Industrial
                </Link>
                <Link href="/agriculture" className="hover:text-rose-900 dark:hover:text-rose-400 transition-colors">
                  Agricultural
                </Link>
              </nav>

              {/* Action Buttons */}
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
                  <span>+91 82965 30609</span>
                </a>

                <a
                  href="https://wa.me/918296530609?text=Hello%20JayaListing%2C%20I%20am%20inquiring%20about%20properties"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-sm transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Clean, Modern, Short Hero Section */}
        <section className="relative bg-gradient-to-b from-stone-950 via-rose-950 to-slate-950 text-white py-8 sm:py-14 px-4 border-b border-rose-900/20">
          <div className="container mx-auto max-w-4xl text-center space-y-2 sm:space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-900/50 border border-amber-400/30 text-amber-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Verified Properties & Land
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-sm">
              Find Your Next Property
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto">
              Select your location and property type to view verified residential, commercial, industrial, and agricultural opportunities.
            </p>

            {/* Simple Integrated Search & Filter Card */}
            <div className="pt-3 sm:pt-5">
              <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xl border border-rose-900/20 text-gray-900 dark:text-white max-w-3xl mx-auto space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-2.5">
                  {/* Search Input */}
                  <div className="sm:col-span-5 relative flex items-center">
                    <Search className="absolute left-3 w-4 h-4 text-rose-900 dark:text-rose-400" />
                    <Input
                      placeholder="Search title, landmark, area..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 h-10 sm:h-11 text-xs font-medium rounded-xl border-stone-200 dark:border-gray-700 bg-stone-50 dark:bg-gray-800"
                    />
                  </div>

                  {/* Location Option Selector */}
                  <div className="sm:col-span-4 relative">
                    <select
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      className="w-full h-10 sm:h-11 px-3 rounded-xl border border-stone-200 dark:border-gray-700 bg-stone-50 dark:bg-gray-800 text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
                    >
                      <option value="all">📍 All Locations</option>
                      <option value="DK">📍 DK (Dakshina Kannada / Moodbidri)</option>
                      <option value="Udupi">📍 Udupi / Manipal</option>
                      <option value="Mangalore">📍 Mangaluru</option>
                      <option value="Bangalore">📍 Bangalore</option>
                      <option value="Mumbai">📍 Mumbai</option>
                      <option value="Chikmagalur">📍 Chikmagalur</option>
                    </select>
                  </div>

                  {/* Property Type Option Selector */}
                  <div className="sm:col-span-3 relative">
                    <select
                      value={activeCategory}
                      onChange={(e) => setActiveCategory(e.target.value as any)}
                      className="w-full h-10 sm:h-11 px-3 rounded-xl border border-stone-200 dark:border-gray-700 bg-stone-50 dark:bg-gray-800 text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
                    >
                      <option value="all">🏢 All Property Types</option>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="agriculture">Agricultural</option>
                    </select>
                  </div>
                </div>

                {/* Quick Property Type Option Pills */}
                <div className="pt-2.5 border-t border-stone-100 dark:border-gray-800 flex items-center justify-between gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                  <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none">
                    {propertyTypePills.map((pill) => {
                      const isActive = activeCategory === pill.val
                      return (
                        <button
                          key={pill.val}
                          type="button"
                          onClick={() => setActiveCategory(pill.val)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                            isActive
                              ? "bg-rose-900 text-white shadow-sm"
                              : "bg-stone-100 dark:bg-gray-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-gray-700"
                          }`}
                        >
                          {pill.label}
                        </button>
                      )
                    })}
                  </div>

                  {isFiltered && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-[11px] font-bold text-rose-900 dark:text-rose-400 hover:underline flex items-center gap-1 shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Clean Property Catalog Section */}
        <section className="container mx-auto px-4 py-8 sm:py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                Available Properties
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Showing {filteredProperties.length} verified listings
              </p>
            </div>

            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="text-xs font-semibold h-8 border-rose-900/30 text-rose-900 dark:text-rose-300"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Properties Grid */}
          {filteredProperties.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white dark:bg-gray-900 rounded-3xl border border-stone-200 dark:border-gray-800 p-6">
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">No properties match your selection</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Try switching the location or property type filter to explore more available listings.
              </p>
              <Button
                onClick={resetFilters}
                size="sm"
                className="bg-rose-900 hover:bg-rose-950 text-white text-xs font-bold rounded-xl"
              >
                View All Properties
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filteredProperties.map((property) => (
                <Card
                  key={property.id}
                  onClick={() => router.push(`/property/${property.id}`)}
                  className="overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-2xl group flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Image Container */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                      <Image
                        src={property.images[0]}
                        alt={property.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />

                      {/* Property Type Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-black/75 backdrop-blur-md text-white border border-white/20">
                          {property.propertyType}
                        </span>
                      </div>

                      {/* Share Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSharingProperty(property)
                        }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-amber-400 transition"
                        title="Share Property"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Price Tag Overlay */}
                      <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md text-white font-extrabold text-sm sm:text-base px-3 py-1 rounded-xl border border-rose-900/30">
                        <span className="text-amber-300">{property.price}</span>
                        {property.priceSuffix && (
                          <span className="text-xs font-normal text-gray-300 ml-1">
                            {property.priceSuffix}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <CardContent className="p-4 sm:p-5 space-y-2">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-rose-900 dark:group-hover:text-rose-400 transition-colors">
                          {property.title}
                        </h3>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-800 dark:text-rose-400 mr-1 shrink-0" />
                          <span className="truncate">{property.location}</span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {property.tagline}
                      </p>

                      {/* Quick Specs */}
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 font-medium">
                        <span>{property.area && property.area !== "None" ? property.area : property.propertyType}</span>
                        {property.bedrooms && property.bedrooms > 0 ? (
                          <span>{property.bedrooms} Beds</span>
                        ) : (
                          <span>{property.city}</span>
                        )}
                      </div>
                    </CardContent>
                  </div>

                  {/* Card Action */}
                  <div className="p-4 sm:p-5 pt-0">
                    <Button
                      onClick={() => router.push(`/property/${property.id}`)}
                      className="w-full h-9 sm:h-10 bg-rose-900 hover:bg-rose-950 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Short & Clean Direct Contact Strip */}
        <section className="container mx-auto px-4 py-8">
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-rose-950 via-slate-950 to-black border border-rose-900/30 p-5 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-base sm:text-lg font-bold">Looking for a Specific Land or Property?</h3>
              <p className="text-xs text-stone-300">
                Contact our concierge desk directly for verified land, residential, and commercial acquisitions.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href="https://wa.me/918296530609?text=Hello%20JayaListing%2C%20I%20have%20a%20property%20requirement"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold transition shadow"
              >
                WhatsApp Concierge
              </a>
              <a
                href="tel:+918296530609"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition"
              >
                Call: +91 82965 30609
              </a>
            </div>
          </div>
        </section>

        {/* Property Share Modal */}
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
