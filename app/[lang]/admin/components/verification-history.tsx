"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    CheckCircle,
    XCircle,
    Search,
    Calendar,
    Clock,
    Filter,
    ChevronRight
} from "lucide-react"

export type StatsPeriod = "today" | "month" | "year" | "all"

interface VerificationLog {
    entity_id: number;
    entity_name: string | null;
    admin_name: string | null;
    action: "approved" | "rejected";
    created_at: string;
    entity_type: string;
    reason?: string | null;
}

interface VerificationHistoryProps {
    stats: any
}

export function VerificationHistorySection({ stats }: VerificationHistoryProps) {
    const historyLogs = useMemo<VerificationLog[]>(() =>
        Array.isArray(stats?.verificationHistory) ? stats.verificationHistory : [],
        [stats?.verificationHistory])

    const [searchTerm, setSearchTerm] = useState("")
    const [activeFilter, setActiveFilter] = useState<"all" | "approved" | "rejected">("all")

    const filteredLogs = useMemo(() => {
        let logs = historyLogs
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase()
            logs = logs.filter((log: VerificationLog) =>
                log.entity_name?.toLowerCase().includes(term) ||
                log.admin_name?.toLowerCase().includes(term)
            )
        }
        if (activeFilter !== "all") {
            logs = logs.filter((log: VerificationLog) => log.action === activeFilter)
        }
        return logs
    }, [historyLogs, searchTerm, activeFilter])

    const statsSummary = useMemo(() => ({
        total: historyLogs.length,
        approved: historyLogs.filter(l => l.action === "approved").length,
        rejected: historyLogs.filter(l => l.action === "rejected").length
    }), [historyLogs])

    if (historyLogs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-2xl border border-slate-100 backdrop-blur-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No Activity Yet</h3>
                <p className="text-sm text-slate-500 mt-1 text-center max-w-xs">
                    Recent verification and review actions will appear here once processed by your team.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Premium Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Review Excellence</h2>
                    <p className="text-slate-500 mt-1 font-medium">Monitoring platform integrity and verification standards.</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[100px]">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total</span>
                        <span className="text-2xl font-black text-[#1e293b]">{statsSummary.total}</span>
                    </div>
                    <div className="px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[100px]">
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest leading-none mb-1 text-center">Approved</span>
                        <span className="text-2xl font-black text-emerald-600">{statsSummary.approved}</span>
                    </div>
                    <div className="px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center min-w-[100px]">
                        <span className="text-xs font-bold text-rose-500 uppercase tracking-widest leading-none mb-1 text-center">Rejected</span>
                        <span className="text-2xl font-black text-rose-600">{statsSummary.rejected}</span>
                    </div>
                </div>
            </div>

            {/* Modern Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 p-1 bg-slate-100/50 rounded-xl backdrop-blur-sm border border-white">
                    <button
                        onClick={() => setActiveFilter("all")}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeFilter === "all" ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        All Activity
                    </button>
                    <button
                        onClick={() => setActiveFilter("approved")}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeFilter === "approved" ? "bg-emerald-500 text-white shadow-md shadow-emerald-100" : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Approvals
                    </button>
                    <button
                        onClick={() => setActiveFilter("rejected")}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeFilter === "rejected" ? "bg-rose-500 text-white shadow-md shadow-rose-100" : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Rejections
                    </button>
                </div>

                <div className="relative group min-w-[300px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#B8071C]" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by vehicle or admin..."
                        className="pl-11 h-11 bg-white border-slate-200 rounded-xl focus:border-[#B8071C] focus:ring-1 focus:ring-[#B8071C] transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="relative space-y-6">
                <div className="absolute left-[31px] top-4 bottom-4 w-px bg-gradient-to-b from-[#B8071C]/20 via-slate-100 to-transparent" />

                {filteredLogs.length > 0 ? (
                    filteredLogs.map((log, idx) => {
                        const isApproved = log.action === "approved"
                        const date = new Date(log.created_at)

                        return (
                            <div key={`${log.entity_id}-${idx}`} className="relative pl-16 group">
                                {/* Timeline Dot */}
                                <div className={`absolute left-0 top-0 w-16 h-16 flex items-center justify-center`}>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm border-2 ${isApproved
                                        ? "bg-emerald-50 border-emerald-100 group-hover:bg-emerald-100"
                                        : "bg-rose-50 border-rose-100 group-hover:bg-rose-100"
                                        }`}>
                                        {isApproved
                                            ? <CheckCircle className="w-6 h-6 text-emerald-600" />
                                            : <XCircle className="w-6 h-6 text-rose-600" />
                                        }
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-0.5 border-r-4"
                                    style={{ borderRightColor: isApproved ? '#10b981' : '#f43f5e' }}>
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${isApproved ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                                    }`}>
                                                    {log.action}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                    <span className="opacity-30">•</span>
                                                    {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            </div>

                                            <h4 className="text-lg font-bold text-slate-900 group-hover:text-[#B8071C] transition-colors flex items-center gap-2">
                                                {log.entity_name || `Reference #${log.entity_id}`}
                                                <ChevronRight className="w-4 h-4 text-slate-300 transition-transform group-hover:translate-x-1" />
                                            </h4>

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                                    <div className="w-5 h-5 rounded-md bg-[#1e293b] text-white flex items-center justify-center text-[10px] font-bold">
                                                        {log.admin_name?.charAt(0)?.toUpperCase() || "A"}
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-600">{log.admin_name}</span>
                                                </div>

                                                {log.reason && (
                                                    <div className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded border border-amber-100 flex items-center gap-1.5">
                                                        <Filter className="w-3 h-3" />
                                                        {log.reason}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Entity Type</p>
                                                <p className="text-xs font-bold text-slate-700 underline decoration-slate-100 underline-offset-4">{log.entity_type === 'vehicle' ? 'Vehicle Listing' : 'User profile'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="py-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium italic">No matches found for your current filters.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
