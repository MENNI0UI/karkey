"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Users,
  Gavel,
  Car,
  Calendar,
  RefreshCw
} from "lucide-react"

interface ChartData {
  auctions?: {
    daily: { date: string; count: number }[]
    byStatus: { status: string; count: number }[]
    topBrands: { brand: string; count: number }[]
  }
  users?: {
    daily: { date: string; count: number }[]
    byType: { type: string; count: number }[]
    byStatus: { status: string; count: number }[]
  }
  vehicles?: {
    daily: { date: string; count: number }[]
    byType: { type: string; count: number }[]
    topCities: { city: string; count: number }[]
  }
}

export function ChartsSection() {
  const [period, setPeriod] = useState("month")
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<ChartData | null>(null)

  useEffect(() => {
    loadChartData()
  }, [period])

  const loadChartData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/charts?period=${period}`)
      const result = await res.json()
      if (result.success) {
        setChartData(result.data)
      }
    } catch (error) {
      console.error("Failed to load chart data:", error)
    }
    setLoading(false)
  }

  const periodLabels: Record<string, string> = {
    week: "Last 7 Days",
    month: "Last 30 Days",
    year: "Last 12 Months"
  }

  // Calculate trends
  const calculateTrend = (data: { count: number }[] | undefined): { change: number; isUp: boolean } => {
    if (!data || data.length < 2) return { change: 0, isUp: true }
    const mid = Math.floor(data.length / 2)
    const firstHalf = data.slice(0, mid).reduce((sum, d) => sum + d.count, 0)
    const secondHalf = data.slice(mid).reduce((sum, d) => sum + d.count, 0)
    const change = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0
    return { change: Math.abs(Math.round(change)), isUp: change >= 0 }
  }

  const auctionTrend = useMemo(() => calculateTrend(chartData?.auctions?.daily), [chartData])
  const userTrend = useMemo(() => calculateTrend(chartData?.users?.daily), [chartData])
  const vehicleTrend = useMemo(() => calculateTrend(chartData?.vehicles?.daily), [chartData])

  // Find max values for scaling
  const getMaxCount = (data: { count: number }[] | undefined) => {
    if (!data || data.length === 0) return 1
    return Math.max(...data.map(d => d.count), 1)
  }

  return (
    <div className="space-y-6" style={{ minHeight: '900px' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#B8071C]/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#B8071C]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h2>
            <p className="text-sm text-gray-500">{periodLabels[period]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="year">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadChartData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ minHeight: '800px' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border border-gray-100">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : chartData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ minHeight: '800px' }}>
          {/* Auctions Activity Chart */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-blue-600" />
                  Auctions Activity
                </CardTitle>
                <div className={`flex items-center gap-1 text-xs ${auctionTrend.isUp ? "text-emerald-600" : "text-red-600"}`}>
                  {auctionTrend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {auctionTrend.change}%
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                {chartData.auctions?.daily && chartData.auctions.daily.length > 0 ? (
                  <div className="flex items-end h-full gap-1">
                    {chartData.auctions.daily.map((d, i) => {
                      const maxCount = getMaxCount(chartData.auctions?.daily)
                      const height = (d.count / maxCount) * 100
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group cursor-pointer"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                            <div className="font-medium">{d.count}</div>
                            <div className="text-gray-400">{d.date}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No auction data
                  </div>
                )}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{chartData.auctions?.daily?.[0]?.date || ""}</span>
                <span>{chartData.auctions?.daily?.[chartData.auctions.daily.length - 1]?.date || ""}</span>
              </div>
            </CardContent>
          </Card>

          {/* Users Registration Chart */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  User Registrations
                </CardTitle>
                <div className={`flex items-center gap-1 text-xs ${userTrend.isUp ? "text-emerald-600" : "text-red-600"}`}>
                  {userTrend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {userTrend.change}%
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                {chartData.users?.daily && chartData.users.daily.length > 0 ? (
                  <div className="flex items-end h-full gap-1">
                    {chartData.users.daily.map((d, i) => {
                      const maxCount = getMaxCount(chartData.users?.daily)
                      const height = (d.count / maxCount) * 100
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-emerald-500 rounded-t hover:bg-emerald-600 transition-colors relative group cursor-pointer"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                            <div className="font-medium">{d.count}</div>
                            <div className="text-gray-400">{d.date}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No user data
                  </div>
                )}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{chartData.users?.daily?.[0]?.date || ""}</span>
                <span>{chartData.users?.daily?.[chartData.users.daily.length - 1]?.date || ""}</span>
              </div>
            </CardContent>
          </Card>

          {/* Auction Status Distribution */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                Auction Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.auctions?.byStatus && chartData.auctions.byStatus.length > 0 ? (
                <div className="space-y-3">
                  {chartData.auctions.byStatus.map((item, i) => {
                    const total = chartData.auctions!.byStatus.reduce((sum, s) => sum + s.count, 0)
                    const percentage = total > 0 ? (item.count / total) * 100 : 0
                    const colors: Record<string, { bar: string; bg: string; text: string }> = {
                      active: { bar: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
                      completed: { bar: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
                      pending: { bar: "bg-slate-500", bg: "bg-slate-50", text: "text-slate-700" },
                      cancelled: { bar: "bg-red-500", bg: "bg-red-50", text: "text-red-700" }
                    }
                    const color = colors[item.status.toLowerCase()] || { bar: "bg-gray-500", bg: "bg-gray-50", text: "text-gray-700" }
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{item.status}</span>
                          <div className="flex items-center gap-2">
                            <Badge className={`${color.bg} ${color.text}`}>{item.count}</Badge>
                            <span className="text-xs text-gray-400">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${color.bar} rounded-full`}
                            style={{ width: `${percentage}%`, transition: 'width 500ms ease' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400">
                  No status data
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Types Distribution */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                User Types Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.users?.byType && chartData.users.byType.length > 0 ? (
                <div className="space-y-3">
                  {chartData.users.byType.map((item, i) => {
                    const total = chartData.users!.byType.reduce((sum, s) => sum + s.count, 0)
                    const percentage = total > 0 ? (item.count / total) * 100 : 0
                    const colors: Record<string, { bar: string; bg: string; text: string }> = {
                      individual: { bar: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
                      dealer: { bar: "bg-purple-500", bg: "bg-purple-50", text: "text-purple-700" },
                      company: { bar: "bg-slate-500", bg: "bg-slate-50", text: "text-slate-700" }
                    }
                    const color = colors[item.type.toLowerCase()] || { bar: "bg-gray-500", bg: "bg-gray-50", text: "text-gray-700" }
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{item.type}</span>
                          <div className="flex items-center gap-2">
                            <Badge className={`${color.bg} ${color.text}`}>{item.count}</Badge>
                            <span className="text-xs text-gray-400">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${color.bar} rounded-full`}
                            style={{ width: `${percentage}%`, transition: 'width 500ms ease' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400">
                  No type data
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Brands Chart */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Car className="w-4 h-4 text-slate-600" />
                Top Brands
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.auctions?.topBrands && chartData.auctions.topBrands.length > 0 ? (
                <div className="space-y-2">
                  {chartData.auctions.topBrands.slice(0, 6).map((brand, i) => {
                    const maxCount = chartData.auctions!.topBrands[0]?.count || 1
                    const percentage = (brand.count / maxCount) * 100
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs flex items-center justify-center font-medium">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm font-medium">{brand.brand}</span>
                            <span className="text-sm text-gray-500">{brand.count}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400">
                  No brand data
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Cities Chart */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-600" />
                Top Cities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.vehicles?.topCities && chartData.vehicles.topCities.length > 0 ? (
                <div className="space-y-2">
                  {chartData.vehicles.topCities.slice(0, 6).map((city, i) => {
                    const maxCount = chartData.vehicles!.topCities[0]?.count || 1
                    const percentage = (city.count / maxCount) * 100
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 text-white text-xs flex items-center justify-center font-medium">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm font-medium">{city.city}</span>
                            <span className="text-sm text-gray-500">{city.count}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400">
                  No city data
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No chart data available</p>
        </div>
      )}
    </div>
  )
}
