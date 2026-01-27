"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    CheckCircle,
    User,
    Shield,
    Users,
    Trash2,
    Clock,
    Key,
    KeyRound,
    Copy,
    Crown,
    BadgeCheck,
    Wallet,
    Search,
    UserPlus,
} from "lucide-react"
import {
    createAdmin,
    getCEOStats,
    deleteAdmin,
    changeAdminPassword,
} from "../../actions"
import { VerificationHistorySection } from "../verification-history"
import { DiagnosticTools } from "../diagnostic-tools"
import { useToast } from "@/hooks/use-toast"

interface CEOSectionProps {
    currentAdminId?: number | null
}

export function CEOSection({ currentAdminId }: CEOSectionProps) {
    const { toast } = useToast()
    const [showCreateAdmin, setShowCreateAdmin] = useState(false)
    const [newAdmin, setNewAdmin] = useState({ nom: "", prenom: "", password: "", role: "verification" })
    const [creating, setCreating] = useState(false)
    const [stats, setStats] = useState<any>(null)
    const [loadingStats, setLoadingStats] = useState(true)
    const searchParams = useSearchParams()
    const [ceoActiveTab, setCeoActiveTab] = useState<"admin" | "history">(
        (searchParams?.get("ceoTab") as any) || "admin"
    )
    const router = useRouter()
    const pathname = usePathname()

    const [showChangePassword, setShowChangePassword] = useState(false)
    const [selectedAdmin, setSelectedAdmin] = useState<any>(null)
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [changingPassword, setChangingPassword] = useState(false)
    const [userSearchQuery, setUserSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [createdAdminResult, setCreatedAdminResult] = useState<{ nom: string, prenom: string, recoveryKey: string } | null>(null)

    // Search users from database
    useEffect(() => {
        const searchUsers = async () => {
            if (!userSearchQuery.trim()) {
                setSearchResults([])
                return
            }

            setIsSearching(true)
            try {
                const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(userSearchQuery)}`)
                const data = await res.json()
                if (data.success) {
                    setSearchResults(data.users)
                }
            } catch (error) {
                console.error("Search error:", error)
            }
            setIsSearching(false)
        }

        const debounce = setTimeout(searchUsers, 300)
        return () => clearTimeout(debounce)
    }, [userSearchQuery])

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        setLoadingStats(true)
        const result = await getCEOStats()
        if (result.success) {
            setStats(result.stats)
        }
        setLoadingStats(false)
    }

    const handleCreateAdmin = async () => {
        if (!newAdmin.nom || !newAdmin.prenom || !newAdmin.password || !newAdmin.role) {
            alert("All fields are required")
            return
        }

        setCreating(true)
        const result = await createAdmin(newAdmin.nom, newAdmin.prenom, newAdmin.password, newAdmin.role)
        if (result.success && result.recoveryKey) {
            setCreatedAdminResult({
                nom: newAdmin.nom,
                prenom: newAdmin.prenom,
                recoveryKey: result.recoveryKey
            })

            // Auto-copy to clipboard if possible
            if (navigator.clipboard) {
                try {
                    await navigator.clipboard.writeText(result.recoveryKey)
                } catch (e) {
                    // ignore
                }
            }

            setNewAdmin({ nom: "", prenom: "", password: "", role: "verification" })
            loadStats()
        } else if (result.success && !result.recoveryKey) {
            // Normal admin created (non-CEO)
            alert(`${newAdmin.prenom} ${newAdmin.nom} created successfully. You can manage their password from the admin list.`)
            setShowCreateAdmin(false)
            setNewAdmin({ nom: "", prenom: "", password: "", role: "verification" })
            loadStats()
        } else {
            alert(result.error || "Failed to create admin")
        }
        setCreating(false)
    }

    const handleDeleteAdmin = async (adminId: number) => {
        if (!confirm("Are you sure you want to delete this admin?")) return

        const result = await deleteAdmin(adminId)
        if (result.success) {
            alert("Admin deleted successfully")
            loadStats()
        } else {
            alert(result.error || "Failed to delete admin")
        }
    }

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert("Password must be at least 6 characters")
            return
        }
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match")
            return
        }
        if (!selectedAdmin) return

        setChangingPassword(true)
        const result = await changeAdminPassword(selectedAdmin.id, newPassword)
        if (result.success) {
            alert("Password changed successfully")
            setShowChangePassword(false)
            setSelectedAdmin(null)
            setNewPassword("")
            setConfirmPassword("")
        } else {
            alert(result.error || "Failed to change password")
        }
        setChangingPassword(false)
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Tabs for switching between admin dashboard views */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-white/20 shadow-sm">
                    <Button
                        onClick={() => {
                            setCeoActiveTab("admin")
                            router.push(`${pathname.split("?")[0]}?ceoTab=admin`)
                        }}
                        variant="ghost"
                        className={`rounded-xl px-6 h-10 transition-all duration-300 font-medium ${ceoActiveTab === "admin"
                            ? "bg-[#B8071C] text-white shadow-md shadow-red-900/20"
                            : "text-slate-500 hover:text-[#B8071C] hover:bg-red-50"
                            }`}
                    >
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Dashboard
                    </Button>
                    <Button
                        onClick={() => {
                            setCeoActiveTab("history")
                            router.push(`${pathname.split("?")[0]}?ceoTab=history`)
                        }}
                        variant="ghost"
                        className={`rounded-xl px-6 h-10 transition-all duration-300 font-medium ${ceoActiveTab === "history"
                            ? "bg-[#B8071C] text-white shadow-md shadow-red-900/20"
                            : "text-slate-500 hover:text-[#B8071C] hover:bg-red-50"
                            }`}
                    >
                        <Clock className="w-4 h-4 mr-2" />
                        Verification History
                    </Button>
                </div>

                {ceoActiveTab === "admin" && (
                    <div className="flex gap-3">
                        <DiagnosticTools />
                    </div>
                )}
            </div>

            {/* Tab content */}
            <div>
                {ceoActiveTab === "admin" ? (
                    <div className="space-y-8 min-h-[700px]">
                        {/* Premium Stat Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-0 shadow-lg rounded-3xl overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#103090] to-[#0a1e5c]" />
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                                    <Users className="w-32 h-32 text-white" />
                                </div>
                                <CardContent className="relative p-8 text-white h-48 flex flex-col justify-between">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-blue-200 font-medium mb-1 uppercase tracking-wider text-xs">Platform Growth</p>
                                            <h3 className="text-2xl font-bold">Total Users</h3>
                                        </div>
                                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-5xl font-black tracking-tight flex items-baseline gap-2">
                                            {stats?.totalUsers || 0}
                                            <span className="text-lg font-medium text-blue-300">registered</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg rounded-3xl overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#B8071C] to-[#7a0512]" />
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                                    <Shield className="w-32 h-32 text-white" />
                                </div>
                                <CardContent className="relative p-8 text-white h-48 flex flex-col justify-between">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-red-200 font-medium mb-1 uppercase tracking-wider text-xs">Team Access</p>
                                            <h3 className="text-2xl font-bold">Administrators</h3>
                                        </div>
                                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                                            <Shield className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-5xl font-black tracking-tight flex items-baseline gap-2">
                                            {stats?.totalAdmins || 0}
                                            <span className="text-lg font-medium text-red-300">active accounts</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Admin Management Section - Professional Design */}
                        <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="bg-white border-b border-slate-100 px-8 py-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
                                            <Shield className="w-6 h-6 text-[#B8071C]" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-[#103090] text-xl font-bold">Admin Management</CardTitle>
                                            <p className="text-sm text-slate-500 mt-1">Manage administrator accounts and permissions</p>
                                        </div>
                                    </div>
                                    <Button onClick={() => setShowCreateAdmin(true)} className="bg-[#B8071C] hover:bg-[#910515] text-white shadow-lg shadow-red-900/20 rounded-xl px-6 h-11 transition-all">
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Add New Admin
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {stats?.admins && stats.admins.length > 0 ? (
                                        stats.admins.map((admin: any) => {
                                            const isSelf = currentAdminId === admin.id
                                            const roleConfig: Record<string, { gradient: string; icon: React.ReactNode; badge: string }> = {
                                                ceo: { gradient: "from-[#103090] to-blue-900", icon: <Crown className="w-5 h-5 text-white" />, badge: "bg-blue-50 text-[#103090] border-blue-100" },
                                                verification: { gradient: "from-[#B8071C] to-red-900", icon: <BadgeCheck className="w-5 h-5 text-white" />, badge: "bg-red-50 text-[#B8071C] border-red-100" },
                                                finance: { gradient: "from-[#00A651] to-green-900", icon: <Wallet className="w-5 h-5 text-white" />, badge: "bg-green-50 text-[#00A651] border-green-100" },
                                                support: { gradient: "from-[#DEB735] to-amber-600", icon: <Users className="w-5 h-5 text-white" />, badge: "bg-amber-50 text-[#DEB735] border-amber-100" },
                                            }
                                            const config = roleConfig[admin.role] || { gradient: "from-slate-500 to-slate-700", icon: <User className="w-5 h-5 text-white" />, badge: "bg-slate-100 text-slate-800 border border-slate-200" }

                                            return (
                                                <div
                                                    key={admin.id}
                                                    className={`flex items-center justify-between p-6 hover:bg-slate-50/80 transition-colors ${isSelf ? 'bg-blue-50/30' : ''}`}
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className={`w-12 h-12 bg-gradient-to-br ${config.gradient} rounded-2xl flex items-center justify-center shadow-md shadow-gray-200`}>
                                                            {config.icon}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <p className="font-bold text-base text-slate-800">
                                                                    {admin.prenom} {admin.nom}
                                                                </p>
                                                                {isSelf && (
                                                                    <Badge className="bg-[#103090] text-white border-0 px-2 py-0.5 text-[10px] font-bold">YOU</Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge className={`${config.badge} font-bold px-2 py-0.5 text-[10px] uppercase tracking-wider border`}>
                                                                    {admin.role}
                                                                </Badge>
                                                                <span className="text-slate-300 text-xs">•</span>
                                                                <p className="text-xs text-slate-400 font-medium">
                                                                    Joined {new Date(admin.created_at).toLocaleDateString("en-US", {
                                                                        month: "short",
                                                                        day: "numeric",
                                                                        year: "numeric",
                                                                    })}
                                                                </p>
                                                            </div>
                                                            {admin.role === "ceo" && admin.recovery_key && (
                                                                <div className="flex items-center gap-2 mt-2 bg-amber-50/50 border border-amber-100 px-3 py-1 rounded-lg text-xs font-mono text-amber-800 w-fit">
                                                                    <KeyRound className="w-3 h-3 text-amber-500" />
                                                                    <span className="max-w-[150px] truncate select-all">{admin.recovery_key}</span>
                                                                    <button
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(admin.recovery_key)
                                                                            toast?.({
                                                                                title: "Copied",
                                                                                description: "Recovery key copied to clipboard",
                                                                            }) || alert("Recovery Key copied!")
                                                                        }}
                                                                        className="ml-1 text-amber-500 hover:text-amber-700 transition-colors"
                                                                    >
                                                                        <Copy className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedAdmin(admin)
                                                                setShowChangePassword(true)
                                                            }}
                                                            className="h-9 px-3 text-slate-500 hover:text-[#103090] hover:bg-blue-50 border border-slate-200 rounded-xl"
                                                        >
                                                            <Key className="w-4 h-4 mr-2" />
                                                            Change Password
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => {
                                                                if (isSelf) return
                                                                handleDeleteAdmin(admin.id)
                                                            }}
                                                            disabled={isSelf}
                                                            className={`h-9 w-9 rounded-xl border border-slate-200 ${isSelf ? "opacity-50 cursor-not-allowed" : "text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50"}`}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        loadingStats ? (
                                            <div className="p-8 space-y-4">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="flex items-center gap-4 animate-pulse">
                                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                                                        <div className="flex-1 space-y-2">
                                                            <div className="h-4 bg-slate-100 rounded w-1/4" />
                                                            <div className="h-3 bg-slate-50 rounded w-1/3" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-16">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                    <Users className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="text-slate-500 font-medium">No admins found</p>
                                                <p className="text-slate-400 text-sm mt-1">Click "Add New Admin" to create one</p>
                                            </div>
                                        )
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* All Users - Professional Design */}
                        <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden mb-8">
                            <CardHeader className="bg-white border-b border-slate-100 px-8 py-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                                            <Users className="w-6 h-6 text-[#103090]" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-[#103090] text-xl font-bold">User Database</CardTitle>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {userSearchQuery ? `Search results for "${userSearchQuery}"` : "Search to find users from database"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative w-full md:w-[320px]">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            type="text"
                                            placeholder="Search by username or email..."
                                            value={userSearchQuery}
                                            onChange={(e) => setUserSearchQuery(e.target.value)}
                                            className="pl-10 w-full bg-slate-50 border-slate-200 focus:border-[#103090] focus:ring-[#103090] h-11 rounded-xl transition-all"
                                        />
                                        {isSearching && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-4 h-4 border-2 border-[#103090] border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {(() => {
                                        // Show search results if searching, otherwise show recent users
                                        const usersToDisplay = userSearchQuery.trim() ? searchResults : (stats?.recentUsers || [])

                                        if (isSearching) {
                                            return (
                                                <div className="py-8 px-8 space-y-4">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className="flex items-center justify-between animate-pulse">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-slate-100 rounded-full" />
                                                                <div className="space-y-2">
                                                                    <div className="h-4 w-32 bg-slate-100 rounded" />
                                                                    <div className="h-3 w-48 bg-slate-50 rounded" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        }

                                        // If we're loading CEO stats (which include recentUsers), show a skeleton
                                        if (!userSearchQuery.trim() && loadingStats) {
                                            return (
                                                <div className="py-8 px-8 space-y-4">
                                                    <div className="flex items-center justify-center py-12">
                                                        <div className="w-8 h-8 border-4 border-[#103090] border-t-transparent rounded-full animate-spin" />
                                                    </div>
                                                </div>
                                            )
                                        }

                                        return usersToDisplay.length > 0 ? (
                                            usersToDisplay.map((user: any) => {
                                                const isComplete = user.is_profile_complete !== false
                                                const typeConfig: Record<string, { color: string; bg: string; label: string }> = {
                                                    individual: { color: "text-blue-600", bg: "bg-blue-50", label: "Individual" },
                                                    dealer: { color: "text-purple-600", bg: "bg-purple-50", label: "Dealer" },
                                                }
                                                const userType = typeConfig[user.user_type] || { color: "text-slate-600", bg: "bg-slate-50", label: user.user_type }

                                                return (
                                                    <div
                                                        key={user.id}
                                                        className="flex items-center justify-between p-4 px-8 hover:bg-slate-50 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm border border-white ${user.user_type === 'dealer' ? 'bg-purple-100 text-purple-600' : 'bg-[#103090]/10 text-[#103090]'
                                                                }`}>
                                                                {user.username?.charAt(0)?.toUpperCase() || 'U'}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-bold text-sm text-slate-800">@{user.username}</p>
                                                                    <Badge className={`${userType.bg} ${userType.color} border-0 px-1.5 py-0 text-[10px] uppercase font-bold`}>
                                                                        {userType.label}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Status</p>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <div className={`w-2 h-2 rounded-full ${isComplete ? "bg-emerald-500" : "bg-amber-500"}`} />
                                                                    <span className={`text-xs font-medium ${isComplete ? "text-emerald-700" : "text-amber-700"}`}>
                                                                        {isComplete ? "Complete" : "Incomplete"}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="text-right w-24">
                                                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Joined</p>
                                                                <p className="text-xs font-medium text-slate-700 mt-0.5">
                                                                    {new Date(user.created_at).toLocaleDateString("en-US", {
                                                                        month: "short",
                                                                        day: "numeric",
                                                                        year: "numeric"
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div className="text-center py-16">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                    <Search className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="text-slate-500 font-medium">
                                                    {userSearchQuery ? "No users found" : "No users yet"}
                                                </p>
                                                <p className="text-slate-400 text-sm mt-1">
                                                    {userSearchQuery ? `No results matching "${userSearchQuery}"` : "New users will appear here"}
                                                </p>
                                            </div>
                                        )
                                    })()}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="min-h-[700px] bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                        <VerificationHistorySection stats={stats} />
                    </div>
                )}
            </div>

            {/* Create Admin Dialog */}
            <Dialog
                open={showCreateAdmin}
                onOpenChange={(open) => {
                    setShowCreateAdmin(open)
                    if (!open) setCreatedAdminResult(null)
                }}
            >
                <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl p-0 overflow-hidden rounded-2xl">
                    <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-slate-50 to-white">
                        <DialogTitle className="text-[#103090] text-xl font-bold flex items-center gap-2">
                            {createdAdminResult ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <UserPlus className="w-5 h-5" />}
                            {createdAdminResult ? "Admin Created Successfully" : "Create New Admin"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 pt-2">
                        {createdAdminResult ? (
                            <div className="space-y-6">
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-emerald-800">Account Ready</p>
                                        <p className="text-sm text-emerald-700 mt-1">
                                            Administrator account for <strong className="font-bold">{createdAdminResult.prenom} {createdAdminResult.nom}</strong> has been successfully created.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 space-y-3">
                                    <div className="flex items-center gap-2 text-amber-800">
                                        <KeyRound className="w-5 h-5" />
                                        <p className="font-bold text-sm uppercase tracking-wide">Recovery Key</p>
                                    </div>
                                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                        Please save this key securely. It's the only way to reset the password if forgotten.
                                    </p>

                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex-1 bg-white border border-amber-200 rounded-lg p-3 font-mono text-xs break-all text-slate-700 shadow-inner select-all">
                                            {createdAdminResult.recoveryKey}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="shrink-0 h-10 w-10 border-amber-200 hover:bg-amber-100 hover:text-amber-800 bg-white"
                                            onClick={() => {
                                                navigator.clipboard.writeText(createdAdminResult.recoveryKey)
                                                toast({
                                                    title: "Copied!",
                                                    description: "Recovery key copied to clipboard.",
                                                })
                                            }}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    className="w-full bg-[#103090] hover:bg-[#0a1e5c] text-white h-12 rounded-xl font-bold shadow-lg shadow-blue-900/20"
                                    onClick={() => {
                                        setShowCreateAdmin(false)
                                        setCreatedAdminResult(null)
                                    }}
                                >
                                    Done
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="prenom" className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</Label>
                                        <Input
                                            id="prenom"
                                            value={newAdmin.prenom}
                                            onChange={(e) => setNewAdmin({ ...newAdmin, prenom: e.target.value })}
                                            placeholder="e.g. John"
                                            className="h-11 border-slate-200 focus:border-[#B8071C] focus:ring-[#B8071C] rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nom" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</Label>
                                        <Input
                                            id="nom"
                                            value={newAdmin.nom}
                                            onChange={(e) => setNewAdmin({ ...newAdmin, nom: e.target.value })}
                                            placeholder="e.g. Doe"
                                            className="h-11 border-slate-200 focus:border-[#B8071C] focus:ring-[#B8071C] rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Initial Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={newAdmin.password}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                        placeholder="Create a strong password"
                                        className="h-11 border-slate-200 focus:border-[#B8071C] focus:ring-[#B8071C] rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Access Level</Label>
                                    <div className="relative">
                                        <select
                                            id="role"
                                            value={newAdmin.role}
                                            onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                                            className="w-full h-11 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B8071C] focus:border-transparent bg-white text-sm appearance-none"
                                        >
                                            <option value="verification">Verification Officer</option>
                                            <option value="finance">Finance Manager</option>
                                            <option value="support">Customer Support</option>
                                            <option value="ceo">CEO (Full Access)</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <Users className="w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowCreateAdmin(false)}
                                        className="flex-1 h-11 border-slate-200 text-slate-600 rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateAdmin}
                                        disabled={creating}
                                        className="flex-1 h-11 bg-[#B8071C] hover:bg-[#910515] text-white shadow-lg shadow-red-900/20 rounded-xl font-bold"
                                    >
                                        {creating ? "Creating..." : "Create Account"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={showChangePassword} onOpenChange={(open) => {
                setShowChangePassword(open)
                if (!open) {
                    setSelectedAdmin(null)
                    setNewPassword("")
                    setConfirmPassword("")
                }
            }}>
                <DialogContent className="bg-white border-0 shadow-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-[#103090] text-xl font-bold">Change Password</DialogTitle>
                    </DialogHeader>
                    {selectedAdmin && (
                        <div className="space-y-5 pt-2">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Account</p>
                                    <p className="font-bold text-slate-800 text-lg">
                                        {selectedAdmin.prenom} {selectedAdmin.nom}
                                    </p>
                                </div>
                                <Badge
                                    className={`px-3 py-1 ${selectedAdmin.role === "ceo"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-slate-200 text-slate-700"
                                        }`}
                                >
                                    {selectedAdmin.role}
                                </Badge>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password (min 6 chars)"
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowChangePassword(false)
                                        setSelectedAdmin(null)
                                        setNewPassword("")
                                        setConfirmPassword("")
                                    }}
                                    className="flex-1 h-11 rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleChangePassword}
                                    disabled={changingPassword || !newPassword || newPassword !== confirmPassword}
                                    className="flex-1 bg-[#103090] hover:bg-[#0a1e5c] h-11 rounded-xl font-bold shadow-lg shadow-blue-900/20"
                                >
                                    {changingPassword ? "Updating..." : "Update Password"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )

}
