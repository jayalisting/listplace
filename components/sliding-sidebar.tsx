"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  X,
  Building,
  Home,
  TreePine,
  Factory,
  Shield,
  Phone,
  FileText,
  Award,
  Sparkles,
  ChevronRight,
  Database,
  Plus,
  LogOut,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SlidingSidebarProps {
  isOpen: boolean
  onClose: () => void
  children?: React.ReactNode
}

const SlidingSidebar: React.FC<SlidingSidebarProps> = ({ isOpen, onClose, children }) => {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAdmin(localStorage.getItem("jaya_admin_authenticated") === "true")
    }
  }, [isOpen])

  const handleLogout = async () => {
    try {
      localStorage.removeItem("jaya_admin_authenticated")
      localStorage.removeItem("jaya_admin_token")
      sessionStorage.clear()
      document.cookie = "jaya_admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;"
      setIsAdmin(false)
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { "Cache-Control": "no-cache" },
      })
    } catch {}
    onClose()
    window.location.reload()
  }
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 md:w-96 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto flex flex-col justify-between border-r border-rose-900/30 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center pb-6 border-b border-rose-900/10 dark:border-rose-900/30">
            <Link href="/" onClick={onClose} className="flex items-center space-x-3 group">
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
                <div className="text-xl font-black tracking-tight bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 dark:from-rose-400 dark:via-red-300 dark:to-rose-400 bg-clip-text text-transparent">
                  JayaListing
                </div>
                <div className="text-[10px] tracking-widest uppercase text-rose-900 dark:text-rose-400 font-bold">
                  Royal Estates
                </div>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-500 hover:text-rose-900 dark:hover:text-rose-300 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Royal Red Luxury Banner */}
          <div className="my-5 p-3.5 rounded-xl bg-gradient-to-r from-rose-950 via-red-900 to-rose-900 text-white shadow-md border border-rose-800 flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-amber-300 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-200 block">Royal Red Luxury Portfolio</span>
              <span className="text-rose-200/90 text-[11px]">Trophy Estates from ₹10 Cr to ₹150 Cr+</span>
            </div>
          </div>

          {/* Navigation Categories - STRICT ORDER: Residential -> Commercial -> Industrial -> Agricultural */}
          <nav className="space-y-1.5">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Estate Class Portfolios
            </div>

            {/* 1. Residential (Royal Blue Accent) */}
            <Link
              href="/residential"
              onClick={onClose}
              className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-blue-500/30 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-gray-900 dark:text-white">1. Residential</span>
                  <span className="text-[11px] text-gray-500 font-normal">Penthouses & Mansions</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* 2. Commercial (Amber Gold Accent) */}
            <Link
              href="/commercial"
              onClick={onClose}
              className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-amber-500/30 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-gray-900 dark:text-white">2. Commercial</span>
                  <span className="text-[11px] text-gray-500 font-normal">Trophy Towers & Retail</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* 3. Industrial (Purple Slate Accent) */}
            <Link
              href="/industrial"
              onClick={onClose}
              className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-purple-500/30 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Factory className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-gray-900 dark:text-white">3. Industrial</span>
                  <span className="text-[11px] text-gray-500 font-normal">Mega Logistics & Seaport</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* 4. Agricultural (Emerald Green Accent) */}
            <Link
              href="/agriculture"
              onClick={onClose}
              className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-emerald-500/30 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <TreePine className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-gray-900 dark:text-white">4. Agricultural</span>
                  <span className="text-[11px] text-gray-500 font-normal">Vineyards & Plantations</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-5 mb-2">
              Regional Operating Hubs (₹5 Cr+)
            </div>

            <Link
              href="/?city=bengaluru"
              onClick={onClose}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-xs">
                  BLR
                </div>
                <div>
                  <span className="block text-gray-900 dark:text-white font-bold">Bengaluru Hub</span>
                  <span className="text-[10px] text-gray-500 font-normal">Tech Corridors &amp; Estates</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/?city=mangaluru"
              onClick={onClose}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-rose-400 flex items-center justify-center font-bold text-xs">
                  IXE
                </div>
                <div>
                  <span className="block text-gray-900 dark:text-white font-bold">Mangaluru &amp; DK Hub</span>
                  <span className="text-[10px] text-gray-500 font-normal">Coastal &amp; Agro-Forestry</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/?city=udupi"
              onClick={onClose}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  UD
                </div>
                <div>
                  <span className="block text-gray-900 dark:text-white font-bold">Udupi &amp; Manipal Hub</span>
                  <span className="text-[10px] text-gray-500 font-normal">Hospitality &amp; Coast</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <a
              href="https://wa.me/918296530609?text=Hello%20JayaListing%20Private%20Desk%2C%20I%20would%20like%20to%20share%20a%20property%20acquisition%20requirement"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 transition-colors group my-2"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-rose-900 text-amber-300 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-amber-400 font-bold">Share Requirement</span>
                  <span className="text-[10px] text-rose-300 font-normal">Confidential Off-Market Intake</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </a>

            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-4 mb-2">
              Administrator Control (Authorized Only)
            </div>

            <Link
              href="/add-listing"
              onClick={onClose}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors group mt-1"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-rose-900 text-amber-300 flex items-center justify-center font-bold shadow-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="block text-gray-900 dark:text-white font-bold">Add Listing</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/50 text-amber-600 dark:text-amber-400">
                      Admin Only
                    </Badge>
                  </div>
                  <span className="text-[10px] text-gray-500 font-normal">Create Public & Private Listings</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors group mt-1"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-rose-900 text-amber-300 flex items-center justify-center font-bold">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-rose-900 dark:text-rose-400 font-bold">Admin & Database Control</span>
                  <span className="text-[10px] text-gray-500 font-normal">Manage PostgreSQL Listings</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {isAdmin && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:hover:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-900/50 transition-colors group mt-2 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold">Log Out Admin</span>
                    <span className="text-[10px] text-red-600/75 dark:text-red-400/75">End session</span>
                  </div>
                </div>
              </button>
            )}
          </nav>

          {children}
        </div>

        {/* Footer in Drawer */}
        <div className="p-6 border-t border-rose-900/10 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/20 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-rose-900/10 text-rose-900 dark:text-rose-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-white">Strict Non-Disclosure</div>
              <div className="text-[10px] text-gray-500">100% confidential acquisitions</div>
            </div>
          </div>

          <a
            href="tel:+918296530609"
            className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 hover:from-rose-950 hover:to-red-950 text-white font-bold text-xs shadow-md shadow-rose-900/30 transition-all border border-amber-400/20"
          >
            <Phone className="w-3.5 h-3.5 mr-1 text-amber-300" />
            <span>Contact Us: +91 82965 30609</span>
          </a>
        </div>
      </aside>
    </>
  )
}

export default SlidingSidebar
