"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Calendar,
    DollarSign,
    Clock,
    TrendingUp,
    TrendingDown,
    CreditCard,
    ArrowUpRight,
    BarChart3,
    Wallet,
} from "lucide-react"

export function FinanceSection() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadFinanceStats()
    }, [])

    const loadFinanceStats = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/finance")
            const data = await res.json()
            if (data.success) {
                setStats(data.stats)
            }
        } catch (error) {
            console.error("Failed to load finance stats:", error)
        }
        setLoading(false)
    }

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat("fr-MA", {
            style: "decimal",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount) + " MAD"
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            succeeded: "bg-emerald-50 text-emerald-700 border-emerald-200",
            paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
            active: "bg-emerald-50 text-emerald-700 border-emerald-200",
            pending: "bg-slate-100 text-slate-700 border-slate-200",
            failed: "bg-red-50 text-red-700 border-red-200",
            refunded: "bg-blue-50 text-blue-700 border-blue-200",
            issued: "bg-blue-50 text-blue-700 border-blue-200",
            expired: "bg-gray-50 text-gray-600 border-gray-200",
            cancelled: "bg-gray-50 text-gray-600 border-gray-200",
            void: "bg-gray-50 text-gray-600 border-gray-200"
        }
        return styles[status] || "bg-gray-50 text-gray-600 border-gray-200"
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A651]"></div>
            </div>
        )
    }

    // Fallback values if stats are missing
    const revenue = stats?.overview?.totalRevenue || 0
    const subscriptionIncome = stats?.overview?.subscriptionIncome || 0 // Assuming this might exist in future or is part of revenue
    const pendingPayments = stats?.overview?.pendingPayments || 0
    const recentTransactions = stats?.recentTransactions || []

    // Mock data for visualization if real data is missing structure
    const displayTransactions = recentTransactions.length > 0 ? recentTransactions : []


    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-[#103090] flex items-center gap-3">
                    <span className="p-2 bg-emerald-50 rounded-lg">
                        <DollarSign className="w-6 h-6 text-[#00A651]" />
                    </span>
                    Financial Overview
                </h2>
                <p className="text-slate-500 mt-2 ml-1">Track revenue, subscriptions, and financial performance</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg rounded-3xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00A651] to-[#007a3d]" />
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                        <Wallet className="w-24 h-24 text-white" />
                    </div>
                    <CardContent className="relative p-8 text-white h-40 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <p className="font-medium text-emerald-100 uppercase tracking-wider text-xs">Total Revenue</p>
                            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                                <DollarSign className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div className="text-4xl font-black tracking-tight">
                            {formatPrice(revenue)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg rounded-3xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#103090] to-[#0a1e5c]" />
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                        <CreditCard className="w-24 h-24 text-white" />
                    </div>
                    <CardContent className="relative p-8 text-white h-40 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <p className="font-medium text-blue-100 uppercase tracking-wider text-xs">Subscription Income</p>
                            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                                <CreditCard className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div className="text-4xl font-black tracking-tight">
                            {/* Placeholder if not separate */}
                            {formatPrice(stats?.overview?.totalDeposits || 0)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg rounded-3xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#DEB735] to-[#b3901b]" />
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                        <TrendingUp className="w-24 h-24 text-white" />
                    </div>
                    <CardContent className="relative p-8 text-white h-40 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <p className="font-medium text-amber-100 uppercase tracking-wider text-xs">Pending Payments</p>
                            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                                <Clock className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div className="text-4xl font-black tracking-tight">
                            {formatPrice(pendingPayments)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Transactions */}
                <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-100 px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                                    <ArrowUpRight className="w-5 h-5 text-[#00A651]" />
                                </div>
                                <CardTitle className="text-[#103090]">Recent Transactions</CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {displayTransactions.length > 0 ? displayTransactions.slice(0, 5).map((transaction: any) => (
                                <div key={transaction.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${transaction.status === 'succeeded'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : transaction.status === 'pending'
                                                    ? 'bg-slate-50 text-slate-600'
                                                    : 'bg-red-50 text-red-600'
                                            }`}>
                                            <DollarSign className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{transaction.full_name || transaction.username || "User"}</p>
                                            <p className="text-xs text-slate-500 capitalize mt-0.5">{transaction.provider} • {formatDate(transaction.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-lg ${transaction.status === 'succeeded' ? 'text-[#00A651]' : 'text-slate-600'}`}>
                                            {transaction.status === 'refunded' ? '-' : '+'}{formatPrice(transaction.amount).replace(' MAD', '')} <span className="text-xs text-slate-400">MAD</span>
                                        </p>
                                        <Badge variant="outline" className={`text-[10px] uppercase font-bold border-0 ${getStatusBadge(transaction.status)}`}>
                                            {transaction.status}
                                        </Badge>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-12 text-center text-slate-500">
                                    <Clock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                    <p>No recent transactions</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue Chart Placeholder */}
                <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-100 px-8 py-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                                <BarChart3 className="w-5 h-5 text-[#103090]" />
                            </div>
                            <CardTitle className="text-[#103090]">Revenue Analytics</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 flex items-center justify-center min-h-[300px]">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                                <BarChart3 className="w-10 h-10 text-slate-300" />
                            </div>
                            <div>
                                <p className="text-slate-600 font-medium">Chart Visualization</p>
                                <p className="text-slate-400 text-sm">Revenue trends over the last 30 days</p>
                            </div>
                            <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 cursor-not-allowed opacity-50" disabled>
                                Download Report (Coming Soon)
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
