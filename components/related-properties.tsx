"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, ArrowRight, ChevronRight, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import PropertyShareModal from "@/components/property-share-modal"
import { LUXURY_PROPERTIES, LuxuryProperty } from "@/lib/luxury-properties"
import { useRouter } from "next/navigation"

export default function RelatedProperties({ currentId }: { currentId?: string }) {
  const router = useRouter()
  const [sharingProperty, setSharingProperty] = useState<LuxuryProperty | null>(null)
  const properties = LUXURY_PROPERTIES.filter((p) => p.id !== currentId && p.visibility !== "private").slice(0, 3)

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "residential":
        return "bg-blue-950/80 text-blue-300 border-blue-500/40"
      case "commercial":
        return "bg-amber-950/80 text-amber-300 border-amber-500/40"
      case "industrial":
        return "bg-purple-950/80 text-purple-300 border-purple-500/40"
      case "agriculture":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
      default:
        return "bg-rose-950/80 text-rose-300 border-rose-500/40"
    }
  }

  const getNicheTheme = (category: string) => {
    switch (category) {
      case "residential":
        return { iconColor: "text-blue-500 dark:text-blue-400", placeColor: "text-blue-600 dark:text-blue-400" }
      case "commercial":
        return { iconColor: "text-amber-500 dark:text-amber-400", placeColor: "text-amber-600 dark:text-amber-400" }
      case "industrial":
        return { iconColor: "text-purple-500 dark:text-purple-400", placeColor: "text-purple-600 dark:text-purple-400" }
      case "agriculture":
        return { iconColor: "text-emerald-500 dark:text-emerald-400", placeColor: "text-emerald-600 dark:text-emerald-400" }
      default:
        return { iconColor: "text-rose-500 dark:text-rose-400", placeColor: "text-rose-600 dark:text-rose-400" }
    }
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Explore Other Properties</h2>
        </div>
        <Link href="/residential" className="text-xs font-bold text-rose-900 dark:text-rose-400 hover:text-rose-800 flex items-center">
          View All <ChevronRight className="w-4 h-4 ml-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <Card
            key={property.id}
            onClick={() => router.push(`/property/${property.id}`)}
            className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-gray-900 border border-rose-900/15 dark:border-rose-900/30 rounded-2xl group flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="relative aspect-[16/10] overflow-hidden bg-gray-900">
                <Image
                  src={property.images[0]}
                  alt={property.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <Badge className={`absolute top-3 left-3 backdrop-blur-md text-xs border ${getCategoryBadge(property.category)}`}>
                  {property.propertyType}
                </Badge>
                <div className="absolute top-3 right-3 flex items-center space-x-1.5 z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSharingProperty(property)
                    }}
                    className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-amber-400 transition-colors shadow-sm cursor-pointer"
                    title="Share Property (Public or Private VIP)"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md text-amber-200 font-extrabold text-base px-3 py-1 rounded-lg border border-rose-900/40">
                  {property.price}
                </div>
              </div>

              <CardContent className="p-5">
                <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1 group-hover:text-rose-800 transition-colors">
                  {property.title}
                </h3>
                <div className="flex items-center text-xs text-gray-500 mt-1 mb-3">
                  <MapPin className={`w-3.5 h-3.5 ${getNicheTheme(property.category).iconColor} mr-1 flex-shrink-0`} />
                  <span className={`truncate font-medium ${getNicheTheme(property.category).placeColor}`}>{property.location}</span>
                </div>

                <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-3 py-2 border-t border-b border-gray-100 dark:border-gray-800">
                  <span>{property.area}</span>
                  <span>•</span>
                  <span>{property.bedrooms ? `${property.bedrooms} BHK` : property.details.area}</span>
                  <span>•</span>
                  <span className={`font-bold ${getNicheTheme(property.category).placeColor}`}>{property.city}</span>
                </div>
              </CardContent>
            </div>

            <div className="p-5 pt-0 flex items-center gap-2">
              <Button
                onClick={() => router.push(`/property/${property.id}`)}
                variant="outline"
                className="flex-1 border-rose-900/40 text-rose-900 dark:text-rose-300 hover:bg-rose-900 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Click Here
              </Button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSharingProperty(property)
                }}
                title="Share Property (Public / Private VIP)"
                className="h-9 px-3 rounded-xl border border-rose-900/20 dark:border-rose-900/40 bg-stone-100 dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-900 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all relative z-10 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-rose-800 dark:text-rose-400" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </Card>
        ))}
      </div>

      {sharingProperty && (
        <PropertyShareModal
          property={sharingProperty}
          isOpen={!!sharingProperty}
          onClose={() => setSharingProperty(null)}
        />
      )}
    </div>
  )
}
