"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CreditCard,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Crown
} from "lucide-react"
import { getAdminRole } from "../actions"
import { useToast } from "@/hooks/use-toast"

interface SubscriptionStats {
  total: number
  active: number
  pending: number
  expired: number
  cancelled: number
  monthlyRevenue: number
  byPlan: {
    plan_name: string
    price: number
    currency: string
    subscriber_count: number
  }[]
  recent: {
    id: number
    status: string
    created_at: string
    plan_name: string
    plan_price: number
    plan_currency: string
    username: string
    email: string
  }[]
}

type AdminRole = "ceo" | "verification" | "finance" | "support"

export default function SubscriptionStatsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null)
  const [adminInfo, setAdminInfo] = useState<{ nom: string; prenom: string } | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const roleResult = await getAdminRole()
      if (!roleResult || !roleResult.role) {
        router.push("/admin/login")
        return
      }
      setAdminRole(roleResult.role as AdminRole)
      if (roleResult.nom && roleResult.prenom) {
        setAdminInfo({ nom: roleResult.nom, prenom: roleResult.prenom })
      }
      fetchStats()
    } catch (err) {
      router.push("/admin/login")
    }
  }

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/subscriptions?stats=true", { credentials: "include" })
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load stats",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load subscription stats",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSubscriptionStatus = async (id: number, status: string) => {
    try {
      const res = await fetch("/api/subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, status })
      })
      const data = await res.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Subscription status updated"
        })
        fetchStats()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500 text-white">Active</Badge>
      case 'pending':
        return <Badge className="bg-slate-500 text-white">Pending</Badge>
      case 'expired':
        return <Badge className="bg-gray-500 text-white">Expired</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPlanIcon = (name?: string) => {
    if (!name) return <CreditCard className="w-5 h-5" />
    const lower = name.toLowerCase()
    if (lower.includes("prestige") || lower.includes("enterprise")) return <Crown className="w-5 h-5" />
    if (lower.includes("accelerator") || lower.includes("pro")) return <Zap className="w-5 h-5" />
    return <CreditCard className="w-5 h-5" />
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#B8071C]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-600 hover:text-[#B8071C] transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-[#B8071C]">Karkey</span>
                <Badge className="bg-[#B8071C] text-white">CEO</Badge>
              </div>
              <span className="text-gray-600 ml-2">{adminInfo ? `${adminInfo.prenom} ${adminInfo.nom}` : ""}</span>
            </div>
            <Button onClick={fetchStats} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-[#B8071C]" />
            Subscription Statistics
          </h1>
          <p className="text-gray-600 mt-1">Overview of all user subscriptions and revenue</p>
        </div>

        {stats && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              <Card className="border border-gray-100 bg-white hover:border-[#B8071C] transition-colors shadow-sm hover:shadow-md group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-[#B8071C]/10 transition-colors">
                      <Users className="w-5 h-5 text-[#B8071C] group-hover:text-[#B8071C]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-100 bg-white hover:border-[#B8071C] transition-colors shadow-sm hover:shadow-md group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-[#B8071C]/10 transition-colors">
                      <CheckCircle className="w-5 h-5 text-emerald-600 group-hover:text-[#B8071C]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Active</p>
                      <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-100 bg-white hover:border-[#B8071C] transition-colors shadow-sm hover:shadow-md group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-[#B8071C]/10 transition-colors">
                      <Clock className="w-5 h-5 text-slate-600 group-hover:text-[#B8071C]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pending</p>
                      <p className="text-2xl font-bold text-slate-600">{stats.pending}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-100 bg-white hover:border-[#B8071C] transition-colors shadow-sm hover:shadow-md group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg group-hover:bg-[#B8071C]/10 transition-colors">
                      <XCircle className="w-5 h-5 text-red-600 group-hover:text-[#B8071C]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cancelled</p>
                      <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-[#B8071C] to-[#910515] text-white border border-gray-100 hover:border-[#B8071C] transition-colors shadow-sm hover:shadow-md group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-white/80">Monthly Revenue</p>
                      <p className="text-2xl font-bold">{stats.monthlyRevenue} DH</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Plans Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="border border-gray-100 bg-white hover:border-[#B8071C] transition-colors shadow-sm hover:shadow-md group">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#B8071C]" />
                    Subscribers by Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.byPlan.map((plan, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-transparent group-hover:border-[#B8071C] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#B8071C]/10 rounded-lg text-[#B8071C] group-hover:bg-[#B8071C]/20 transition-colors">
                            {getPlanIcon(plan.plan_name)}
                          </div>
                          <div>
                            <p className="font-semibold">{plan.plan_name}</p>
                            <p className="text-sm text-gray-500">{plan.price} {plan.currency}/month</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#B8071C]">{plan.subscriber_count}</p>
                          <p className="text-xs text-gray-500">subscribers</p>
                        </div>
                      </div>
                    ))}
                    {stats.byPlan.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No plans found</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Subscriptions */}
              <Card className="border border-gray-100 bg-white hover:border-[#B8071C] transition-colors shadow-sm hover:shadow-md group">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#B8071C]" />
                    Recent Subscriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.recent.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-transparent group-hover:border-[#B8071C] transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{sub.username || sub.email}</p>
                            {getStatusBadge(sub.status)}
                          </div>
                          <p className="text-sm text-gray-500">
                            {sub.plan_name} • {formatDate(sub.created_at)}
                          </p>
                        </div>
                        {/* Admins cannot manually activate subscriptions; activation occurs after payment */}
                      </div>
                    ))}
                    {stats.recent.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No subscriptions yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border border-gray-100 bg-white hover:border-[#B8071C] transition-colors shadow-sm hover:shadow-md group">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Link href="/admin/plans">
                    <Button variant="outline">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage Plans
                    </Button>
                  </Link>
                  <Link href="/api/subscriptions?all=true" target="_blank">
                    <Button variant="outline">
                      Export All Subscriptions
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
