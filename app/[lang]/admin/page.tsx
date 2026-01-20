"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import {
  CheckCircle,
  XCircle,
  Eye,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  LogOut,
  ZoomIn,
  X,
  Shield,
  AlertCircle,
  AlertTriangle,
  Users,
  DollarSign,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Trash2,
  CreditCard,
  Clock,
  Key,
  KeyRound,
  Copy,
  BarChart3,
  Crown,
  BadgeCheck,
  Wallet,
  Search,
} from "lucide-react"
import {
  getAdminRole,
  createAdmin,
  getCEOStats,
  deleteAdmin,
  changeAdminPassword,
  // 🆕 النظام الجديد: كل شيء في direct_sales مع auction_mode
  // لا يوجد getPendingVehicles/approveVehicle/rejectVehicle بعد الآن
  getPendingDirectSales,
  approveDirectSale,
  rejectDirectSale,
} from "./actions"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlatformStats } from "./components/platform-stats"
import dynamic from "next/dynamic"
import { VerificationHistorySection, StatsPeriod } from "./components/verification-history"
import { KarkeyCarsManager, KarkeyInquiriesList } from "./components/karkey-cars-manager"
import { DiagnosticTools } from "./components/diagnostic-tools"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/i18n-context"

// Dynamic import for ChartsSection to reduce initial bundle size (recharts is heavy)
const ChartsSection = dynamic(
  () => import("./components/charts-section").then((mod) => ({ default: mod.ChartsSection })),
  {
    loading: () => (
      <div className="space-y-6" style={{ minHeight: '900px' }}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
)

function formatImageSrc(base64String: string | null | undefined): string {
  if (!base64String) {
    return "/placeholder.svg?height=200&width=300"
  }

  // Remove any duplicate "data:image/jpeg;base64," prefixes
  let cleanedString = base64String
  const dataUrlPrefix = "data:image/jpeg;base64,"

  // Count how many times the prefix appears
  const prefixCount = (cleanedString.match(/data:image\/jpeg;base64,/g) || []).length

  if (prefixCount > 1) {
    // Remove all prefixes and add just one
    cleanedString = cleanedString.replace(/data:image\/jpeg;base64,/g, "")
    return `${dataUrlPrefix}${cleanedString}`
  }

  // If it's already a data URL, return as is
  if (cleanedString.startsWith("data:")) {
    return cleanedString
  }

  // If it's an external URL, return as is
  if (cleanedString.startsWith("http://") || cleanedString.startsWith("https://")) {
    return cleanedString
  }

  // Convert /uploads/ paths to /api/uploads/ for production serving
  // Next.js doesn't serve files added to public/ after build in production
  if (cleanedString.startsWith("/uploads/")) {
    return `/api${cleanedString}`
  }

  // Check for common image paths that might be missing a leading slash
  if (cleanedString.startsWith("uploads/")) {
    return `/api/${cleanedString}`
  }

  // If starts with /, return as is (other static files)
  if (cleanedString.startsWith("/")) {
    return cleanedString
  }

  // Check for common image extensions if it doesn't look like base64
  if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(cleanedString)) {
    return cleanedString.startsWith("/") ? cleanedString : `/${cleanedString}`
  }

  // Otherwise, assume it's a base64 string and add the data URL prefix
  return `${dataUrlPrefix}${cleanedString}`
}

// PendingUser interface removed - user verification no longer needed

interface PendingVehicle {
  id: number
  user_id: number
  make: string
  model: string
  year: number
  mileage: number
  transmission: string
  fuel_type: string
  engine_size?: number | null
  doors?: number | null
  vehicle_condition: string
  location: string
  description: string
  carte_grise_url: string
  verification_status: string
  created_at: string
  username: string
  email: string
  first_name: string
  last_name: string
  photos: string[]
}

interface PendingDirectSale {
  id: number
  user_id: number
  make: string
  model: string
  year: number
  mileage: number
  transmission: string
  fuel_type: string
  engine_size?: number | null
  doors?: number | null
  vehicle_condition: string
  location: string
  description: string
  price: number
  carte_grise_url: string
  special_features?: string | null
  verification_status: string
  created_at: string
  username: string
  email: string
  first_name: string
  last_name: string
  photos: string[]
}

type AdminRole = "ceo" | "verification" | "finance" | "support"

export default function AdminDashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const refreshingRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null)
  const [adminInfo, setAdminInfo] = useState<{ nom: string; prenom: string } | null>(null)
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null)

  // 🆕 النظام الجديد: لا يوجد vehicles منفصل - كل شيء في direct_sales
  const [directSales, setDirectSales] = useState<PendingDirectSale[]>([])
  const [directSalesTotal, setDirectSalesTotal] = useState<number>(0)
  const [selectedDirectSale, setSelectedDirectSale] = useState<PendingDirectSale | null>(null)
  const [directSaleRejectionReason, setDirectSaleRejectionReason] = useState("")
  const [activeTab, setActiveTab] = useState<"directSales">("directSales")

  useEffect(() => {
    const checkAuth = async () => {
      const roleResult = await getAdminRole()
      if (roleResult.error === "Unauthorized" || !roleResult.role) {
        router.push("/admin/login")
        return
      }
      setAdminRole(roleResult.role as AdminRole)
      // جلب اسم ونسب الادمين من نفس الدالة إذا متوفر
      if (roleResult.nom && roleResult.prenom) {
        setAdminInfo({ nom: roleResult.nom, prenom: roleResult.prenom })
      }
      // set current admin id if provided by server
      if (typeof roleResult.id === "number") {
        setCurrentAdminId(roleResult.id)
      }
      setCheckingAuth(false)
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (!checkingAuth && adminRole) {
      if (adminRole === "verification" || adminRole === "ceo") {
        // 🆕 النظام الجديد: فقط direct_sales
        loadPendingDirectSales().finally(() => {
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    }
  }, [checkingAuth, adminRole])

  // User verification removed - no longer needed

  useEffect(() => {
    if (activeTab === "directSales") {
      if (directSales.length === 0) {
        setSelectedDirectSale(null)
      } else if (!selectedDirectSale || !directSales.find(ds => ds.id === selectedDirectSale.id)) {
        setSelectedDirectSale(directSales[0])
      }
    }
  }, [directSales, activeTab, selectedDirectSale])

  // Add this effect to auto-refresh after approve/reject actions
  useEffect(() => {
    if (adminRole === "verification" || adminRole === "ceo") {
      // 🆕 النظام الجديد: فقط direct_sales
      loadPendingDirectSales()
    }
    // يتم تنفيذ هذا عند تغيّر المسار
  }, [adminRole, pathname])

  // loadPendingUsers removed - user verification no longer needed
  // loadPendingVehicles removed - vehicles table deleted, everything in direct_sales now

  const loadPendingDirectSales = async (silent: boolean = false) => {
    const result = await getPendingDirectSales()
    if (result.success) {
      const directSalesList: PendingDirectSale[] = (result.directSales || []).map((ds: any) => ({
        id: ds.id ?? 0,
        user_id: ds.user_id ?? 0,
        make: ds.make ?? "",
        model: ds.model ?? "",
        year: ds.year ?? 0,
        mileage: ds.mileage ?? 0,
        transmission: ds.transmission ?? "",
        fuel_type: ds.fuel_type ?? "",
        engine_size: ds.engine_size != null ? (typeof ds.engine_size === "number" ? ds.engine_size : parseFloat(String(ds.engine_size)) || null) : null,
        doors: ds.doors != null ? (typeof ds.doors === "number" ? ds.doors : parseInt(String(ds.doors), 10) || null) : null,
        vehicle_condition: ds.vehicle_condition ?? "",
        location: ds.location ?? "",
        description: ds.description ?? "",
        price: ds.price ?? 0,
        carte_grise_url: ds.carte_grise_url ?? "",
        special_features: ds.special_features ?? null,
        verification_status: ds.verification_status ?? "",
        created_at: ds.created_at ?? "",
        username: ds.username ?? "",
        email: ds.email ?? "",
        first_name: ds.first_name ?? "",
        last_name: ds.last_name ?? "",
        photos: Array.isArray(ds.photos) ? ds.photos : [],
      }))
      setDirectSales(directSalesList)
      setDirectSalesTotal(result.total ?? directSalesList.length)
    } else {
      if (result.error === "Unauthorized") {
        router.push("/admin/login")
      }
    }
  }

  // Auto-refresh queues periodically and when window/tab gains focus
  useEffect(() => {
    if (checkingAuth) return
    const canViewQueues = adminRole === "verification" || adminRole === "ceo"
    if (!canViewQueues) return

    const refresh = async () => {
      if (refreshingRef.current) return
      refreshingRef.current = true
      try {
        // 🆕 النظام الجديد: فقط direct_sales
        await loadPendingDirectSales(true)
      } finally {
        refreshingRef.current = false
      }
    }

    const intervalId = window.setInterval(() => { void refresh() }, 15000) // 15s polling
    const onFocus = () => { void refresh() }
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh()
    }

    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [checkingAuth, adminRole])

  // handleApprove and handleReject for users removed - user verification no longer needed

  // Direct Sales handlers
  const handleApproveDirectSale = async (directSaleId: number) => {
    if (!confirm("Are you sure you want to approve this direct sale listing?")) return

    setProcessing(true)
    const result = await approveDirectSale(directSaleId)
    if (result.success) {
      alert("Direct sale listing approved successfully")
      loadPendingDirectSales()
      setSelectedDirectSale(null)
    } else {
      alert("Failed to approve direct sale listing")
    }
    setProcessing(false)
  }

  const handleRejectDirectSale = async (directSaleId: number) => {
    if (!directSaleRejectionReason.trim()) {
      alert("Please enter a rejection reason")
      return
    }

    if (!confirm("Are you sure you want to reject this direct sale listing?")) return

    setProcessing(true)
    const result = await rejectDirectSale(directSaleId, directSaleRejectionReason)
    if (result.success) {
      alert("Direct sale listing rejected successfully")
      loadPendingDirectSales()
      setSelectedDirectSale(null)
      setDirectSaleRejectionReason("")
    } else {
      alert("Failed to reject direct sale listing")
    }
    setProcessing(false)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (checkingAuth || loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#103090] mx-auto"></div>
          <p className="mt-4 text-[#103090]">Loading...</p>
        </div>
      </div>
    )
  }

  const renderRoleSection = () => {
    switch (adminRole) {
      case "verification":
        // 🆕 النظام الجديد: فقط directSales - لا يوجد vehicles منفصل
        return (
          <VerificationSection
            directSales={directSales}
            directSalesTotal={directSalesTotal}
            selectedDirectSale={selectedDirectSale}
            setSelectedDirectSale={setSelectedDirectSale}
            directSaleRejectionReason={directSaleRejectionReason}
            setDirectSaleRejectionReason={setDirectSaleRejectionReason}
            handleApproveDirectSale={handleApproveDirectSale}
            handleRejectDirectSale={handleRejectDirectSale}
            processing={processing}
            loadPendingDirectSales={loadPendingDirectSales}
          />
        )
      case "ceo":
        return <CEOSection currentAdminId={currentAdminId} />
      case "finance":
        return <FinanceSection />
      case "support":
        return <SupportSection />
      default:
        return <div className="text-center py-12 text-red-500">Unknown role</div>
    }
  }

  return (
    <div className="bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f1f5f9] overflow-x-hidden admin-scroll" style={{ minHeight: "calc(100vh - 81px)" }}>
      <style jsx>{`
        :global(.admin-scroll) {
          overflow-y: auto;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        :global(.admin-scroll::-webkit-scrollbar) {
          display: none;
        }
      `}</style>
      <div className="bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <Link href="/admin">
                {/* changed gold -> primary blue */}
                <h1 className="text-2xl font-bold text-[#B8071C] cursor-pointer hover:text-[#910515]">Karkey</h1>
              </Link>
              {/* badge uses primary blue with white text for contrast */}
              <Badge className="bg-[#B8071C] text-white hover:bg-[#B8071C] text-xs px-2.5 py-1">
                {adminRole === "verification" ? "Verification Manager" : adminRole?.toUpperCase()}
              </Badge>
              {/* عرض اسم ونسب الأدمن */}
              {adminInfo && (
                <span className="ml-4 text-sm font-normal text-[#910515] bg-[#f8fafc] px-3 py-1 rounded-lg border border-[#ececec]">
                  {adminInfo.prenom} {adminInfo.nom}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-[#910515] hover:text-[#B8071C] hover:bg-[#f8fafc] text-sm font-medium rounded-full px-4 h-9"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-20 pb-0">
        <div className="mb-4">
          <h2 className="text-3xl font-bold text-[#103090] mb-2">
            {adminRole === "verification" ? "Verification Dashboard" : "Admin Dashboard"}
          </h2>
          <p className="text-[#717171]">
            {adminRole === "verification" &&
              "Review and verify user identity documents, vehicle photos, and carte grise (vehicle registration)"}
            {adminRole === "ceo" && "Overview of all platform operations"}
          </p>
        </div>

        {renderRoleSection()}
      </div>
    </div>
  )
}

function VerificationSection({
  // 🆕 النظام الجديد: فقط direct_sales - لا يوجد vehicles منفصل
  directSales,
  directSalesTotal,
  selectedDirectSale,
  setSelectedDirectSale,
  directSaleRejectionReason,
  setDirectSaleRejectionReason,
  handleApproveDirectSale,
  handleRejectDirectSale,
  processing,
  loadPendingDirectSales,
}: {
  directSales: PendingDirectSale[]
  directSalesTotal: number
  selectedDirectSale: PendingDirectSale | null
  setSelectedDirectSale: (ds: PendingDirectSale | null) => void
  directSaleRejectionReason: string
  setDirectSaleRejectionReason: (reason: string) => void
  handleApproveDirectSale: (directSaleId: number) => void
  handleRejectDirectSale: (directSaleId: number) => void
  processing: boolean
  loadPendingDirectSales: () => void
}) {
  const { t } = useTranslation()
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  // Default to showing the full image within the screen (no zoom)
  const [fitToScreen, setFitToScreen] = useState(true)

  // 🆕 النظام الجديد: لا يوجد vehicles منفصل - فقط direct_sales

  // User rejection dialog removed - no longer needed

  const directSaleRejectionReasons = [
    "admin.rejection.vehicle_quality",
    "admin.rejection.vehicle_mismatch",
    "admin.rejection.vehicle_owner_mismatch",
    "admin.rejection.vehicle_missing_photos",
    "admin.rejection.vehicle_condition",
    "admin.rejection.vehicle_suspicious",
    "admin.rejection.vehicle_incomplete",
    "admin.rejection.other",
  ]

  // 🆕 النظام الجديد: لا يوجد vehicles tab منفصل - كل شيء في direct_sales

  return (
    <>
      {/* 🆕 النظام الجديد: فقط Direct Sales - لا يوجد tab switching */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#103090] flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          Listings Verification Queue
          <Badge variant="outline" className="ml-2 text-gray-600">
            {directSalesTotal} pending
          </Badge>
        </h2>
        <p className="text-sm text-gray-500 mt-1">Review and verify direct sales and auction listings</p>
      </div>

      {/* Direct Sales Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Direct Sales List - Left Side */}
        <div className="lg:col-span-2">
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
            {directSales.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-12 text-center">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium">No pending verifications</p>
                  <p className="text-sm text-gray-400 mt-1">All listings have been processed</p>
                </CardContent>
              </Card>
            ) : (
              // SHOW ONLY THE OLDEST (first) REQUEST — keep ordering from server (created_at ASC)
              directSales.slice(0, 1).map((ds) => (
                <Card
                  key={ds.id}
                  className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${selectedDirectSale?.id === ds.id ? "ring-2 ring-[#B8071C] shadow-md" : ""
                    }`}
                  onClick={() => {
                    setSelectedDirectSale(ds)
                    setDirectSaleRejectionReason("")
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {ds.photos && ds.photos.length > 0 ? (
                        <img
                          src={formatImageSrc(ds.photos[0]) || "/placeholder.svg"}
                          alt={`${ds.make} ${ds.model}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#103090]">
                          {ds.year} {ds.make} {ds.model}
                        </h4>
                        <p className="text-xs text-gray-500">By @{ds.username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 text-xs">
                            {Number(ds.price).toLocaleString()} MAD
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">
                            Pending
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(ds.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Direct Sale Details - Right Side */}
        <div className="lg:col-span-3">
          {selectedDirectSale ? (
            <div className="space-y-6">
              {/* Direct Sale Information Card */}
              <Card className="border-0 shadow-md">
                <CardHeader className="border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-[#103090] text-xl">
                        {selectedDirectSale.year} {selectedDirectSale.make} {selectedDirectSale.model}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Listed by @{selectedDirectSale.username} • Direct Sale ID: #{selectedDirectSale.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 text-lg px-3 py-1">
                        {Number(selectedDirectSale.price).toLocaleString()} MAD
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 ml-2">Pending Review</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Seller Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedDirectSale.first_name} {selectedDirectSale.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Seller Email</p>
                      <p className="text-sm font-medium text-gray-900">{selectedDirectSale.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Mileage</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedDirectSale.mileage.toLocaleString()} km
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Transmission</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{selectedDirectSale.transmission}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Fuel Type</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{selectedDirectSale.fuel_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Condition</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {selectedDirectSale.vehicle_condition}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Engine Size</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedDirectSale.engine_size ? `${selectedDirectSale.engine_size} L` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Doors</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedDirectSale.doors ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-sm font-medium text-gray-900">{selectedDirectSale.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Listed Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedDirectSale.created_at).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-900">{selectedDirectSale.description}</p>
                  </div>
                  {selectedDirectSale.special_features && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Special Features</p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedDirectSale.special_features}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Direct Sale Photos Card */}
              <Card className="border-0 shadow-md">
                <CardHeader className="border-b border-gray-100 bg-gray-50">
                  <CardTitle className="text-[#103090] flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Vehicle Photos
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Click on any photo to view in full size</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    {selectedDirectSale.photos && selectedDirectSale.photos.length > 0 ? (
                      selectedDirectSale.photos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#B8071C] transition-all"
                          onClick={() => {
                            setFitToScreen(true)
                            setViewingImage(formatImageSrc(photo))
                          }}
                        >
                          <img
                            src={formatImageSrc(photo) || "/placeholder.svg"}
                            alt={`Vehicle photo ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      ))
                    ) : (
                      <p className="col-span-3 text-center text-gray-500 py-8">No photos uploaded</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Carte Grise Card */}
              <Card className="border-0 shadow-md">
                <CardHeader className="border-b border-gray-100 bg-gray-50">
                  <CardTitle className="text-[#103090] flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Carte Grise (Vehicle Registration)
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Verify that the name on the carte grise matches: {selectedDirectSale.first_name}{" "}
                    {selectedDirectSale.last_name}
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  {selectedDirectSale.carte_grise_url ? (
                    <div
                      className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#B8071C] transition-all max-w-md"
                      onClick={() => {
                        setFitToScreen(true)
                        setViewingImage(formatImageSrc(selectedDirectSale.carte_grise_url))
                      }}
                    >
                      <img
                        src={formatImageSrc(selectedDirectSale.carte_grise_url) || "/placeholder.svg"}
                        alt="Carte Grise"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-500">No carte grise uploaded</p>
                  )}
                </CardContent>
              </Card>

              {/* Action Card */}
              <Card className="border-0 shadow-md">
                <CardHeader className="border-b border-gray-100 bg-gray-50">
                  <CardTitle className="text-[#103090]">Verification Decision</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <Select value={directSaleRejectionReason} onValueChange={setDirectSaleRejectionReason}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a reason for rejection..." />
                      </SelectTrigger>
                      <SelectContent>
                        {directSaleRejectionReasons.map((reason) => (
                          <SelectItem key={reason} value={`__t:${reason}`}>
                            {t(reason as any)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      This reason will be sent to the seller if you reject their listing
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => handleApproveDirectSale(selectedDirectSale.id)}
                      disabled={processing}
                      className="flex-1 bg-[#B8071C] hover:bg-[#910515] text-white h-12 text-base font-medium"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Approve Listing
                    </Button>
                    <Button
                      onClick={() => handleRejectDirectSale(selectedDirectSale.id)}
                      disabled={processing || !directSaleRejectionReason.trim()}
                      variant="destructive"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12 text-base font-medium"
                    >
                      <XCircle className="w-5 h-5 mr-2" />
                      Reject Listing
                    </Button>
                  </div>

                  {!directSaleRejectionReason.trim() && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-800">
                        You must select a rejection reason before you can reject this listing
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <Card className="border-0 shadow-md">
                <CardContent className="p-12 text-center">
                  <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 font-medium text-lg">Select a direct sale to review</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Choose a listing from the queue to begin verification
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      <Dialog
        open={!!viewingImage}
        onOpenChange={(open) => {
          if (!open) {
            setViewingImage(null)
            setFitToScreen(true)
          }
        }}
      >
        <DialogContent hideClose className="p-0 w-[100vw] max-w-[100vw] h-[100vh] max-h-[100vh] overflow-hidden bg-black">
          {/* Custom modern close button */}
          <div className="absolute top-4 right-4 z-[60]">
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Close"
                className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogClose>
          </div>
          <div className={"h-full w-full flex items-center justify-center " + (fitToScreen ? "overflow-hidden" : "overflow-auto")}>
            {viewingImage && (
              <img
                src={viewingImage}
                alt="Document"
                onClick={() => setFitToScreen((v) => !v)}
                className={
                  (fitToScreen
                    ? "max-w-full max-h-full object-contain cursor-zoom-in"
                    : "w-auto h-auto max-w-none max-h-none cursor-zoom-out") +
                  " select-none"
                }
              />
            )}
          </div>
        </DialogContent>
      </Dialog>


    </>
  )
}

function CEOSection({ currentAdminId }: { currentAdminId?: number | null }) {
  const { toast } = useToast()
  const [showCreateAdmin, setShowCreateAdmin] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ nom: "", prenom: "", password: "", role: "verification" })
  const [creating, setCreating] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const searchParams = useSearchParams()
  const [ceoActiveTab, setCeoActiveTab] = useState<"stats" | "admin" | "charts" | "history">(
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
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>("all")
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

  // removed duplicate loading spinner — the page already shows a global loader earlier

  return (
    <div className="space-y-6 scroll-smooth">
      {/* Tabs for switching between admin dashboard views */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          onClick={() => {
            setCeoActiveTab("admin")
            router.push(`${pathname.split("?")[0]}?ceoTab=admin`)
          }}
          variant={ceoActiveTab === "admin" ? "default" : "outline"}
          className={ceoActiveTab === "admin" ? "bg-[#B8071C] hover:bg-[#910515]" : ""}
        >
          <Shield className="w-4 h-4 mr-2" />
          Admin Dashboard
        </Button>
        <Button
          onClick={() => {
            setCeoActiveTab("history")
            router.push(`${pathname.split("?")[0]}?ceoTab=history`)
          }}
          variant={ceoActiveTab === "history" ? "default" : "outline"}
          className={ceoActiveTab === "history" ? "bg-[#B8071C] hover:bg-[#910515]" : ""}
        >
          <Clock className="w-4 h-4 mr-2" />
          Verification History
        </Button>
        <Button
          onClick={() => {
            setCeoActiveTab("charts")
            router.push(`${pathname.split("?")[0]}?ceoTab=charts`)
          }}
          variant={ceoActiveTab === "charts" ? "default" : "outline"}
          className={ceoActiveTab === "charts" ? "bg-[#B8071C] hover:bg-[#910515]" : ""}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Analytics
        </Button>
        <Button
          onClick={() => {
            setCeoActiveTab("stats")
            router.push(`${pathname.split("?")[0]}?ceoTab=stats`)
          }}
          variant={ceoActiveTab === "stats" ? "default" : "outline"}
          className={ceoActiveTab === "stats" ? "bg-[#B8071C] hover:bg-[#910515]" : ""}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Platform Statistics
        </Button>
      </div>

      {/* Tab content - fixed height container to prevent layout shift */}
      <div>
        {ceoActiveTab === "admin" ? (
          <div className="min-h-[700px]">
            {/* Compact Actions + Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <Card className="border-0 shadow-md h-full flex flex-col justify-between">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-[#1e2a5e]">Manage Plans</h3>
                    <p className="text-sm text-gray-500 mt-2">Create, edit, and update subscription plans.</p>
                    <div className="mt-4">
                      <Link href="/admin/plans">
                        <Button className="w-full bg-[#B8071C] hover:bg-[#910515]">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Open Plans Manager
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="border-0 shadow-md h-full flex flex-col justify-between">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-[#1e2a5e]">Subscriptions</h3>
                    <p className="text-sm text-gray-500 mt-2">View subscriber stats and revenue.</p>
                    <div className="mt-4">
                      <Link href="/admin/subscriptions">
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          View Stats
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-md h-32">
                  <CardContent className="p-4 h-full flex items-center">
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="text-sm text-[#717171] mb-1">Total Users</p>
                        <p className="text-2xl font-semibold text-[#222222]">{stats?.totalUsers || 0}</p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md h-32">
                  <CardContent className="p-4 h-full flex items-center">
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="text-sm text-[#717171] mb-1">Pending Verifications</p>
                        <p className="text-2xl font-semibold text-[#B8071C]">{stats?.pendingVerifications || 0}</p>
                      </div>
                      <div className="w-10 h-10 bg-[#B8071C]/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#B8071C]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md h-32">
                  <CardContent className="p-4 h-full flex items-center">
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="text-sm text-[#717171] mb-1">Total Admins</p>
                        <p className="text-2xl font-semibold text-[#222222]">{stats?.totalAdmins || 0}</p>
                      </div>
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Admin Management Section - Professional Design */}
            <Card className="border-0 shadow-lg mt-6 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#B8071C] to-[#910515] rounded-xl flex items-center justify-center shadow-md">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-[#1e2a5e] text-lg">Admin Management</CardTitle>
                      <p className="text-sm text-slate-500 mt-0.5">Manage administrator accounts and permissions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href="/admin/plans">
                      <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Manage Plans
                      </Button>
                    </Link>
                    <Button onClick={() => setShowCreateAdmin(true)} className="bg-gradient-to-r from-[#B8071C] to-[#910515] hover:from-[#910515] hover:to-[#1e3a8a] shadow-md transition-all">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add New Admin
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {stats?.admins && stats.admins.length > 0 ? (
                    stats.admins.map((admin: any, index: number) => {
                      const isSelf = currentAdminId === admin.id
                      const roleConfig: Record<string, { gradient: string; icon: React.ReactNode; badge: string }> = {
                        ceo: { gradient: "from-purple-500 to-purple-700", icon: <Crown className="w-5 h-5 text-white" />, badge: "bg-purple-100 text-purple-800 border border-purple-200" },
                        verification: { gradient: "from-blue-500 to-blue-700", icon: <BadgeCheck className="w-5 h-5 text-white" />, badge: "bg-blue-100 text-blue-800 border border-blue-200" },
                        finance: { gradient: "from-emerald-500 to-emerald-700", icon: <Wallet className="w-5 h-5 text-white" />, badge: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
                      }
                      const config = roleConfig[admin.role] || { gradient: "from-slate-500 to-slate-700", icon: <User className="w-5 h-5 text-white" />, badge: "bg-slate-100 text-slate-800 border border-slate-200" }

                      return (
                        <div
                          key={admin.id}
                          className={`flex items-center justify-between p-3 hover:bg-slate-50/80 transition-colors ${isSelf ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center shadow-sm`}>
                              {config.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm text-[#1e2a5e]">
                                  {admin.prenom} {admin.nom}
                                </p>
                                {isSelf && (
                                  <Badge className="bg-blue-500 text-white text-[10px] px-1 py-0.5">You</Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Joined {new Date(admin.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                              {admin.role === "ceo" && admin.recovery_key && (
                                <div className="flex items-center gap-2 mt-1 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-mono text-blue-700 w-fit">
                                  <KeyRound className="w-3 h-3 text-blue-400" />
                                  <span className="max-w-[150px] truncate" title={admin.recovery_key}>Key: {admin.recovery_key}</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(admin.recovery_key)
                                      toast?.({
                                        title: "Copied",
                                        description: "Recovery key copied to clipboard",
                                      }) || alert("Recovery Key copied!")
                                    }}
                                    className="ml-1 hover:text-blue-900 transition-colors"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${config.badge} font-medium px-2 py-0.5 text-xs`}>
                              {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                            </Badge>
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAdmin(admin)
                                  setShowChangePassword(true)
                                }}
                                title="Change password"
                                className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg h-9 w-9 p-0"
                              >
                                <Key className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (isSelf) return
                                  handleDeleteAdmin(admin.id)
                                }}
                                disabled={isSelf}
                                title={isSelf ? "You cannot delete your own account" : "Delete admin"}
                                className={`rounded-lg h-9 w-9 p-0 ${isSelf ? "text-slate-300 cursor-not-allowed" : "text-slate-500 hover:text-red-600 hover:bg-red-50"}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    // Show a subtle loading placeholder while stats are being fetched
                    loadingStats ? (
                      <div className="p-6">
                        <div className="animate-pulse space-y-3">
                          <div className="h-6 bg-slate-100 rounded w-1/3" />
                          <div className="h-40 bg-slate-50 rounded border border-slate-100" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-slate-400" />
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
            <Card className="border-0 shadow-lg mt-6 overflow-hidden mb-6">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-[#1e2a5e] text-lg">All Users</CardTitle>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {userSearchQuery ? `Search results for "${userSearchQuery}"` : "Search to find users from database"}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search by username or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-10 w-[300px] bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto">
                  {(() => {
                    // Show search results if searching, otherwise show recent users
                    const usersToDisplay = userSearchQuery.trim() ? searchResults : (stats?.recentUsers || [])

                    if (isSearching) {
                      return (
                        <div className="py-8 px-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 animate-pulse">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                                <div className="space-y-2">
                                  <div className="h-4 w-32 bg-slate-200 rounded" />
                                  <div className="h-3 w-48 bg-slate-100 rounded" />
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="h-6 w-20 bg-slate-200 rounded-full" />
                                <div className="h-4 w-16 bg-slate-100 rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }

                    // If we're loading CEO stats (which include recentUsers), show a skeleton
                    if (!userSearchQuery.trim() && loadingStats) {
                      return (
                        <div className="py-8 px-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 animate-pulse">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                                <div className="space-y-2">
                                  <div className="h-4 w-32 bg-slate-200 rounded" />
                                  <div className="h-3 w-48 bg-slate-100 rounded" />
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="h-6 w-20 bg-slate-200 rounded-full" />
                                <div className="h-4 w-16 bg-slate-100 rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }

                    return usersToDisplay.length > 0 ? (
                      usersToDisplay.map((user: any, index: number) => {
                        const statusConfig: Record<string, { gradient: string; badge: string; icon: React.ReactNode }> = {
                          approved: { gradient: "from-emerald-500 to-emerald-700", badge: "bg-emerald-100 text-emerald-800 border border-emerald-200", icon: <CheckCircle className="w-3 h-3 mr-1" /> },
                          pending: { gradient: "from-slate-500 to-slate-700", badge: "bg-slate-100 text-slate-800 border border-slate-200", icon: <Clock className="w-3 h-3 mr-1" /> },
                          rejected: { gradient: "from-red-500 to-red-700", badge: "bg-red-100 text-red-800 border border-red-200", icon: <XCircle className="w-3 h-3 mr-1" /> },
                        }
                        const config = statusConfig[user.verification_status] || statusConfig.pending

                        const typeConfig: Record<string, { color: string; label: string }> = {
                          individual: { color: "text-blue-600", label: "Individual" },
                          dealer: { color: "text-purple-600", label: "Dealer" },
                        }
                        const userType = typeConfig[user.user_type] || { color: "text-slate-600", label: user.user_type }

                        return (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3 hover:bg-slate-50/80 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center shadow-sm`}>
                                <span className="text-white font-semibold text-sm">
                                  {user.username?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm text-[#1e2a5e]">@{user.username}</p>
                                  <span className={`text-xs font-medium ${userType.color}`}>• {userType.label}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={`${config.badge} font-medium px-2 py-0.5 text-xs flex items-center`}>
                                {config.icon}
                                {user.verification_status.charAt(0).toUpperCase() + user.verification_status.slice(1)}
                              </Badge>
                              <div className="text-right min-w-[72px]">
                                <p className="text-xs font-medium text-slate-600">
                                  {new Date(user.created_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {new Date(user.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">
                          {userSearchQuery ? "No users found" : "No users yet"}
                        </p>
                        <p className="text-slate-400 text-sm mt-1">
                          {userSearchQuery ? `No results for "${userSearchQuery}"` : "New users will appear here"}
                        </p>
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Diagnostic Tools */}
            <DiagnosticTools />

          </div>
        ) : ceoActiveTab === "history" ? (
          <div className="min-h-[700px]">
            <VerificationHistorySection stats={stats} statsPeriod={statsPeriod} onPeriodChange={setStatsPeriod} />
          </div>
        ) : ceoActiveTab === "charts" ? (
          /* Charts Section */
          <div className="min-h-[700px]">
            <ChartsSection />
          </div>
        ) : (
          /* Platform Statistics */
          <div className="min-h-[700px]">
            <PlatformStats />
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1e2a5e]">
              {createdAdminResult ? "Admin Created Successfully" : "Create New Admin"}
            </DialogTitle>
          </DialogHeader>

          {createdAdminResult ? (
            <div className="space-y-6 py-2">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-800">Account Created</p>
                  <p className="text-sm text-green-700">
                    Administrator account for <strong>{createdAdminResult.prenom} {createdAdminResult.nom}</strong> has been set up.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-800">
                  <KeyRound className="w-5 h-5" />
                  <p className="font-bold text-sm">IMPORTANT: RECOVERY KEY</p>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Save this key securely! You can use it to reset the password if forgotten. You can also find it anytime in the <strong>Admin Management</strong> list on your dashboard.
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-white border border-amber-200 rounded-lg p-3 font-mono text-[10px] break-all text-slate-700 shadow-sm">
                    {createdAdminResult.recoveryKey}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-10 w-10 border-amber-200 hover:bg-amber-100 hover:text-amber-800"
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
                className="w-full bg-[#1e2a5e] hover:bg-[#151d42] text-white py-6"
                onClick={() => {
                  setShowCreateAdmin(false)
                  setCreatedAdminResult(null)
                }}
              >
                Close and Continue
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">First Name</Label>
                  <Input
                    id="prenom"
                    value={newAdmin.prenom}
                    onChange={(e) => setNewAdmin({ ...newAdmin, prenom: e.target.value })}
                    placeholder="e.g. John"
                    className="h-11 border-slate-200 focus:ring-[#B8071C]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Last Name</Label>
                  <Input
                    id="nom"
                    value={newAdmin.nom}
                    onChange={(e) => setNewAdmin({ ...newAdmin, nom: e.target.value })}
                    placeholder="e.g. Doe"
                    className="h-11 border-slate-200 focus:ring-[#B8071C]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Temporary Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  placeholder="Create a strong password"
                  className="h-11 border-slate-200 focus:ring-[#B8071C]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Permissions Role</Label>
                <select
                  id="role"
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                  className="w-full h-11 px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B8071C] bg-white text-sm"
                >
                  <option value="verification">Verification Officer</option>
                  <option value="finance">Finance Manager</option>
                  <option value="support">Customer Support</option>
                  <option value="ceo">CEO (Full Access)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateAdmin(false)}
                  className="flex-1 h-11 border-slate-200 text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAdmin}
                  disabled={creating}
                  className="flex-1 h-11 bg-gradient-to-r from-[#B8071C] to-[#910515] hover:from-[#6B0F28] hover:to-[#520B1F] text-white shadow-md shadow-red-100"
                >
                  {creating ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </div>
          )}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#222222]">Change Password</DialogTitle>
          </DialogHeader>
          {selectedAdmin && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Changing password for:</p>
                <p className="font-medium text-[#222222]">
                  {selectedAdmin.prenom} {selectedAdmin.nom}
                </p>
                <Badge
                  className={`mt-1 ${selectedAdmin.role === "ceo"
                    ? "bg-purple-100 text-purple-800"
                    : selectedAdmin.role === "verification"
                      ? "bg-blue-100 text-blue-800"
                      : selectedAdmin.role === "finance"
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                >
                  {selectedAdmin.role}
                </Badge>
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
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
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !newPassword || newPassword !== confirmPassword}
                  className="flex-1 bg-[#B8071C] hover:bg-[#910515]"
                >
                  {changingPassword ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FinanceSection() {
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
    }).format(amount) + " DH"
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8071C]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card className="border border-blue-100 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#B8071C]/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-[#B8071C]" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Financial Monitoring Dashboard</p>
              <p className="text-sm text-gray-600">View-only access. All payments are processed by the bank.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-100 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats?.overview?.totalRevenue || 0)}</p>
                <p className="text-xs text-gray-400">All confirmed payments</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Pending (Bank Processing)</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats?.overview?.pendingPayments || 0)}</p>
                <p className="text-xs text-gray-400">Awaiting bank confirmation</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Auction Deposits</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats?.overview?.totalDeposits || 0)}</p>
                <p className="text-xs text-gray-400">{stats?.deposits?.paid || 0} collected deposits</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#B8071C]/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#B8071C]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Monthly Growth</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">{stats?.overview?.growth || 0}%</p>
                  {(stats?.overview?.growth || 0) > 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : (stats?.overview?.growth || 0) < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : null}
                </div>
                <p className="text-xs text-gray-400">Compared to last month</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Period */}
      <Card className="border border-gray-100 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <div className="w-7 h-7 rounded-lg bg-[#B8071C]/10 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-[#B8071C]" />
            </div>
            Revenue Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 text-center">
              <p className="text-xs font-medium text-gray-500 mb-1">Today</p>
              <p className="text-xl font-bold text-gray-900">{formatPrice(stats?.periods?.today?.total || 0)}</p>
              <p className="text-xs text-gray-400">{stats?.periods?.today?.count || 0} transactions</p>
            </div>
            <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 text-center">
              <p className="text-xs font-medium text-gray-500 mb-1">This Week</p>
              <p className="text-xl font-bold text-gray-900">{formatPrice(stats?.periods?.week?.total || 0)}</p>
              <p className="text-xs text-gray-400">{stats?.periods?.week?.count || 0} transactions</p>
            </div>
            <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 text-center">
              <p className="text-xs font-medium text-gray-500 mb-1">This Month</p>
              <p className="text-xl font-bold text-gray-900">{formatPrice(stats?.periods?.month?.total || 0)}</p>
              <p className="text-xs text-gray-400">{stats?.periods?.month?.count || 0} transactions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Deposits Summary */}
        <Card className="border border-gray-100 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900">Auction Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Collected</span>
                <span className="text-sm font-medium text-emerald-600">{stats?.deposits?.paid || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Pending</span>
                <span className="text-sm font-medium text-slate-600">{stats?.deposits?.pending || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Refunded</span>
                <span className="text-sm font-medium text-blue-600">{stats?.deposits?.refunded || 0}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Amount</span>
                  <span className="text-sm font-bold text-gray-900">{formatPrice(stats?.deposits?.totalAmount || 0)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Summary */}
        <Card className="border border-gray-100 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900">Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Paid</span>
                <span className="text-sm font-medium text-emerald-600">{stats?.invoices?.paid || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Issued (Unpaid)</span>
                <span className="text-sm font-medium text-slate-600">{stats?.invoices?.issued || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Voided</span>
                <span className="text-sm font-medium text-gray-500">{stats?.invoices?.voided || 0}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Unpaid Amount</span>
                  <span className="text-sm font-bold text-slate-600">{formatPrice(stats?.invoices?.totalIssuedAmount || 0)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Summary */}
        <Card className="border border-gray-100 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900">Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Active</span>
                <span className="text-sm font-medium text-emerald-600">{stats?.subscriptions?.active || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Pending</span>
                <span className="text-sm font-medium text-slate-600">{stats?.subscriptions?.pending || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Expired</span>
                <span className="text-sm font-medium text-gray-500">{stats?.subscriptions?.expired || 0}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Recurring Revenue</span>
                  <span className="text-sm font-bold text-[#B8071C]">{formatPrice(stats?.subscriptions?.revenue || 0)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border border-gray-100 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <div className="w-7 h-7 rounded-lg bg-[#B8071C]/10 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-[#B8071C]" />
            </div>
            Recent Bank Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentTransactions?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentTransactions.slice(0, 5).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.status === "succeeded" ? "bg-emerald-100" :
                      tx.status === "pending" ? "bg-slate-100" :
                        tx.status === "refunded" ? "bg-blue-100" : "bg-red-100"
                      }`}>
                      <DollarSign className={`w-4 h-4 ${tx.status === "succeeded" ? "text-emerald-600" :
                        tx.status === "pending" ? "text-slate-600" :
                          tx.status === "refunded" ? "text-blue-600" : "text-red-600"
                        }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tx.full_name || tx.username}
                      </p>
                      <p className="text-xs text-gray-500">{tx.provider} • {formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.status === "succeeded" ? "text-emerald-600" :
                      tx.status === "refunded" ? "text-blue-600" : "text-gray-900"
                      }`}>
                      {tx.status === "refunded" ? "-" : "+"}{formatPrice(tx.amount)}
                    </p>
                    <Badge variant="outline" className={`text-xs ${getStatusBadge(tx.status)}`}>
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500">No transactions recorded yet</p>
              <p className="text-sm text-gray-400">Transactions will appear here once processed by the bank</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SupportSection() {
  const [contacts, setContacts] = useState<Array<{
    id: number
    direct_sale_id: number
    user_id: number | null
    contact_name: string | null
    contact_email: string | null
    contact_phone: string | null
    message: string | null
    processed: number
    created_at: string
    // Vehicle info
    vehicle_make: string | null
    vehicle_model: string | null
    vehicle_year: number | null
    vehicle_price: number | null
    vehicle_mileage: number | null
    vehicle_fuel: string | null
    vehicle_transmission: string | null
    vehicle_location: string | null
    vehicle_condition: string | null
    vehicle_photo: string | null
    vehicle_doors: number | null
    vehicle_engine_size: number | null
    vehicle_description: string | null
    // Seller info
    seller_id: number | null
    seller_first_name: string | null
    seller_last_name: string | null
    seller_email: string | null
    seller_phone: string | null
    // Requester info
    requester_first_name: string | null
    requester_last_name: string | null
    requester_email: string | null
    requester_phone: string | null
  }>>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"open" | "resolved" | "processed" | "all">("open")
  const [selectedContact, setSelectedContact] = useState<typeof contacts[0] | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [imageIndex, setImageIndex] = useState(0)
  const [supportSubView, setSupportSubView] = useState<"direct_sales" | "karkey_cars" | "karkey_inquiries">("direct_sales")
  const [karkeyInquiries, setKarkeyInquiries] = useState<any[]>([])
  const [inquiryLoading, setInquiryLoading] = useState(false)

  // Clear selected details immediately when switching tabs so the right panel updates instantly
  useEffect(() => {
    setSelectedContact(null)
    setImages([])
    setImageIndex(0)
  }, [activeTab])

  useEffect(() => {
    fetchContacts()
    fetchKarkeyInquiries()
  }, [])

  // Listen for admin real-time updates and apply them to local state
  useEffect(() => {
    if (typeof window === "undefined") return
    let es: EventSource | null = null
    try {
      es = new EventSource("/api/admin/stream")
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data)
          if (payload?.type === "contact:update") {
            const { id: contactId, processed } = payload
            setContacts(prev => prev.map(c => c.id === contactId ? { ...c, processed } : c))
            setSelectedContact(prev => prev && prev.id === contactId ? { ...prev, processed } : prev)
          }
        } catch (e) {
          // ignore bad payloads
        }
      }
      es.onerror = () => {
        // attempt reconnect: EventSource auto-reconnects, but we can trigger re-fetch on error
        // small debounce to avoid tight loop
        setTimeout(() => { fetchContacts() }, 2000)
      }
    } catch (e) {
      // not critical
    }
    return () => { if (es) es.close() }
  }, [])

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/support-contacts", { credentials: "include" })
      const data = await res.json()
      if (data.success && Array.isArray(data.contacts)) {
        setContacts(data.contacts)
      }
    } catch (err) {
      console.error("Failed to fetch contacts", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchKarkeyInquiries = async () => {
    setInquiryLoading(true)
    try {
      const res = await fetch("/api/admin/karkey-car-inquiries")
      const data = await res.json()
      if (data.success) {
        setKarkeyInquiries(data.inquiries)
      }
    } catch (err) {
      console.error("Failed to fetch karkey inquiries", err)
    } finally {
      setInquiryLoading(false)
    }
  }

  const markInquiryProcessed = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/karkey-car-inquiries`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiry_id: id, is_processed: true })
      })
      if (res.ok) {
        fetchKarkeyInquiries()
      }
    } catch (err) {
      console.error("Failed to mark inquiry processed", err)
    }
  }

  const markProcessed = async (id: number) => {
    setProcessing(id)
    try {
      await fetch(`/api/admin/support-contacts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ processed: 1 }) })
      setContacts(prev => prev.map(c => c.id === id ? { ...c, processed: 1 } : c))
      if (selectedContact?.id === id) {
        setSelectedContact(prev => prev ? { ...prev, processed: 1 } : null)
      }
    } catch (err) {
      console.error("Failed to mark processed", err)
    } finally {
      setProcessing(null)
    }
  }

  const detailsRef = useRef<HTMLDivElement | null>(null)

  const handleSelect = (contact: any) => {
    setSelectedContact(contact)
    // build images array: support contact might include a single vehicle_photo or a JSON array string
    let imgs: string[] = []
    try {
      if ((contact as any).vehicle_photos && Array.isArray((contact as any).vehicle_photos)) {
        imgs = (contact as any).vehicle_photos
      } else if (contact.vehicle_photo) {
        // try parse as JSON array
        if (typeof contact.vehicle_photo === 'string' && contact.vehicle_photo.trim().startsWith('[')) {
          const parsed = JSON.parse(contact.vehicle_photo)
          if (Array.isArray(parsed)) imgs = parsed
        }
        if (imgs.length === 0) imgs = [contact.vehicle_photo]
      }
    } catch (e) {
      imgs = contact.vehicle_photo ? [contact.vehicle_photo] : []
    }
    setImages(imgs)
    setImageIndex(0)
    // If we only have one or no image, try to fetch full direct sale with photos
    if ((imgs.length <= 1) && contact.direct_sale_id) {
      (async () => {
        try {
          const res = await fetch(`/api/direct-sales/approved?limit=50`, { credentials: "include" })
          const data = await res.json()
          if (data && Array.isArray(data.vehicles)) {
            const found = data.vehicles.find((v: any) => Number(v.id) === Number(contact.direct_sale_id))
            if (found && Array.isArray(found.photos) && found.photos.length > 0) {
              setImages(found.photos)
              setImageIndex(0)
            }
          }
        } catch (e) {
          // ignore fetch errors
        }
      })()
    }
    // small timeout to allow DOM to render then scroll to top smoothly (faster)
    setTimeout(() => {
      try {
        detailsRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (e) {
        // ignore
      }
    }, 10)
  }

  const openContacts = contacts.filter(c => c.processed === 0)
  const processedContacts = contacts.filter(c => c.processed === 1)
  const resolvedToday = contacts.filter(c => {
    if (c.processed !== 1) return false
    const d = new Date(c.created_at)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })

  const getFilteredContacts = () => {
    switch (activeTab) {
      case "open": return openContacts
      case "resolved": return resolvedToday
      case "processed": return processedContacts
      case "all": return contacts
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return "Just now"
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
    return `${Math.floor(diff / 86400)} days ago`
  }

  const formatPrice = (price: number | null) => {
    if (!price) return "—"
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(price) + " MAD"
  }

  return (
    <div className="space-y-6">
      {/* View Switcher */}
      <div className="flex items-center gap-2 mb-2 p-1 bg-slate-100 rounded-xl w-fit">
        <Button
          variant={supportSubView === "direct_sales" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSupportSubView("direct_sales")}
          className={supportSubView === "direct_sales" ? "bg-white text-[#B8071C] shadow-sm hover:bg-white" : "text-slate-500"}
        >
          Direct Sales Inquiries
        </Button>
        <Button
          variant={supportSubView === "karkey_inquiries" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSupportSubView("karkey_inquiries")}
          className={supportSubView === "karkey_inquiries" ? "bg-white text-[#B8071C] shadow-sm hover:bg-white" : "text-slate-500"}
        >
          Karkey Car Inquiries
        </Button>
        <Button
          variant={supportSubView === "karkey_cars" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSupportSubView("karkey_cars")}
          className={supportSubView === "karkey_cars" ? "bg-white text-[#B8071C] shadow-sm hover:bg-white" : "text-slate-500"}
        >
          Manage Karkey Cars
        </Button>
      </div>

      {supportSubView === "karkey_cars" ? (
        <KarkeyCarsManager />
      ) : supportSubView === "karkey_inquiries" ? (
        <KarkeyInquiriesList
          inquiries={karkeyInquiries}
          loading={inquiryLoading}
          onMarkProcessed={markInquiryProcessed}
        />
      ) : (
        <>
          {/* Stats as Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setActiveTab("open")}
              className={`p-4 rounded-xl border-2 transition-all text-left ${activeTab === "open" ? "border-[#B8071C] bg-[#B8071C]/5 shadow-lg card-contour card-shadow" : "border-transparent bg-white shadow-md hover:border-[#B8071C] hover:shadow-lg card-contour card-shadow"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#717171] mb-0.5">Open Requests</p>
                  <p className={`text-2xl font-bold ${activeTab === "open" ? "text-[#B8071C]" : "text-[#222222]"}`}>{openContacts.length}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeTab === "open" ? "bg-[#B8071C]" : "bg-[#B8071C]/10"}`}>
                  <MessageSquare className={`w-5 h-5 ${activeTab === "open" ? "text-white" : "text-[#B8071C]"}`} />
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("resolved")}
              className={`p-4 rounded-xl border-2 transition-all text-left ${activeTab === "resolved" ? "border-[#B8071C] bg-[#B8071C]/5 shadow-lg card-contour card-shadow" : "border-transparent bg-white shadow-md hover:border-[#B8071C] hover:shadow-lg card-contour card-shadow"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#717171] mb-0.5">Resolved Today</p>
                  <p className={`text-2xl font-bold ${activeTab === "resolved" ? "text-[#B8071C]" : "text-[#222222]"}`}>{resolvedToday.length}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeTab === "resolved" ? "bg-[#B8071C]" : "bg-[#910515]/10"}`}>
                  <Clock className={`w-5 h-5 ${activeTab === "resolved" ? "text-white" : "text-[#910515]"}`} />
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("processed")}
              className={`p-4 rounded-xl border-2 transition-all text-left ${activeTab === "processed" ? "border-[#B8071C] bg-[#B8071C]/5 shadow-lg card-contour card-shadow" : "border-transparent bg-white shadow-md hover:border-[#B8071C] hover:shadow-lg card-contour card-shadow"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#717171] mb-0.5">Processed</p>
                  <p className={`text-2xl font-bold ${activeTab === "processed" ? "text-[#B8071C]" : "text-[#222222]"}`}>{processedContacts.length}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeTab === "processed" ? "bg-[#B8071C]" : "bg-[#B8071C]/10"}`}>
                  <CheckCircle className={`w-5 h-5 ${activeTab === "processed" ? "text-white" : "text-[#B8071C]"}`} />
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={`p-4 rounded-xl border-2 transition-all text-left ${activeTab === "all" ? "border-[#B8071C] bg-[#B8071C]/5 shadow-lg card-contour card-shadow" : "border-transparent bg-white shadow-md hover:border-[#B8071C] hover:shadow-lg card-contour card-shadow"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#717171] mb-0.5">Total Contacts</p>
                  <p className={`text-2xl font-bold ${activeTab === "all" ? "text-[#B8071C]" : "text-[#222222]"}`}>{contacts.length}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeTab === "all" ? "bg-[#B8071C]" : "bg-slate-100"}`}>
                  <Users className={`w-5 h-5 ${activeTab === "all" ? "text-white" : "text-slate-600"}`} />
                </div>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Contact Requests List */}
            <Card className="border-0 shadow-sm bg-white xl:col-span-2">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-[#222222] flex items-center gap-2 text-base">
                  <MessageSquare className="w-4 h-4 text-[#B8071C]" />
                  {activeTab === "open" && "Open Requests"}
                  {activeTab === "resolved" && "Resolved Today"}
                  {activeTab === "processed" && "All Processed"}
                  {activeTab === "all" && "All Contacts"}
                  <span className="text-[#717171] font-normal">({getFilteredContacts().length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-[#B8071C] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : getFilteredContacts().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-[#717171] text-sm">No requests in this category.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
                    {getFilteredContacts().map(contact => (
                      <div
                        key={contact.id}
                        onClick={() => handleSelect(contact)}
                        className={`flex items-center gap-4 p-4 cursor-pointer transition-all hover:bg-slate-50 ${selectedContact?.id === contact.id ? 'bg-[#B8071C]/5 border-l-2 border-l-[#B8071C]' : ''}`}
                      >
                        {/* Vehicle thumbnail */}
                        <div className="w-16 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          {contact.vehicle_photo ? (
                            <img src={contact.vehicle_photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[#222222] text-sm truncate">
                              {contact.contact_name || [contact.requester_first_name, contact.requester_last_name].filter(Boolean).join(" ") || "Anonymous"}
                            </p>
                            <Badge className={`border-0 text-xs ${contact.processed ? "bg-[#910515]/10 text-[#910515]" : "bg-[#B8071C]/10 text-[#B8071C]"}`}>
                              {contact.processed ? "Done" : "Open"}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#717171] truncate">
                            {contact.vehicle_make} {contact.vehicle_model} {contact.vehicle_year}
                          </p>
                          <p className="text-xs text-slate-400">{formatTimeAgo(contact.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Details Panel - Expanded */}
            <Card className="border-0 shadow-sm bg-white xl:col-span-3">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-[#222222] text-base">Request Details</CardTitle>
              </CardHeader>
              <CardContent ref={detailsRef} className="p-5 max-h-[750px] overflow-y-auto">
                {selectedContact ? (
                  <div className="space-y-6">
                    {/* Vehicle Info - Full Width with Image */}
                    <div>
                      <h4 className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Vehicle Information
                      </h4>
                      <div className="bg-slate-50 rounded-xl p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                          {/* Vehicle Image (carousel if multiple) */}
                          <div className="relative overflow-hidden rounded-2xl shadow-sm">
                            {images && images.length > 0 ? (
                              <>
                                <img src={images[imageIndex]} alt="vehicle" className="w-full h-56 md:h-64 object-cover rounded-2xl" />
                                {images.length > 1 && (
                                  <>
                                    <button onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)} aria-label="Previous" className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-md hover:bg-white">
                                      ‹
                                    </button>
                                    <button onClick={() => setImageIndex((i) => (i + 1) % images.length)} aria-label="Next" className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-md hover:bg-white">
                                      ›
                                    </button>
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-2 flex items-center gap-2">
                                      {images.map((_, idx) => (
                                        <button key={idx} onClick={() => setImageIndex(idx)} className={`w-2 h-2 rounded-full ${idx === imageIndex ? 'bg-[#B8071C]' : 'bg-white/60'} border border-white`} />
                                      ))}
                                    </div>
                                  </>
                                )}
                              </>
                            ) : (
                              <div className="w-full h-56 md:h-64 bg-slate-200 rounded-2xl flex items-center justify-center">
                                <FileText className="w-12 h-12 text-slate-400" />
                              </div>
                            )}
                          </div>
                          {/* Vehicle Details */}
                          <div className="pt-1">
                            <h3 className="text-xl md:text-2xl font-semibold text-[#111827] mb-1 leading-tight">
                              {selectedContact.vehicle_make} {selectedContact.vehicle_model} {selectedContact.vehicle_year}
                            </h3>
                            <p className="text-2xl md:text-3xl font-bold text-[#B8071C] mb-2">{formatPrice(selectedContact.vehicle_price)}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                              <div className="flex flex-col">
                                <span className="text-xs text-[#717171]">Mileage</span>
                                <span className="font-medium text-[#222222]">{selectedContact.vehicle_mileage?.toLocaleString() || "—"} km</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-[#717171]">Fuel</span>
                                <span className="font-medium text-[#222222]">{selectedContact.vehicle_fuel || "—"}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-[#717171]">Transmission</span>
                                <span className="font-medium text-[#222222]">{selectedContact.vehicle_transmission || "—"}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-[#717171]">Condition</span>
                                <span className="font-medium text-[#222222]">{selectedContact.vehicle_condition || "—"}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-[#717171]">Doors</span>
                                <span className="font-medium text-[#222222]">{selectedContact.vehicle_doors || "—"}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-[#717171]">Engine</span>
                                <span className="font-medium text-[#222222]">{selectedContact.vehicle_engine_size ? `${selectedContact.vehicle_engine_size} L` : "—"}</span>
                              </div>
                              <div className="col-span-1 sm:col-span-2 md:col-span-3">
                                <span className="text-xs text-[#717171]">Location</span>
                                <div className="font-medium text-[#222222]">{selectedContact.vehicle_location || "—"}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Vehicle Description */}
                        {selectedContact.vehicle_description && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-xs text-[#717171] mb-2">Description:</p>
                            <div className="text-sm text-[#222222] bg-white rounded-lg p-4 border border-gray-100">
                              {selectedContact.vehicle_description}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Two Column Layout for Requester and Seller */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Requester Info */}
                      <div>
                        <h4 className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-3 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Requester
                        </h4>
                        <div className="bg-white rounded-xl p-4 space-y-3 border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#B8071C]/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-[#B8071C]" />
                            </div>
                            <div>
                              <p className="font-semibold text-[#222222]">
                                {selectedContact.contact_name || [selectedContact.requester_first_name, selectedContact.requester_last_name].filter(Boolean).join(" ") || "Anonymous"}
                              </p>
                              {selectedContact.user_id && <p className="text-xs text-slate-400">User ID: #{selectedContact.user_id}</p>}
                            </div>
                          </div>

                          {(selectedContact.contact_email || selectedContact.requester_email) && (
                            <div className="flex items-center gap-3 pl-1">
                              <Mail className="w-4 h-4 text-[#717171]" />
                              <span className="text-sm text-[#222222]">{selectedContact.contact_email || selectedContact.requester_email}</span>
                            </div>
                          )}
                          {(selectedContact.contact_phone || selectedContact.requester_phone) && (
                            <div className="flex items-center gap-3 pl-1">
                              <Phone className="w-4 h-4 text-[#717171]" />
                              <span className="text-sm text-[#222222]">{selectedContact.contact_phone || selectedContact.requester_phone}</span>
                            </div>
                          )}

                          {selectedContact.message && (
                            <div className="pt-3 border-t border-slate-200">
                              <p className="text-xs text-[#717171] mb-2">Message:</p>
                              <div className="text-sm text-[#222222] bg-white rounded-lg p-3 border border-gray-100">{selectedContact.message}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Seller Info */}
                      <div>
                        <h4 className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-3 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Seller
                        </h4>
                        <div className="bg-white rounded-xl p-4 space-y-3 border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                              <User className="w-5 h-5 text-slate-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-[#222222]">
                                {[selectedContact.seller_first_name, selectedContact.seller_last_name].filter(Boolean).join(" ") || "Unknown"}
                              </p>
                              {selectedContact.seller_id && <p className="text-xs text-slate-400">User ID: #{selectedContact.seller_id}</p>}
                            </div>
                          </div>

                          {selectedContact.seller_email && (
                            <div className="flex items-center gap-3 pl-1">
                              <Mail className="w-4 h-4 text-[#717171]" />
                              <span className="text-sm text-[#222222]">{selectedContact.seller_email}</span>
                            </div>
                          )}
                          {selectedContact.seller_phone && (
                            <div className="flex items-center gap-3 pl-1">
                              <Phone className="w-4 h-4 text-[#717171]" />
                              <span className="text-sm text-[#222222]">{selectedContact.seller_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                        <span>Request #{selectedContact.id} • Direct Sale #{selectedContact.direct_sale_id}</span>
                        <span>{formatTimeAgo(selectedContact.created_at)}</span>
                      </div>
                      {!selectedContact.processed ? (
                        <Button
                          className="w-full bg-[#B8071C] hover:bg-[#910515] text-white py-3"
                          disabled={processing === selectedContact.id}
                          onClick={() => markProcessed(selectedContact.id)}
                        >
                          {processing === selectedContact.id ? "Processing..." : "Mark as Processed"}
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center gap-2 py-3 bg-[#910515]/10 rounded-lg text-[#910515]">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Already Processed</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Eye className="w-10 h-10 text-slate-400" />
                    </div>
                    <p className="text-[#717171]">Select a request to view details</p>
                    <p className="text-sm text-slate-400 mt-1">Click on any request from the list</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
