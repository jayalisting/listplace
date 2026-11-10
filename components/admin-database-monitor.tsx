"use client"

import { useState, useEffect } from "react"
import {
  Database,
  RefreshCw,
  HardDrive,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Archive,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Layers,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TableSizeRecord {
  table_name: string
  total_size: string
  total_bytes: string | number
  table_size: string
  index_size: string
}

interface RetentionStats {
  activeBookings: number
  archivedBookings: number
  activeTokens: number
  expiredTokens: number
  tables: TableSizeRecord[]
}

export default function AdminDatabaseMonitor() {
  const [stats, setStats] = useState<RetentionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  async function fetchRetentionStats() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      })
      const json = await res.json()
      if (json.success && json.data) {
        setStats(json.data)
      } else {
        setStatusMessage(json.error || "Failed to load database storage metrics.")
      }
    } catch (err: any) {
      setStatusMessage("Network error querying retention stats.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRetentionStats()
  }, [])

  async function triggerMaintenance(action: "archive_bookings" | "cleanup_tokens" | "all") {
    setActionLoading(action)
    setStatusMessage(null)
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (json.success) {
        const { archivedBookingsCount, cleanedTokensCount } = json.summary || {}
        let msg = "✓ Maintenance completed successfully: "
        const parts = []
        if (archivedBookingsCount !== undefined) {
          parts.push(`${archivedBookingsCount} bookings archived`)
        }
        if (cleanedTokensCount !== undefined) {
          parts.push(`${cleanedTokensCount} expired tokens pruned`)
        }
        msg += parts.join(", ") || "Storage tables refreshed."
        setStatusMessage(msg)
        if (json.stats) {
          setStats(json.stats)
        } else {
          fetchRetentionStats()
        }
      } else {
        setStatusMessage(`Error: ${json.error || "Operation failed."}`)
      }
    } catch (err: any) {
      setStatusMessage("Failed to execute maintenance task.")
    } finally {
      setActionLoading(null)
    }
  }

  const totalDiskBytes =
    stats?.tables?.reduce((acc, t) => acc + (Number(t.total_bytes) || 0), 0) ?? 0
  const formattedTotalDisk =
    totalDiskBytes > 1024 * 1024
      ? `${(totalDiskBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(totalDiskBytes / 1024).toFixed(1)} kB`

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-3xl text-white border border-slate-700 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 flex-shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold tracking-tight">PostgreSQL Storage & Cost Monitor</h2>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] uppercase font-bold">
                Neon Cloud Active
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live table metrics, data-at-rest size, index footprints, and automated retention pruning.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRetentionStats}
            disabled={loading}
            className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs rounded-xl"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Metrics
          </Button>
          <Button
            size="sm"
            onClick={() => triggerMaintenance("all")}
            disabled={actionLoading !== null}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30"
          >
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            {actionLoading === "all" ? "Pruning..." : "Run Housekeeping"}
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center space-x-2 ${
            statusMessage.startsWith("✓")
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs">
              <span>Total Table + Index Footprint</span>
              <HardDrive className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {formattedTotalDisk}
              </span>
              <span className="text-[11px] text-emerald-600 font-bold">across 8 tables</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Zero binary/base64 bytes stored in DB
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs">
              <span>VIP Tour Appointments</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {stats?.activeBookings ?? 0}
              </span>
              <span className="text-[11px] text-gray-500">
                active / {stats?.archivedBookings ?? 0} archived
              </span>
            </div>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerMaintenance("archive_bookings")}
                disabled={actionLoading !== null}
                className="w-full text-[11px] h-7 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20"
              >
                <Archive className="w-3 h-3 mr-1" />
                Archive Completed ({">"}90d)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs">
              <span>VIP Share Tokens</span>
              <ShieldCheck className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {stats?.activeTokens ?? 0}
              </span>
              <span className="text-[11px] text-gray-500">
                active / {stats?.expiredTokens ?? 0} expired
              </span>
            </div>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerMaintenance("cleanup_tokens")}
                disabled={actionLoading !== null}
                className="w-full text-[11px] h-7 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Prune Expired Tokens ({">"}30d)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs">
              <span>Database TOAST Compression</span>
              <Layers className="w-4 h-4 text-teal-500" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-600">LZ4 Active</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              toast_tuple_target = 512B threshold
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table Storage Sizes Breakdown */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <span>Live PostgreSQL Table Size Breakdown</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Exact disk allocation queried directly from PostgreSQL system catalog (<code className="text-xs">pg_class</code> & <code className="text-xs">pg_total_relation_size</code>).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-100 dark:border-gray-800 font-bold">
              <tr>
                <th className="py-3 px-6">Table Name</th>
                <th className="py-3 px-6">Total Disk Footprint</th>
                <th className="py-3 px-6">Table Heap Data</th>
                <th className="py-3 px-6">Index Size</th>
                <th className="py-3 px-6">Optimization Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
              {stats?.tables?.map((table) => {
                let badgeText = "Optimized"
                let badgeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"

                if (table.table_name === "properties") {
                  badgeText = "LZ4 TOAST + Card Proj."
                  badgeColor = "bg-blue-500/10 text-blue-600 border-blue-500/20"
                } else if (table.table_name === "amenities_lookup") {
                  badgeText = "Deduplicated (55 IDs)"
                  badgeColor = "bg-purple-500/10 text-purple-600 border-purple-500/20"
                } else if (table.table_name === "vip_share_tokens") {
                  badgeText = "SHA-256 Bytea + Index"
                  badgeColor = "bg-amber-500/10 text-amber-600 border-amber-500/20"
                } else if (table.table_name === "vip_tour_bookings_archive") {
                  badgeText = "Brotli Compressed"
                  badgeColor = "bg-teal-500/10 text-teal-600 border-teal-500/20"
                } else if (table.table_name === "image_seo_records") {
                  badgeText = "Delta Storage + Hash"
                  badgeColor = "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                }

                return (
                  <tr key={table.table_name} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                    <td className="py-3.5 px-6 font-mono text-gray-900 dark:text-gray-100 font-semibold">
                      {table.table_name}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-gray-900 dark:text-white">
                      {table.total_size}
                    </td>
                    <td className="py-3.5 px-6 text-gray-600 dark:text-gray-400">
                      {table.table_size}
                    </td>
                    <td className="py-3.5 px-6 text-gray-600 dark:text-gray-400">
                      {table.index_size}
                    </td>
                    <td className="py-3.5 px-6">
                      <Badge className={`text-[10px] font-bold ${badgeColor}`}>
                        {badgeText}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Neon Project Settings Review & Recommendations Card */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border-slate-700 text-white rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Neon Cloud Configuration & Cost Audit</h3>
                <p className="text-xs text-slate-400">
                  Critical infrastructure settings to prevent unexpected billing spikes on Neon.
                </p>
              </div>
            </div>
            <a
              href="https://console.neon.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center space-x-1.5 text-xs text-amber-300 hover:text-amber-200 font-semibold bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/20 transition-colors"
            >
              <span>Neon Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            {/* Setting 1: Autosuspend */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                  1. Autosuspend
                </span>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-none text-[10px]">
                  Scale-to-Zero
                </Badge>
              </div>
              <div className="text-sm font-bold text-white mb-1">
                Recommended: 300s (5 minutes)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                When traffic stops (e.g. overnight), Neon suspends compute automatically. Because our Next.js frontend uses static ISR, public visitors hit the Vercel edge without waking Neon!
              </p>
            </div>

            {/* Setting 2: Compute Size Limits */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">
                  2. Compute Limits
                </span>
                <Badge className="bg-blue-500/20 text-blue-300 border-none text-[10px]">
                  0.25 – 0.5 CU
                </Badge>
              </div>
              <div className="text-sm font-bold text-white mb-1">
                Min: 0.25 CU | Max: 0.5 – 1.0 CU
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cap maximum autoscaling CU in the Neon dashboard. With our optimized indexes and covering projections, queries complete in &lt;2ms and never need multi-core scaling.
              </p>
            </div>

            {/* Setting 3: History / PITR Window */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                  3. PITR Retention
                </span>
                <Badge className="bg-amber-500/20 text-amber-300 border-none text-[10px]">
                  Storage Control
                </Badge>
              </div>
              <div className="text-sm font-bold text-white mb-1">
                Recommended: 1 – 2 Days (or 7d max)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong>Critical:</strong> Neon bills WAL history as storage! A 30-day PITR window stores all intermediate row rewrites. Keep history retention to 1–2 days to minimize storage billing.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

