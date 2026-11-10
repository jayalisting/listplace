"use client"

import {
  Search,
  MapPin,
  Building,
  Square,
  Users,
  Car,
  Filter,
  Sparkles,
  Shield,
  ArrowRight,
  Phone,
  CheckCircle2,
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
import PropertyHeader from "@/components/property-header"
import PropertyShareModal from "@/components/property-share-modal"
import { LUXURY_PROPERTIES, LuxuryProperty } from "@/lib/luxury-properties"
import { useRouter } from "next/navigation"

export default function CommercialPage() {
  const router = useRouter()
  const [selectedCity, setSelectedCity] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sharingProperty, setSharingProperty] = useState<LuxuryProperty | null>(null)
  const [commercialProperties, setCommercialProperties] = useState<LuxuryProperty[]>(
    () => LUXURY_PROPERTIES.filter((p) => p.category === "commercial" && p.visibility !== "private")
  )

  useEffect(() => {
    fetch(`/api/properties?category=commercial&t=${Date.now()}`, {
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
          setCommercialProperties(data.data)
        }
      })
      .catch((err) => console.log("Using cached commercial properties:", err))
  }, [])

  const filtered = commercialProperties.filter((p) => {
    if (selectedCity !== "all") {
      const c = selectedCity.toLowerCase()
      const pCity = (p.city || "").toLowerCase()
      const pLoc = (p.location || "").toLowerCase()
      const pTags = (p.tags || []).join(" ").toLowerCase()

      if (c === "dk" || c.includes("dakshina")) {
        const matchesDk =
          pCity.includes("dk") ||
          pCity.includes("dakshina") ||
          pCity.includes("mangal") ||
          pLoc.includes("dk") ||
          pLoc.includes("dakshina") ||
          pLoc.includes("mangal") ||
          pTags.includes("dk") ||
          pTags.includes("dakshina")
        if (!matchesDk) return false
      } else if (c === "udupi" || c.includes("malpe") || c.includes("manipal")) {
        const matchesUdupi =
          pCity.includes("udupi") ||
          pLoc.includes("udupi") ||
          pLoc.includes("malpe") ||
          pLoc.includes("manipal") ||
          pTags.includes("udupi") ||
          pTags.includes("malpe") ||
          pTags.includes("manipal")
        if (!matchesUdupi) return false
      } else {
        if (!pCity.includes(c) && !pLoc.includes(c)) return false
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const inTitle = p.title.toLowerCase().includes(q)
      const inLocation = p.location.toLowerCase().includes(q)
      const inCity = (p.city || "").toLowerCase().includes(q)
      const inTags = p.tags.some((t) => t.toLowerCase().includes(q))

      let aliasMatch = false
      if (q === "dk" || q.includes("dakshina")) {
        aliasMatch =
          inCity ||
          inLocation ||
          inTags ||
          (p.city || "").toLowerCase().includes("mangal") ||
          p.location.toLowerCase().includes("mangal")
      } else if (q === "udupi" || q.includes("manipal") || q.includes("malpe")) {
        aliasMatch =
          inCity ||
          inLocation ||
          inTags ||
          p.title.toLowerCase().includes("udupi") ||
          p.location.toLowerCase().includes("udupi")
      }

      if (!inTitle && !inLocation && !inCity && !inTags && !aliasMatch) return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <PropertyHeader onMenuClick={() => setSidebarOpen(true)} />

      {/* Hero Banner - Royal Red Maroon Base with Amber Accent */}
      <div className="relative bg-gradient-to-r from-rose-950 via-slate-950 to-black text-white py-12 sm:py-16 border-b border-rose-900/30">
        <div className="container mx-auto px-4 max-w-5xl text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-900/40 text-amber-200 border border-amber-500/40 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Category 2: Commercial Trophy Assets</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Trophy Corporate Headquarters & Prime Retail Flagships
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 max-w-2xl mx-auto">
            High-yield commercial assets, full floors in LEED Platinum towers, and flagship high-street retail spaces in BKC, UB City, and coastal corridors.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-2xl mx-auto space-y-3">
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-xl border border-rose-900/25 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-800" />
                <Input
                  placeholder="Search by city (e.g. DK, Udupi, Mumbai), tower..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-xl border-gray-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800 text-xs font-bold text-gray-900 dark:text-white"
              >
                <option value="all">All Commercial Hubs</option>
                <option value="dk">📍 DK / Mangaluru Commercial</option>
                <option value="udupi">🌊 Udupi Commercial Corridor</option>
                <option value="Mumbai">Mumbai (BKC)</option>
                <option value="Bangalore">Bangalore (UB City)</option>
              </select>
            </div>

            {/* Quick Location Pills */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap text-xs">
              <span className="text-gray-400 text-[11px] font-semibold mr-1">Hubs:</span>
              {[
                { label: "All Hubs", val: "all" },
                { label: "📍 DK / Mangaluru", val: "dk" },
                { label: "🌊 Udupi", val: "udupi" },
                { label: "Mumbai", val: "Mumbai" },
                { label: "Bangalore", val: "Bangalore" },
              ].map((pill) => (
                <button
                  key={pill.val}
                  type="button"
                  onClick={() => setSelectedCity(pill.val)}
                  className={`px-3 py-1 rounded-full font-bold transition-all ${
                    selectedCity === pill.val
                      ? "bg-amber-600 text-white shadow-md border border-amber-400"
                      : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/10"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Listing Main */}
      <main className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              Trophy Commercial Assets ({filtered.length})
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Verified corporate titles with 8.5% – 9.8% annual net yields
            </p>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map((property) => (
            <Card
              key={property.id}
              onClick={() => router.push(`/property/${property.id}`)}
              className="overflow-hidden hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 bg-white dark:bg-gray-900 border border-rose-900/15 dark:border-rose-900/30 rounded-3xl group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                  <Image
                    src={property.images[0]}
                    alt={property.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />

                  <div className="absolute top-3 left-3 flex items-center space-x-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                      {property.propertyType}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center space-x-1.5 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSharingProperty(property)
                      }}
                      className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-amber-400 transition-colors cursor-pointer"
                      title="Share Property (Public or Private VIP)"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md text-white font-black text-xl px-3.5 py-1.5 rounded-xl border border-rose-900/40">
                    <span className="text-amber-200">{property.price}</span>
                    {property.priceSuffix && (
                      <span className="text-xs font-normal text-gray-300 ml-1">
                        {property.priceSuffix}
                      </span>
                    )}
                  </div>
                </div>

                <CardContent className="p-5 sm:p-6 space-y-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white line-clamp-1 group-hover:text-rose-800 transition-colors">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mr-1 flex-shrink-0" />
                      <span className="truncate text-amber-700 dark:text-amber-400 font-medium">{property.location}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {property.tagline}
                  </p>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    {property.area && property.area !== "None" && property.area !== "N/A" ? (
                      <div className="flex items-center">
                        <Square className="w-3.5 h-3.5 text-amber-600 mr-1" />
                        <span>{property.area}</span>
                      </div>
                    ) : (
                      <span>{property.details?.facing || "Prime Enclave"}</span>
                    )}
                    {property.details.capacity && (
                      <div className="flex items-center">
                        <Users className="w-3.5 h-3.5 text-amber-600 mr-1" />
                        <span>{property.details.capacity}</span>
                      </div>
                    )}
                    <div className="font-bold text-amber-600 dark:text-amber-400">
                      {property.city}
                    </div>
                  </div>

                  {/* Commercial Prime Amenities Badges */}
                  {((property.amenities && property.amenities.length > 0) ? property.amenities : (property.highlights || [])).length > 0 && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Corporate Specifications</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {((property.amenities && property.amenities.length > 0) ? property.amenities : (property.highlights || []))
                          .slice(0, 3)
                          .map((amenity, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-500/20 max-w-[140px] truncate"
                              title={amenity}
                            >
                              <CheckCircle2 className="w-2.5 h-2.5 mr-1 text-amber-600 dark:text-amber-400 flex-shrink-0" />
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

              <div className="p-5 sm:p-6 pt-0 flex items-center gap-2">
                <Button
                  onClick={() => router.push(`/property/${property.id}`)}
                  className="flex-1 h-11 bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 hover:from-rose-950 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/30 border border-amber-400/20"
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
                  className="h-11 px-3.5 rounded-xl border border-rose-900/20 dark:border-rose-900/40 bg-stone-100 dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-900 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all relative z-10 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-rose-800 dark:text-rose-400" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      </main>

      {sharingProperty && (
        <PropertyShareModal
          property={sharingProperty}
          isOpen={!!sharingProperty}
          onClose={() => setSharingProperty(null)}
        />
      )}

      <SlidingSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Footer />
    </div>
  )
}
