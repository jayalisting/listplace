"use client"

import { Search, Menu, Phone, Sparkles, Building2, Home, TreePine, Factory, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import SlidingSidebar from "./sliding-sidebar"
import { useRouter } from "next/navigation"

interface PropertyHeaderProps {
  onMenuClick?: () => void
}

export default function PropertyHeader({ onMenuClick }: PropertyHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}#luxury-catalog`)
    }
  }

  return (
    <header className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-rose-900/20 dark:border-rose-900/30 sticky top-0 z-40 transition-colors duration-300">
      <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Section - Menu + Logo */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (onMenuClick) onMenuClick()
                else setSidebarOpen(true)
              }}
              className="hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-700 dark:text-gray-200 p-1.5 sm:p-2 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-rose-900 dark:text-rose-400" />
            </Button>

            <Link href="/" className="flex items-center space-x-2 group min-w-0">
              {/* Royal Emblem */}
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                <Image
                  src="/logo.png"
                  alt="JayaListing Royal Emblem"
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
                <div className="text-[7px] sm:text-[9px] tracking-widest uppercase font-bold text-rose-900 dark:text-rose-400 truncate">
                  Royal Estates
                </div>
              </div>
            </Link>
          </div>

          {/* Center Section - Strictly Ordered Navigation (Residential -> Commercial -> Industrial -> Agricultural) */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-bold text-gray-700 dark:text-gray-200">
            {/* 1. Residential */}
            <Link
              href="/residential"
              className="flex items-center space-x-1.5 hover:text-blue-600 transition-colors py-1 group"
            >
              <span className="w-2 h-2 rounded-full bg-blue-600 group-hover:scale-125 transition-transform" />
              <span>Residential</span>
            </Link>

            {/* 2. Commercial */}
            <Link
              href="/commercial"
              className="flex items-center space-x-1.5 hover:text-amber-600 transition-colors py-1 group"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 group-hover:scale-125 transition-transform" />
              <span>Commercial</span>
            </Link>

            {/* 3. Industrial */}
            <Link
              href="/industrial"
              className="flex items-center space-x-1.5 hover:text-purple-600 transition-colors py-1 group"
            >
              <span className="w-2 h-2 rounded-full bg-purple-600 group-hover:scale-125 transition-transform" />
              <span>Industrial</span>
            </Link>

            {/* 4. Agricultural */}
            <Link
              href="/agriculture"
              className="flex items-center space-x-1.5 hover:text-emerald-600 transition-colors py-1 group"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600 group-hover:scale-125 transition-transform" />
              <span>Agricultural</span>
            </Link>
          </nav>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:block flex-1 max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-rose-800 dark:text-rose-400" />
              <Input
                type="text"
                placeholder="Search estates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 h-9 text-xs rounded-full border-rose-900/20 dark:border-rose-900/40 bg-rose-50/40 dark:bg-gray-900 focus:border-rose-800 dark:focus:border-rose-500"
              />
            </div>
          </form>

          {/* Right Section - VIP Concierge & WhatsApp */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            <a
              href="tel:+918296530609"
              className="hidden md:inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-rose-900/10 text-rose-900 dark:text-rose-300 hover:bg-rose-900/20 border border-rose-900/30 transition-all"
            >
              <Phone className="w-3 h-3 text-rose-800 dark:text-rose-400" />
              <span>Contact Us: +91 82965 30609</span>
            </a>

            <a
              href="https://wa.me/918296530609?text=Hello%20JayaListing%20Luxury%20Team%2C%20I%20am%20interested%20in%20your%20portfolio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-sm shrink-0 whitespace-nowrap transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
      <SlidingSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </header>
  )
}
