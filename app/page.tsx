"use client"

import {
  MapPin,
  Menu,
  Moon,
  Sun,
  Phone,
  ArrowRight,
  Share2,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import Footer from "@/components/footer"
import SlidingSidebar from "@/components/sliding-sidebar"
import PropertyShareModal from "@/components/property-share-modal"
import { LUXURY_PROPERTIES, LuxuryProperty } from "@/lib/luxury-properties"
import { useRouter } from "next/navigation"

const LOCATION_OPTIONS = [
  { label: "📍 All Locations", val: "all" },
  { label: "📍 DK / Moodbidri", val: "DK" },
  { label: "📍 Udupi / Manipal", val: "Udupi" },
  { label: "📍 Mangaluru", val: "Mangalore" },
  { label: "📍 Bangalore", val: "Bangalore" },
  { label: "📍 Mumbai", val: "Mumbai" },
  { label: "📍 Chikmagalur", val: "Chikmagalur" },
]

const PROPERTY_TYPE_OPTIONS = [
  { label: "🏢 All Types", val: "all" },
  { label: "Luxury Residential", val: "luxury_residential" },
  { label: "Small Commercial Building", val: "commercial_building" },
  { label: "Large Farm Land", val: "farm_land" },
  { label: "Mining Land", val: "mining_land" },
  { label: "Investment Properties", val: "investment" },
  { label: "Industrial & Logistics", val: "industrial" },
]

export default function HomePage() {
  const router = useRouter()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [sharingProperty, setSharingProperty] = useState<LuxuryProperty | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [searchCity, setSearchCity] = useState("all")
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

  // Filter properties by Location and Property Type
  const filteredProperties = properties.filter((property) => {
    if (property.visibility === "private") return false

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

    // Property Type filter
    if (activeCategory !== "all") {
      const text = (
        (property.category || "") + " " +
        (property.propertyType || "") + " " +
        (property.title || "") + " " +
        (property.tagline || "") + " " +
        (property.description || "") + " " +
        (property.tags || []).join(" ")
      ).toLowerCase()

      switch (activeCategory) {
        case "luxury_residential":
        case "residential":
          if (
            property.category !== "residential" &&
            !text.includes("residential") &&
            !text.includes("villa") &&
            !text.includes("penthouse") &&
            !text.includes("apartment") &&
            !text.includes("house")
          ) return false
          break
        case "commercial_building":
        case "commercial":
          if (
            property.category !== "commercial" &&
            !text.includes("commercial") &&
            !text.includes("building") &&
            !text.includes("office") &&
            !text.includes("retail") &&
            !text.includes("showroom") &&
            !text.includes("hotel")
          ) return false
          break
        case "farm_land":
        case "agriculture":
          if (
            property.category !== "agriculture" &&
            !text.includes("farm") &&
            !text.includes("plantation") &&
            !text.includes("agro") &&
            !text.includes("vineyard") &&
            !text.includes("acres") &&
            !text.includes("agricultural")
          ) return false
          break
        case "mining_land":
          if (
            !text.includes("mining") &&
            !text.includes("quarry") &&
            !text.includes("stone") &&
            !text.includes("mineral") &&
            !(property.category === "industrial" && text.includes("land"))
          ) return false
          break
        case "investment":
          if (
            !property.roi &&
            !text.includes("investment") &&
            !text.includes("cap rate") &&
            !text.includes("commercial") &&
            !text.includes("industrial")
          ) return false
          break
        case "industrial":
          if (
            property.category !== "industrial" &&
            !text.includes("industrial") &&
            !text.includes("warehouse") &&
            !text.includes("logistics") &&
            !text.includes("factory")
          ) return false
          break
        default:
          if (!text.includes(activeCategory.toLowerCase())) return false
      }
    }

    return true
  })

  const resetFilters = () => {
    setActiveCategory("all")
    setSearchCity("all")
  }

  const isFiltered = activeCategory !== "all" || searchCity !== "all"

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* Simple Top Navigation */}
        <header className="border-b border-rose-900/15 dark:border-rose-900/30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md sticky top-0 z-40">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-2.5">
            <div className="flex items-center justify-between gap-2">
              {/* Menu & Brand Logo */}
              <div className="flex items-center space-x-1.5 sm:space-x-3 shrink min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-900 dark:text-rose-300 p-1.5 sm:p-2 shrink-0"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>

                <Link href="/" className="flex items-center space-x-1.5 sm:space-x-2 group min-w-0">
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                    <Image
                      src="/logo.png"
                      alt="JayaListing Emblem"
                      width={40}
                      height={40}
                      priority
                      className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)] transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base sm:text-xl font-black tracking-tight bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 dark:from-rose-400 dark:via-red-300 dark:to-rose-400 bg-clip-text text-transparent truncate">
                      JayaListing
                    </div>
                    <div className="text-[7px] sm:text-[9px] tracking-widest uppercase font-bold text-rose-900 dark:text-rose-400 leading-none truncate">
                      Royal Estates
                    </div>
                  </div>
                </Link>
              </div>

              {/* Navigation by Property Type on Desktop */}
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

              {/* Action Buttons: Dark Mode + Phone + Mobile-Friendly WhatsApp */}
              <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
                <button
                  onClick={toggleTheme}
                  className="p-1 sm:p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-600 dark:text-gray-300 transition-colors shrink-0"
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
                  className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-sm shrink-0 whitespace-nowrap transition-all"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Short & Sweet Hero Section */}
        <section className="relative bg-gradient-to-b from-stone-950 via-rose-950 to-slate-950 text-white py-4 sm:py-6 px-3 sm:px-4 border-b border-rose-900/20">
          <div className="container mx-auto max-w-xl text-center space-y-1.5">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
              JayaListing
              <span className="block text-amber-300 text-sm sm:text-lg md:text-xl font-extrabold mt-0.5">
                #1 Properties for Top People
              </span>
            </h1>

            {/* Side-by-Side Location & Property Type Selectors */}
            <div className="pt-1.5 sm:pt-2">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-1.5 sm:p-2 shadow-lg border border-rose-900/20 text-gray-900 dark:text-white">
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {/* Location Selector */}
                  <div className="relative">
                    <select
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      className="w-full h-10 px-2 sm:px-3 rounded-xl border border-stone-200 dark:border-gray-700 bg-stone-50 dark:bg-gray-800 text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none cursor-pointer truncate"
                    >
                      {LOCATION_OPTIONS.map((loc) => (
                        <option key={loc.val} value={loc.val}>
                          {loc.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Property Type Selector */}
                  <div className="relative">
                    <select
                      value={activeCategory}
                      onChange={(e) => setActiveCategory(e.target.value)}
                      className="w-full h-10 px-2 sm:px-3 rounded-xl border border-stone-200 dark:border-gray-700 bg-stone-50 dark:bg-gray-800 text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none cursor-pointer truncate"
                    >
                      {PROPERTY_TYPE_OPTIONS.map((type) => (
                        <option key={type.val} value={type.val}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Property Listings Section */}
        <section className="container mx-auto px-3 sm:px-4 py-6 sm:py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">
                Available Properties
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                Showing {filteredProperties.length} verified listings
              </p>
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-rose-900 dark:text-rose-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Properties Grid */}
          {filteredProperties.length === 0 ? (
            <div className="py-12 text-center space-y-2.5 bg-white dark:bg-gray-900 rounded-2xl border border-stone-200 dark:border-gray-800 p-6">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                No properties match your selection
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Try switching the location or property type to view more options.
              </p>
              <Button
                onClick={resetFilters}
                size="sm"
                className="bg-rose-900 hover:bg-rose-950 text-white text-xs font-bold rounded-xl h-8"
              >
                Show All Properties
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-black/75 backdrop-blur-md text-white border border-white/20">
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
                        className="absolute top-2.5 right-2.5 p-1.5 sm:p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-amber-400 transition"
                        title="Share Property"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Price Tag Overlay */}
                      <div className="absolute bottom-2.5 left-2.5 bg-black/85 backdrop-blur-md text-white font-extrabold text-xs sm:text-sm px-2.5 py-1 rounded-xl border border-rose-900/30">
                        <span className="text-amber-300">{property.price}</span>
                        {property.priceSuffix && (
                          <span className="text-[10px] font-normal text-gray-300 ml-1">
                            {property.priceSuffix}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <CardContent className="p-3.5 sm:p-4 space-y-1.5">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-rose-900 dark:group-hover:text-rose-400 transition-colors">
                          {property.title}
                        </h3>
                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-rose-800 dark:text-rose-400 mr-1 shrink-0" />
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
                  <div className="p-3.5 sm:p-4 pt-0">
                    <Button
                      onClick={() => router.push(`/property/${property.id}`)}
                      className="w-full h-8 sm:h-9 bg-rose-900 hover:bg-rose-950 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Short & Clean Direct Contact Strip */}
        <section className="container mx-auto px-3 sm:px-4 pb-8">
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-rose-950 via-slate-950 to-black border border-rose-900/30 p-4 sm:p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
            <div className="text-center sm:text-left space-y-0.5">
              <h3 className="text-sm sm:text-base font-bold">Looking for a Specific Land or Property?</h3>
              <p className="text-[11px] sm:text-xs text-stone-300">
                Contact our concierge desk directly for verified land, residential, and commercial acquisitions.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://wa.me/918296530609?text=Hello%20JayaListing%2C%20I%20have%20a%20property%20requirement"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold transition shadow whitespace-nowrap"
              >
                WhatsApp Concierge
              </a>
              <a
                href="tel:+918296530609"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition whitespace-nowrap"
              >
                Call Desk
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
