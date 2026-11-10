"use client"

import { useState, useEffect } from "react"
import { Share2, Lock, Globe, Copy, Check, X, ShieldCheck, User, Sparkles, RefreshCw, AlertCircle, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VipTokenRecord {
  id: number
  token: string
  property_id: string
  client_name?: string
  client_phone?: string
  status: "active" | "used" | "revoked"
  max_views: number
  view_count: number
  created_at: string
  first_viewed_at?: string
  last_viewed_at?: string
}

interface PropertyShareModalProps {
  property: {
    id: string
    title: string
    location: string
    price: string
    category?: string
    visibility?: string
  }
  isOpen: boolean
  onClose: () => void
  isAdmin?: boolean
}

/**
 * Resolves the public, shareable origin.
 * Automatically normalizes Vercel preview/branch URLs (e.g. listplace-git-main-xxx.vercel.app or hash previews)
 * to the canonical public production domain (e.g. https://listplace.vercel.app) so recipients
 * are never intercepted by Vercel Authentication or redirected to a Vercel login screen.
 */
function resolveShareableOrigin(): { origin: string; isNormalized: boolean } {
  if (typeof window === "undefined") return { origin: "", isNormalized: false }

  const currentOrigin = window.location.origin
  try {
    const url = new URL(currentOrigin)
    const host = url.hostname

    if (host.endsWith(".vercel.app")) {
      const firstPart = host.slice(0, -".vercel.app".length)

      // Match branch deployment: <project>-git-<branch>-<scope>
      const gitMatch = firstPart.match(/^(.+?)-git-[^.]+$/)
      if (gitMatch) {
        return { origin: `${url.protocol}//${gitMatch[1]}.vercel.app`, isNormalized: true }
      }

      // Match hash deployment: <project>-<hash>-<scope>
      const hashMatch = firstPart.match(/^(.+?)-[a-z0-9]{8,}(?:-[a-z0-9_-]+)?$/i)
      if (hashMatch) {
        return { origin: `${url.protocol}//${hashMatch[1]}.vercel.app`, isNormalized: true }
      }
    }

    return { origin: currentOrigin, isNormalized: false }
  } catch {
    return { origin: currentOrigin, isNormalized: false }
  }
}

export default function PropertyShareModal({
  property,
  isOpen,
  onClose,
  isAdmin: propIsAdmin,
}: PropertyShareModalProps) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<"public" | "private">("public")
  const [copiedType, setCopiedType] = useState<string | null>(null)
  const [origin, setOrigin] = useState("")
  const [isNormalizedFromPreview, setIsNormalizedFromPreview] = useState(false)

  // Single-use VIP link generation state
  const [clientNameInput, setClientNameInput] = useState("")
  const [isGeneratingVip, setIsGeneratingVip] = useState(false)
  const [generatedVipToken, setGeneratedVipToken] = useState<VipTokenRecord | null>(null)
  const [vipTokensList, setVipTokensList] = useState<VipTokenRecord[]>([])
  const [isLoadingTokens, setIsLoadingTokens] = useState(false)
  const [revokingId, setRevokingId] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const resolved = resolveShareableOrigin()
      setOrigin(resolved.origin)
      setIsNormalizedFromPreview(resolved.isNormalized)

      if (propIsAdmin !== undefined) {
        setIsAdmin(propIsAdmin)
      } else {
        fetch("/api/admin/check")
          .then((res) => res.json())
          .then((data) => setIsAdmin(!!data.authenticated))
          .catch(() => setIsAdmin(false))
      }
    }
  }, [propIsAdmin])

  // Load existing VIP tokens when admin opens private tab
  useEffect(() => {
    if (isOpen && isAdmin && activeTab === "private") {
      loadVipTokens()
    }
  }, [isOpen, isAdmin, activeTab, property.id])

  const loadVipTokens = async () => {
    setIsLoadingTokens(true)
    try {
      const res = await fetch(`/api/properties/${property.id}/vip-tokens?t=${Date.now()}`)
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setVipTokensList(data.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingTokens(false)
    }
  }

  const handleGenerateVipToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGeneratingVip(true)
    try {
      const res = await fetch(`/api/properties/${property.id}/vip-tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName: clientNameInput.trim() || undefined }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setGeneratedVipToken(data.data)
        setClientNameInput("")
        loadVipTokens()
      } else {
        alert("Failed to generate VIP link: " + (data.error || "Unknown error"))
      }
    } catch (err: any) {
      alert("Error generating VIP link: " + err.message)
    } finally {
      setIsGeneratingVip(false)
    }
  }

  const handleRevokeToken = async (tokenId: number) => {
    setRevokingId(tokenId)
    try {
      const res = await fetch(`/api/vip-tokens/${tokenId}/revoke`, { method: "POST" })
      const data = await res.json()
      if (data.success) {
        loadVipTokens()
        if (generatedVipToken && generatedVipToken.id === tokenId) {
          setGeneratedVipToken(null)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setRevokingId(null)
    }
  }

  if (!isOpen) return null

  const publicUrl = `${origin}/property/${property.id}`
  const activeVipUrl = generatedVipToken ? `${origin}/property/${property.id}?vip_token=${generatedVipToken.token}` : ""

  const publicMsg = `🏛️ *${property.title}*
📍 Location: ${property.location}
💰 Investment: ${property.price}

View complete verified architectural specs, floor plans & photos:
${publicUrl}`

  const privateMsg = `🔒 *CONFIDENTIAL ONE-TIME PRIVATE VIP ESTATE DOSSIER*
${generatedVipToken?.client_name ? `_Exclusively Prepared For: ${generatedVipToken.client_name}_\n` : ""}
🏛️ *${property.title}*
📍 Location: ${property.location}
💰 Investment: ${property.price}

Access your private single-use encrypted dossier:
${activeVipUrl}

⚠️ *Single-Use Security Notice:* This is an encrypted one-time link. 1 person can open the link once; once accessed, it is automatically disabled and locked for privacy.`

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2500)
  }

  const handleWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text)
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl border border-rose-900/30 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-rose-950 via-slate-950 to-black p-5 text-white border-b border-rose-900/30 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-rose-900/60 border border-amber-400/30 text-amber-300">
              <Share2 className="w-4 h-4" />
            </div>
            <span className="text-xs uppercase tracking-widest font-bold text-amber-300">
              {isAdmin ? "Admin Portfolio Share Dispatch" : "Share Property"}
            </span>
          </div>
          <h3 className="text-base font-black text-white line-clamp-1">{property.title}</h3>
          <p className="text-xs text-stone-300 line-clamp-1">{property.location} • {property.price}</p>
        </div>

        {/* Tab Switcher (Only visible to Admin) */}
        {isAdmin && (
          <div className="p-3 bg-stone-50 dark:bg-gray-950/50 border-b border-stone-200 dark:border-gray-800 shrink-0">
            <div className="grid grid-cols-2 gap-2 bg-stone-200/80 dark:bg-gray-800 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab("public")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "public"
                    ? "bg-white dark:bg-gray-900 text-rose-900 dark:text-rose-300 shadow-sm"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Normal Public Share</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("private")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "private"
                    ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-sm"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>🔒 Single-Use Private VIP</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === "public" || !isAdmin ? (
            /* NORMAL PUBLIC SHARE FOR REGULAR USERS & CLIENTS */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>Public Listing Link</span>
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed">
                  Share this verified listing directly with your friends, family, or partners. Anyone can open and browse complete specifications.
                </p>
              </div>

              {/* Link Input Preview */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block">
                  Listing Web Address
                </label>
                <div className="flex items-center gap-2 bg-stone-100 dark:bg-gray-800 p-2 rounded-xl border border-stone-200 dark:border-gray-700">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="bg-transparent text-xs text-stone-700 dark:text-stone-300 flex-1 outline-none truncate font-mono"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleCopy(publicUrl, "public")}
                    className="h-8 px-3 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-bold shrink-0"
                  >
                    {copiedType === "public" ? (
                      <>
                        <Check className="w-3 h-3 mr-1 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </Button>
                </div>
                {isNormalizedFromPreview && (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 px-2.5 py-1.5 rounded-xl mt-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Auto-converted to public production link (prevents Vercel preview login redirects)</span>
                  </div>
                )}
              </div>

              {/* WhatsApp Share Button */}
              <button
                type="button"
                onClick={() => handleWhatsApp(publicMsg)}
                className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold shadow-md shadow-[#25D366]/20 transition flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>Share via WhatsApp</span>
              </button>
            </div>
          ) : (
            /* ADMIN ONLY: SINGLE-USE PRIVATE VIP LINK GENERATOR */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Single-Use Private VIP Protocol (1 Person / 1 Open)</span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                  Generate an exclusive private VIP link for 1 person. <strong>The recipient can open the link once; after first access, it is automatically disabled and locked</strong>. Includes real-time <strong>Anti-Screenshot &amp; Screen Snipping Protection</strong> with forensic watermarking.
                </p>
              </div>

              {/* Generator Form */}
              <form onSubmit={handleGenerateVipToken} className="p-3.5 rounded-2xl bg-stone-50 dark:bg-gray-800/50 border border-stone-200 dark:border-gray-800 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                    <User className="w-3 h-3 text-amber-600" />
                    <span>Recipient / Client Name (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={clientNameInput}
                    onChange={(e) => setClientNameInput(e.target.value)}
                    placeholder="e.g. Mr. Singhania, Dr. Shetty, VIP Buyer"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-stone-900 dark:text-white outline-none focus:border-amber-600"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isGeneratingVip}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isGeneratingVip ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Encrypted VIP Link...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>⚡ Generate One-Time VIP Link</span>
                    </>
                  )}
                </Button>
              </form>

              {/* Newly Generated Link Result */}
              {generatedVipToken && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/40 space-y-3 animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      <span>Single-Use Link Ready (Active)</span>
                    </span>
                    <span className="text-[10px] bg-emerald-200/60 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      1 View Limit
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-xl border border-emerald-300 dark:border-emerald-800">
                    <input
                      type="text"
                      readOnly
                      value={activeVipUrl}
                      className="bg-transparent text-xs text-stone-800 dark:text-stone-200 flex-1 outline-none truncate font-mono font-bold"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleCopy(activeVipUrl, "vip_active")}
                      className="h-8 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shrink-0"
                    >
                      {copiedType === "vip_active" ? "Copied" : "Copy"}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleWhatsApp(privateMsg)}
                      className="flex-1 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <span>Send VIP Link on WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(privateMsg, "vip_msg")}
                      className="px-3 py-2.5 rounded-xl bg-stone-800 text-white hover:bg-black text-xs font-bold transition"
                      title="Copy full message"
                    >
                      {copiedType === "vip_msg" ? "Copied" : "Copy Msg"}
                    </button>
                  </div>
                </div>
              )}

              {/* History / Active Links List */}
              <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-gray-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-700 dark:text-stone-300">
                    Single-Use VIP Links History ({vipTokensList.length})
                  </span>
                  <button
                    type="button"
                    onClick={loadVipTokens}
                    disabled={isLoadingTokens}
                    className="text-[11px] text-amber-700 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingTokens ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {vipTokensList.length === 0 ? (
                    <div className="p-4 rounded-xl bg-stone-100 dark:bg-gray-800/40 text-center text-xs text-stone-500">
                      No single-use VIP links generated yet. Click "Generate" above to create one.
                    </div>
                  ) : (
                    vipTokensList.map((token) => {
                      const isUsed = token.status === "used" || token.view_count >= token.max_views
                      const isRevoked = token.status === "revoked"
                      const tokenUrl = `${origin}/property/${property.id}?vip_token=${token.token}`

                      return (
                        <div
                          key={token.id}
                          className="p-2.5 rounded-xl border border-stone-200 dark:border-gray-800 bg-stone-50/70 dark:bg-gray-800/40 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-stone-900 dark:text-white truncate">
                                {token.client_name || "VIP Buyer"}
                              </span>
                              {isUsed ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 font-bold">
                                  🔴 Disabled (Used)
                                </span>
                              ) : isRevoked ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700 dark:bg-gray-700 dark:text-gray-300 font-bold">
                                  Revoked
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                                  🟢 Active (1 Open)
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-stone-500 truncate mt-0.5">
                              {isUsed
                                ? `Opened: ${token.first_viewed_at ? new Date(token.first_viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Yes"} • Link deactivated`
                                : `Created: ${new Date(token.created_at).toLocaleDateString()}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {!isUsed && !isRevoked && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(tokenUrl, `tok_${token.id}`)}
                                  className="px-2 py-1 rounded bg-stone-200 dark:bg-gray-700 text-stone-700 dark:text-stone-200 text-[10px] font-bold hover:bg-stone-300 transition"
                                >
                                  {copiedType === `tok_${token.id}` ? "Copied" : "Copy"}
                                </button>
                                <button
                                  type="button"
                                  disabled={revokingId === token.id}
                                  onClick={() => handleRevokeToken(token.id)}
                                  className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                                  title="Revoke and disable this link"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Vercel Login Redirect Guidance */}
          <div className="pt-2 border-t border-stone-200 dark:border-gray-800">
            <div className="p-2.5 rounded-xl bg-stone-100/80 dark:bg-gray-800/60 border border-stone-200/80 dark:border-gray-700/60 text-[11px] text-stone-600 dark:text-stone-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Link opens Vercel Login for recipients?</span>
              </div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-normal">
                If recipients see a Vercel login screen, go to your <strong>Vercel Dashboard &rarr; Project Settings &rarr; Deployment Protection</strong> and turn <strong>Vercel Authentication</strong> to <strong>Disabled</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
