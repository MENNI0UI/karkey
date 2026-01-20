"use client"

import { useState, useEffect, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CheckCircle, Clock, XCircle, Search, ChevronLeft, ChevronRight, User } from "lucide-react"

export type StatsPeriod = "today" | "month" | "year" | "all"

interface VerificationHistoryProps {
  stats: any
  statsPeriod?: StatsPeriod
  onPeriodChange?: (period: StatsPeriod) => void
}

export function VerificationHistorySection({ stats }: VerificationHistoryProps) {
  const groupedHistory = buildGroupedHistory(stats?.verificationHistory)
  const hasHistory = groupedHistory.length > 0

  const historyLogs = Array.isArray(stats?.verificationHistory) ? stats?.verificationHistory : []
  const actionsByDate = useMemo(() => buildActionsByDate(historyLogs), [historyLogs])
  const availableDates = useMemo(() => Array.from(actionsByDate.keys()).sort((a, b) => b.localeCompare(a)), [actionsByDate])
  const [selectedDate, setSelectedDate] = useState<string | null>(availableDates[0] || null)
  const [calendarDate, setCalendarDate] = useState<Date>(() => (availableDates[0] ? parseDateKeyToLocalDate(availableDates[0]) : new Date()))

  useEffect(() => {
    if (!availableDates.length) {
      setSelectedDate(null)
      setCalendarDate(new Date())
      return
    }
    setSelectedDate((prev) => (prev && availableDates.includes(prev) ? prev : availableDates[0]))
    setCalendarDate((prev) => {
      const fallback = parseDateKeyToLocalDate(availableDates[0])
      if (!prev) return fallback
      const prevKey = toDateKeyLocal(prev)
      return availableDates.includes(prevKey) ? prev : fallback
    })
  }, [availableDates])

  const calendarWeeks = useMemo(() => buildCalendarWeeks(calendarDate, actionsByDate), [calendarDate, actionsByDate])

  const [searchTerm, setSearchTerm] = useState("")
  const filteredAdmins = useMemo(() => {
    if (!hasHistory) return []
    const term = searchTerm.trim().toLowerCase()
    return groupedHistory.filter((group) => !term || group.adminName.toLowerCase().includes(term))
  }, [groupedHistory, hasHistory, searchTerm])

  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null)
  useEffect(() => {
    if (!hasHistory || filteredAdmins.length === 0) {
      setSelectedAdmin(null)
      return
    }
    const exists = selectedAdmin && filteredAdmins.some((g) => g.adminName === selectedAdmin)
    if (!exists) setSelectedAdmin(filteredAdmins[0]?.adminName ?? null)
  }, [filteredAdmins, hasHistory, selectedAdmin])

  const selectedAdminData = groupedHistory.find((g) => g.adminName === selectedAdmin)
  const adminStats = useMemo(() => (selectedAdminData ? buildAdminPersonalStats(selectedAdminData.logs) : null), [selectedAdminData])

  if (!hasHistory) {
    return (
      <div className="mt-6 mb-6 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="p-8 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">No verification history yet</p>
          <p className="text-slate-400 text-sm mt-1">Admin actions will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 mb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#B8071C] rounded-xl flex items-center justify-center">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Verification History</h2>
          <p className="text-sm text-slate-500">Track admin verification actions</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px,1fr]">
        {/* Sidebar: Admin List */}
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700">Admins</span>
              <Badge variant="secondary" className="bg-[#B8071C]/10 text-[#B8071C] border-0 text-xs">
                {groupedHistory.length}
              </Badge>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search admins..."
                className="pl-9 h-9 text-sm bg-white border-slate-200 focus:border-[#B8071C] focus:ring-[#B8071C]/20"
              />
            </div>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {filteredAdmins.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">No admins found</div>
            ) : (
              filteredAdmins.map((group) => {
                const isSelected = selectedAdmin === group.adminName
                return (
                  <button
                    key={group.adminName}
                    type="button"
                    onClick={() => setSelectedAdmin(group.adminName)}
                    className={`w-full px-4 py-3 flex items-center gap-3 border-b border-slate-50 transition-colors ${
                      isSelected ? "bg-[#B8071C]/5 border-l-2 border-l-[#B8071C]" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold ${
                      isSelected ? "bg-[#B8071C] text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {group.adminName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className={`text-sm font-medium truncate heading-font ${isSelected ? "text-[#B8071C]" : "text-slate-700"}`}>
                        {group.adminName}
                      </p>
                      <p className="text-xs text-slate-400">{group.logs.length} actions</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-emerald-600 font-medium">{group.approvedCount}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-red-500 font-medium">{group.rejectedCount}</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {selectedAdminData && adminStats ? (
            <>
              {/* Admin Stats Header */}
              <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#B8071C] text-white flex items-center justify-center text-lg font-bold">
                      {selectedAdminData.adminName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-800">{selectedAdminData.adminName}</h3>
                      <p className="text-xs text-slate-400">
                        {selectedAdminData.lastActionAt
                          ? `Last active ${new Date(selectedAdminData.lastActionAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                          : "No recent activity"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <StatBox label="Today" value={adminStats.today.total} approved={adminStats.today.approved} rejected={adminStats.today.rejected} color="blue" />
                    <StatBox label="Month" value={adminStats.month.total} approved={adminStats.month.approved} rejected={adminStats.month.rejected} color="slate" />
                    <StatBox label="All Time" value={adminStats.allTime.total} approved={adminStats.allTime.approved} rejected={adminStats.allTime.rejected} color="slate" />
                  </div>
                </div>
              </div>

              {/* Calendar & Actions */}
              <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="grid lg:grid-cols-[280px,1fr] divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                  {/* Calendar */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={() => setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-semibold text-slate-700">
                        {calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400 uppercase mb-2">
                      {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarWeeks.flat().map((day) => {
                        const isSelected = selectedDate === day.dateKey
                        const isToday = toDateKeyLocal(new Date()) === day.dateKey
                        const hasAdminActivity = selectedAdminData.logs.some((log) => log?.created_at && toDateKeyLocal(new Date(log.created_at)) === day.dateKey)
                        return (
                          <button
                            key={day.dateKey}
                            type="button"
                            onClick={() => { setSelectedDate(day.dateKey); setCalendarDate(parseDateKeyToLocalDate(day.dateKey)) }}
                            className={`h-8 w-full rounded-lg text-xs font-medium transition-colors relative ${
                              isSelected
                                ? "bg-[#B8071C] text-white"
                                : day.isCurrentMonth
                                  ? isToday ? "bg-[#B8071C]/10 text-[#B8071C]" : "hover:bg-slate-100 text-slate-700"
                                  : "text-slate-300"
                            }`}
                          >
                            {day.label}
                            {hasAdminActivity && !isSelected && (
                              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Actions for Selected Date */}
                  <div className="p-4 h-[340px]">
                    {renderActionsForDate(selectedAdminData, selectedDate)}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-8 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm">Select an admin to view their activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, approved, rejected, color }: { label: string; value: number; approved: number; rejected: number; color: "blue" | "slate" | "slate" }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
      <div className="flex flex-col items-center justify-center">
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{label}</p>
      </div>
      <div className="h-8 w-px bg-slate-200" />
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-[#B8071C]" />
          <span className="text-xs font-semibold text-[#B8071C]">{approved}</span>
        </div>
        <div className="flex items-center gap-1">
          <XCircle className="w-3 h-3 text-rose-600" />
          <span className="text-xs font-semibold text-rose-600">{rejected}</span>
        </div>
      </div>
    </div>
  )
}

function renderActionsForDate(adminData: GroupedAdminHistory, selectedDate: string | null) {
  if (!selectedDate) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
        Select a date to view actions
      </div>
    )
  }

  const logsForDate = adminData.logs.filter((log) => log?.created_at && toDateKeyLocal(new Date(log.created_at)) === selectedDate)
  const formattedDate = parseDateKeyToLocalDate(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
  const stats = {
    total: logsForDate.length,
    approved: logsForDate.filter((l) => l.action === "approved").length,
    rejected: logsForDate.filter((l) => l.action === "rejected").length,
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
        <div>
          <p className="text-sm font-semibold text-slate-700">{formattedDate}</p>
          <p className="text-xs text-slate-400">{logsForDate.length} action{logsForDate.length !== 1 ? "s" : ""}</p>
        </div>
        {logsForDate.length > 0 && (
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 font-medium">+{stats.approved} approved</span>
            <span className="px-2 py-1 rounded-md bg-red-50 text-red-500 font-medium">-{stats.rejected} rejected</span>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto max-h-[250px] space-y-2 pr-1" style={{ scrollbarGutter: 'stable' }}>
        {logsForDate.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm py-8">
            No actions on this date
          </div>
        ) : (
          logsForDate.map((log, idx) => {
            const isApproved = log.action === "approved"
            return (
              <div
                key={`${log.entity_type}-${log.entity_id}-${idx}`}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isApproved ? "bg-emerald-100" : "bg-red-100"}`}>
                    {isApproved ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate heading-font">
                      {log.entity_type === "user" ? "User" : "Vehicle"}: {log.entity_name || `#${log.entity_id}`}
                    </p>
                    {log.entity_type === "user" && log.cin_number && (
                      <p className="text-[10px] text-slate-500 truncate">CIN: {log.cin_number}</p>
                    )}
                    {log.reason && <p className="text-[10px] text-slate-400 truncate">{log.reason}</p>}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 flex-shrink-0">
                  {new Date(log.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Types & Functions
// ─────────────────────────────────────────────────────────────────────────────

interface GroupedAdminHistory {
  adminName: string
  logs: any[]
  approvedCount: number
  rejectedCount: number
  lastActionAt: string | null
}

interface AdminPersonalStats {
  today: { total: number; approved: number; rejected: number }
  month: { total: number; approved: number; rejected: number }
  allTime: { total: number; approved: number; rejected: number }
}

function buildAdminPersonalStats(logs: any[]): AdminPersonalStats {
  const now = new Date()
  const todayKey = toDateKeyLocal(now)
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const today = { total: 0, approved: 0, rejected: 0 }
  const month = { total: 0, approved: 0, rejected: 0 }
  const allTime = { total: 0, approved: 0, rejected: 0 }

  logs.forEach((log) => {
    if (!log?.created_at) return
    const date = new Date(log.created_at)
    const dateKey = toDateKeyLocal(date)
    const isApproved = log.action === "approved"

    allTime.total += 1
    if (isApproved) allTime.approved += 1
    else allTime.rejected += 1

    if (dateKey === todayKey) {
      today.total += 1
      if (isApproved) today.approved += 1
      else today.rejected += 1
    }

    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      month.total += 1
      if (isApproved) month.approved += 1
      else month.rejected += 1
    }
  })

  return { today, month, allTime }
}

function buildGroupedHistory(history?: any[]): GroupedAdminHistory[] {
  if (!Array.isArray(history) || history.length === 0) return []

  const historyByAdmin = history.reduce((acc: Record<string, any[]>, log: any) => {
    const adminName = log.admin_name || "Unknown"
    if (!acc[adminName]) acc[adminName] = []
    acc[adminName].push(log)
    return acc
  }, {})

  const toTimestamp = (value?: string | null) => (value ? new Date(value).getTime() : 0)

  return Object.entries(historyByAdmin)
    .map(([adminName, logs]) => {
      const sortedLogs = [...logs].sort((a, b) => toTimestamp(b.created_at) - toTimestamp(a.created_at))
      const approvedCount = logs.filter((log) => log.action === "approved").length
      const rejectedCount = logs.filter((log) => log.action === "rejected").length
      return { adminName, logs: sortedLogs, approvedCount, rejectedCount, lastActionAt: sortedLogs[0]?.created_at ?? null }
    })
    .sort((a, b) => toTimestamp(b.lastActionAt) - toTimestamp(a.lastActionAt))
}

type CalendarDay = { dateKey: string; label: string; isCurrentMonth: boolean; hasActivity: boolean }
type CalendarWeek = CalendarDay[]

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function toDateKeyLocal(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function parseDateKeyToLocalDate(key: string) {
  const [y, m, d] = key.split("-").map((s) => parseInt(s, 10))
  return new Date(y, m - 1, d)
}

function buildActionsByDate(logs: any[] = []) {
  const map = new Map<string, any[]>()
  logs.forEach((log) => {
    if (!log?.created_at) return
    const dt = new Date(log.created_at)
    const dateKey = toDateKeyLocal(dt)
    if (!map.has(dateKey)) map.set(dateKey, [])
    map.get(dateKey)!.push(log)
  })
  return map
}

function buildCalendarWeeks(referenceDate: Date, actionsByDate: Map<string, any[]>): CalendarWeek[] {
  const firstOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
  const startDay = firstOfMonth.getDay()
  const startDate = new Date(firstOfMonth)
  startDate.setDate(firstOfMonth.getDate() - startDay)

  const weeks: CalendarWeek[] = []
  for (let week = 0; week < 6; week++) {
    const days: CalendarDay[] = []
    for (let day = 0; day < 7; day++) {
      const current = new Date(startDate)
      current.setDate(startDate.getDate() + week * 7 + day)
      const dateKey = toDateKeyLocal(current)
      days.push({
        dateKey,
        label: String(current.getDate()),
        isCurrentMonth: current.getMonth() === referenceDate.getMonth(),
        hasActivity: actionsByDate.has(dateKey),
      })
    }
    weeks.push(days)
  }
  return weeks
}
