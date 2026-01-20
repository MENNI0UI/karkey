"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  Car,
  Gavel,
  Store,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  Activity,
  BarChart3,
  MapPin,
  Award,
  CalendarDays,
  UserCheck,
  ShieldCheck,
  Hammer,
  RefreshCw,
  Eye,
  CheckCircle2,
  MessageCircle,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

interface PlatformStats {
  users: {
    total: number
    verified: number
    newToday: number
    newThisWeek: number
    growth: number
  }
  verifications: {
    pendingUsers: number
    pendingVehicles: number
    total: number
  }
  auctions: {
    total: number
    active: number
    completed: number
    endingToday: number
    newThisWeek: number
    vehicles: number
    approvedVehicles: number
    totalBids: number
    bidsToday: number
    avgBidsPerAuction: number
    highestBidToday: number
    topBrands: { name: string; count: number }[]
    topCities: { name: string; count: number }[]
    growth: number
  }
  karkeyCars: {
    total: number
    newToday: number
    newThisWeek: number
    inquiries: number
    topBrands: { name: string; count: number }[]
    topCities: { name: string; count: number }[]
    growth: number
  }
}

type TabType = "users" | "auctions" | "karkey-cars"

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendValue,
  loading = false
}: {
  title: string
  value: string | number
  icon: any
  description?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  loading?: boolean
}) {
  if (loading) {
    return (
      <Card className="border border-gray-100 shadow-sm bg-white">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{value}</span>
              {trend && trendValue && (
                <span className={cn(
                  "inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded",
                  trend === "up" && "bg-emerald-50 text-emerald-600",
                  trend === "down" && "bg-red-50 text-red-600",
                  trend === "neutral" && "bg-gray-50 text-gray-600"
                )}>
                  {trend === "up" && <TrendingUp className="w-3 h-3 mr-0.5" />}
                  {trend === "down" && <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {trendValue}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-400">{description}</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#B8071C]/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#B8071C]" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MiniStatCard({
  title,
  value,
  icon: Icon,
  loading = false
}: {
  title: string
  value: string | number
  icon: any
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
      <div className="w-9 h-9 rounded-lg bg-[#B8071C]/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-[#B8071C]" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

function TopList({
  title,
  icon: Icon,
  items,
  loading
}: {
  title: string
  icon: any
  items: { name: string; count: number }[]
  loading: boolean
}) {
  if (loading) {
    return (
      <Card className="border border-gray-100 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-100 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <div className="w-7 h-7 rounded-lg bg-[#B8071C]/10 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-[#B8071C]" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items && items.length > 0 ? (
          <div className="space-y-2.5">
            {items.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2.5">
                <span className={cn(
                  "w-5 h-5 rounded text-xs font-semibold flex items-center justify-center",
                  index === 0 && "bg-[#B8071C] text-white",
                  index === 1 && "bg-[#B8071C]/70 text-white",
                  index === 2 && "bg-[#B8071C]/50 text-white",
                  index > 2 && "bg-gray-100 text-gray-500",
                )}>
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <span className="text-xs font-medium text-gray-500">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#B8071C]"
                      style={{
                        width: `${(item.count / (items[0]?.count || 1)) * 100}%`,
                        opacity: 1 - (index * 0.12)
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-6 text-sm">No data available</p>
        )}
      </CardContent>
    </Card>
  )
}

export function PlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const initialTabParam = searchParams?.get("statsTab")
  const initialTab: TabType = (initialTabParam === "users" || initialTabParam === "auctions" || initialTabParam === "karkey-cars") ? initialTabParam as TabType : "users"
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  useEffect(() => {
    // Keep local state in sync when the URL changes externally
    const tab = searchParams?.get("statsTab")
    if (tab === "users" || tab === "auctions" || tab === "karkey-cars") {
      setActiveTab(tab)
    } else {
      setActiveTab("users")
    }
  }, [searchParams])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/admin/stats")
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch stats")
      }

      setStats(data.stats)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-MA", {
      style: "currency",
      currency: "MAD",
      maximumFractionDigits: 0
    }).format(price).replace("MAD", "DH")
  }

  const getTrend = (growth: number | undefined) => {
    if (!growth) return "neutral"
    return growth > 0 ? "up" : growth < 0 ? "down" : "neutral"
  }

  if (error) {
    return (
      <Card className="border-0 shadow-md bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={fetchStats} className="ml-auto">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          onClick={() => {
            const tab: TabType = "users"
            setActiveTab(tab)
            const ceoTab = searchParams?.get("ceoTab")
            const base = pathname.split("?")[0]
            const qs = ceoTab ? `?ceoTab=${encodeURIComponent(ceoTab)}&statsTab=${tab}` : `?statsTab=${tab}`
            router.push(`${base}${qs}`)
          }}
          variant={activeTab === "users" ? "default" : "outline"}
          className={activeTab === "users" ? "bg-[#B8071C] hover:bg-[#910515]" : ""}
        >
          <Users className="w-4 h-4 mr-2" />
          Users ({stats?.users.total || 0})
        </Button>
        <Button
          onClick={() => {
            const tab: TabType = "auctions"
            setActiveTab(tab)
            const ceoTab = searchParams?.get("ceoTab")
            const base = pathname.split("?")[0]
            const qs = ceoTab ? `?ceoTab=${encodeURIComponent(ceoTab)}&statsTab=${tab}` : `?statsTab=${tab}`
            router.push(`${base}${qs}`)
          }}
          variant={activeTab === "auctions" ? "default" : "outline"}
          className={activeTab === "auctions" ? "bg-[#B8071C] hover:bg-[#910515]" : ""}
        >
          <Gavel className="w-4 h-4 mr-2" />
          Auctions ({stats?.auctions.total || 0})
          <Badge variant="outline" className="ml-2 text-[8px] px-1 h-3 border-[#B8071C] text-[#B8071C]">Weekend Only</Badge>
        </Button>
        <Button
          onClick={() => {
            const tab: TabType = "karkey-cars"
            setActiveTab(tab)
            const ceoTab = searchParams?.get("ceoTab")
            const base = pathname.split("?")[0]
            const qs = ceoTab ? `?ceoTab=${encodeURIComponent(ceoTab)}&statsTab=${tab}` : `?statsTab=${tab}`
            router.push(`${base}${qs}`)
          }}
          variant={activeTab === "karkey-cars" ? "default" : "outline"}
          className={activeTab === "karkey-cars" ? "bg-[#B8071C] hover:bg-[#910515]" : ""}
        >
          <Car className="w-4 h-4 mr-2" />
          Karkey Cars ({stats?.karkeyCars.total || 0})
        </Button>
      </div>

      {/* Tab Content - Fixed min-height to prevent layout shift */}
      <div className="min-h-[600px]">
        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Users"
                value={formatNumber(stats?.users.total || 0)}
                icon={Users}
                description={`+${stats?.users.newThisWeek || 0} this week`}
                trend={getTrend(stats?.users.growth)}
                trendValue={`${stats?.users.growth || 0}%`}
                loading={loading}
              />
              <StatCard
                title="Verified Users"
                value={formatNumber(stats?.users.verified || 0)}
                icon={UserCheck}
                description={`${Math.round((stats?.users.verified || 0) / (stats?.users.total || 1) * 100)}% verification rate`}
                loading={loading}
              />
              <StatCard
                title="New Today"
                value={stats?.users.newToday || 0}
                icon={CalendarDays}
                loading={loading}
              />
              <StatCard
                title="New This Week"
                value={stats?.users.newThisWeek || 0}
                icon={TrendingUp}
                loading={loading}
              />
            </div>

            {/* Verifications */}
            <Card className="border border-gray-100 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <div className="w-7 h-7 rounded-lg bg-slate-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  Pending Verifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <MiniStatCard
                    title="User Verifications"
                    value={stats?.verifications.pendingUsers || 0}
                    icon={Users}
                    loading={loading}
                  />
                  <MiniStatCard
                    title="Vehicle Verifications"
                    value={stats?.verifications.pendingVehicles || 0}
                    icon={Car}
                    loading={loading}
                  />
                  <MiniStatCard
                    title="Total Pending"
                    value={stats?.verifications.total || 0}
                    icon={Clock}
                    loading={loading}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Auctions Tab */}
        {activeTab === "auctions" && (
          <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Auctions"
                value={formatNumber(stats?.auctions.total || 0)}
                icon={Gavel}
                description={`+${stats?.auctions.newThisWeek || 0} this week`}
                trend={getTrend(stats?.auctions.growth)}
                trendValue={`${stats?.auctions.growth || 0}%`}
                loading={loading}
              />
              <StatCard
                title="Active Auctions"
                value={stats?.auctions.active || 0}
                icon={Activity}
                description={`${stats?.auctions.endingToday || 0} ending today`}
                loading={loading}
              />
              <StatCard
                title="Completed"
                value={stats?.auctions.completed || 0}
                icon={CheckCircle2}
                loading={loading}
              />
              <StatCard
                title="Auction Vehicles"
                value={stats?.auctions.vehicles || 0}
                icon={Car}
                description={`${stats?.auctions.approvedVehicles || 0} approved`}
                loading={loading}
              />
            </div>

            {/* Bids Overview */}
            <Card className="border border-gray-100 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <div className="w-7 h-7 rounded-lg bg-[#B8071C]/10 flex items-center justify-center">
                    <Hammer className="w-3.5 h-3.5 text-[#B8071C]" />
                  </div>
                  Bids Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <MiniStatCard
                    title="Total Bids"
                    value={formatNumber(stats?.auctions.totalBids || 0)}
                    icon={Hammer}
                    loading={loading}
                  />
                  <MiniStatCard
                    title="Bids Today"
                    value={stats?.auctions.bidsToday || 0}
                    icon={CalendarDays}
                    loading={loading}
                  />
                  <MiniStatCard
                    title="Avg Bids/Auction"
                    value={stats?.auctions.avgBidsPerAuction || 0}
                    icon={Activity}
                    loading={loading}
                  />
                  <MiniStatCard
                    title="Highest Bid Today"
                    value={stats?.auctions.highestBidToday ? formatPrice(stats.auctions.highestBidToday) : "—"}
                    icon={Award}
                    loading={loading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Top Brands & Cities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TopList
                title="Top Brands"
                icon={BarChart3}
                items={stats?.auctions.topBrands || []}
                loading={loading}
              />
              <TopList
                title="Top Cities"
                icon={MapPin}
                items={stats?.auctions.topCities || []}
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* Karkey Cars Tab */}
        {activeTab === "karkey-cars" && (
          <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Listings"
                value={formatNumber(stats?.karkeyCars.total || 0)}
                icon={Car}
                description={`+${stats?.karkeyCars.newThisWeek || 0} this week`}
                trend={getTrend(stats?.karkeyCars.growth)}
                trendValue={`${stats?.karkeyCars.growth || 0}%`}
                loading={loading}
              />
              <StatCard
                title="New Today"
                value={stats?.karkeyCars.newToday || 0}
                icon={CalendarDays}
                loading={loading}
              />
              <StatCard
                title="New This Week"
                value={stats?.karkeyCars.newThisWeek || 0}
                icon={TrendingUp}
                loading={loading}
              />
              <StatCard
                title="Total Inquiries"
                value={formatNumber(stats?.karkeyCars.inquiries || 0)}
                icon={MessageSquare}
                description="User interest submissions"
                loading={loading}
              />
            </div>

            {/* Top Brands & Cities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TopList
                title="Top Brands"
                icon={BarChart3}
                items={stats?.karkeyCars.topBrands || []}
                loading={loading}
              />
              <TopList
                title="Top Cities"
                icon={MapPin}
                items={stats?.karkeyCars.topCities || []}
                loading={loading}
              />
            </div>
          </div>
        )}
        {/* End of Tabs */}
      </div>
    </div>
  )
}
