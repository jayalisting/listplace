"use client"

import { useState, useEffect, useCallback, ReactNode } from "react"
import { Shield, ShieldAlert, Lock, AlertTriangle, EyeOff } from "lucide-react"

interface PrivateScreenshotGuardProps {
  isPrivate: boolean
  clientName?: string
  propertyTitle?: string
  children: ReactNode
}

/**
 * Enterprise Confidentiality & Anti-Screenshot Suite for Private VIP Links.
 * 
 * Protects off-market estate dossiers with:
 * 1. Screen capture & Snipping tool blackout upon window blur / unfocus
 * 2. Keyboard shortcut interception (PrintScreen, Cmd+Shift+3/4/5, Ctrl+P, Ctrl+S, DevTools)
 * 3. Print prevention via @media print stylesheet stripping
 * 4. Selection, context menu, and image drag blocking
 * 5. Forensic diagonal repeating watermark with recipient identity
 */
export default function PrivateScreenshotGuard({
  isPrivate,
  clientName,
  propertyTitle,
  children,
}: PrivateScreenshotGuardProps) {
  const [isWindowBlurred, setIsWindowBlurred] = useState(false)
  const [showWarningAlert, setShowWarningAlert] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")

  const triggerSecurityWarning = useCallback((msg: string) => {
    setWarningMessage(msg)
    setShowWarningAlert(true)
    setTimeout(() => {
      setShowWarningAlert(false)
    }, 3500)
  }, [])

  useEffect(() => {
    if (!isPrivate) return

    // 1. Window Blur & Visibility Change (Detects Snipping Tool, OS Capture, App Switching)
    const handleWindowBlur = () => {
      setIsWindowBlurred(true)
    }

    const handleWindowFocus = () => {
      // Small timeout to prevent instant unblur if capture tool is still closing
      setTimeout(() => {
        setIsWindowBlurred(false)
      }, 250)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowBlurred(true)
      } else {
        setTimeout(() => {
          setIsWindowBlurred(false)
        }, 250)
      }
    }

    window.addEventListener("blur", handleWindowBlur)
    window.addEventListener("focus", handleWindowFocus)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // 2. Keyboard Shortcut Interception
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault()
        e.stopPropagation()
        setIsWindowBlurred(true)
        triggerSecurityWarning("Screenshot blocked. Screen capture is disabled for confidential VIP links.")
        // Clear or overwrite clipboard if permitted
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText("[Confidential Record - JayaListing Private Client Office]")
          }
        } catch {
          // ignore clipboard permission error
        }
        setTimeout(() => setIsWindowBlurred(false), 2000)
        return false
      }

      const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

      // Cmd+Shift+3 / Cmd+Shift+4 / Cmd+Shift+5 (Mac screenshot shortcuts)
      if (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5" || e.keyCode === 51 || e.keyCode === 52 || e.keyCode === 53)) {
        e.preventDefault()
        e.stopPropagation()
        setIsWindowBlurred(true)
        triggerSecurityWarning("Screen capture shortcut detected and blocked.")
        setTimeout(() => setIsWindowBlurred(false), 2000)
        return false
      }

      // Windows Snipping Tool (Win+Shift+S) - browser receives Shift+S with metaKey/win
      if (e.shiftKey && (e.key === "S" || e.key === "s") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        e.stopPropagation()
        setIsWindowBlurred(true)
        triggerSecurityWarning("Screen snippet blocked. Confidential content protected.")
        setTimeout(() => setIsWindowBlurred(false), 2000)
        return false
      }

      // Ctrl+P / Cmd+P (Print to PDF / Printer)
      if (cmdOrCtrl && (e.key === "p" || e.key === "P")) {
        e.preventDefault()
        e.stopPropagation()
        triggerSecurityWarning("Printing and export to PDF are restricted for this confidential dossier.")
        return false
      }

      // Ctrl+S / Cmd+S (Save Webpage)
      if (cmdOrCtrl && (e.key === "s" || e.key === "S") && !e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()
        triggerSecurityWarning("Offline saving is disabled for private property holdings.")
        return false
      }

      // Ctrl+U / Cmd+Option+U (View Source)
      if ((cmdOrCtrl && (e.key === "u" || e.key === "U")) || (isMac && e.metaKey && e.altKey && (e.key === "u" || e.key === "U"))) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }

      // F12 or Inspect shortcuts
      if (e.key === "F12" || (cmdOrCtrl && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "C" || e.key === "c" || e.key === "J" || e.key === "j"))) {
        // Prevent opening devtools if possible
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    // 3. Right-Click Context Menu Blocking
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      triggerSecurityWarning("Right-click menu is disabled on confidential private links.")
      return false
    }

    // 4. Drag Start Prevention (Prevents dragging images or text to desktop)
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault()
      return false
    }

    window.addEventListener("keydown", handleKeyDown, true)
    document.addEventListener("contextmenu", handleContextMenu, true)
    document.addEventListener("dragstart", handleDragStart, true)

    return () => {
      window.removeEventListener("blur", handleWindowBlur)
      window.removeEventListener("focus", handleWindowFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("keydown", handleKeyDown, true)
      document.removeEventListener("contextmenu", handleContextMenu, true)
      document.removeEventListener("dragstart", handleDragStart, true)
    }
  }, [isPrivate, triggerSecurityWarning])

  if (!isPrivate) {
    return <>{children}</>
  }

  const watermarkText = `CONFIDENTIAL • JAYALISTING VIP • ${clientName ? clientName.toUpperCase() + " • " : ""}DO NOT CAPTURE • STRICTLY PRIVATE`

  return (
    <div className="relative select-none [-webkit-user-select:none] [-webkit-touch-callout:none]">
      {/* Print Prevention Stylesheet: completely hides document if print is invoked */}
      <style jsx global>{`
        @media print {
          html, body, #__next, main, div {
            display: none !important;
            visibility: hidden !important;
          }
          body::after {
            content: "CONFIDENTIAL VIP PROPERTY DOSSIER - PRINTING RESTRICTED BY JAYALISTING";
            display: block !important;
            visibility: visible !important;
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
            padding: 50px;
          }
        }
      `}</style>

      {/* Forensic Diagonal Watermark Overlay: Tiled across the entire screen */}
      <div
        className="pointer-events-none fixed inset-0 z-30 overflow-hidden opacity-[0.06] dark:opacity-[0.09] select-none"
        aria-hidden="true"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-16 p-8 transform -rotate-12 scale-125">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="text-[11px] sm:text-xs font-black tracking-widest text-gray-900 dark:text-amber-200 uppercase whitespace-nowrap">
              {watermarkText}
            </div>
          ))}
        </div>
      </div>

      {/* Alert Banner Toast when Screenshot or Restricted Action is Attempted */}
      {showWarningAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto animate-in slide-in-from-top-4 duration-200">
          <div className="bg-gradient-to-r from-red-950 via-rose-900 to-black text-white px-4 py-3 rounded-2xl shadow-2xl border-2 border-red-500/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-600/30 border border-red-400/40 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                Security Restriction Active
              </div>
              <div className="text-xs font-medium text-white/90">
                {warningMessage}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Snipping / Window Blur Shield: instantly hides content when screen capture tool or window switch is active */}
      {isWindowBlurred && (
        <div className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-100">
          <div className="w-16 h-16 rounded-3xl bg-rose-950/80 border-2 border-amber-400/40 text-amber-300 flex items-center justify-center mb-4 shadow-xl shadow-red-950/50 animate-pulse">
            <EyeOff className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-extrabold uppercase tracking-widest mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Confidential View Protected</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight max-w-md mb-2">
            Screen Capture Shield Active
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-md leading-relaxed mb-4">
            Estate records are obscured while the window is unfocused or an external capture tool is active to protect client confidentiality.
          </p>
          <div className="text-[11px] text-amber-300/80 font-bold bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            Click anywhere on this window to resume viewing
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <div className={isWindowBlurred ? "filter blur-xl pointer-events-none" : ""}>
        {children}
      </div>
    </div>
  )
}
