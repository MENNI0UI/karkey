"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  LogOut,
  CheckSquare,
  DollarSign,
  HeadphonesIcon,
  Crown,
} from "lucide-react"
import {
  getAdminSession,
  getPendingDirectSales,
  approveDirectSale,
  rejectDirectSale,
  adminLogout,
} from "./actions"
import {
  VerificationSection,
  CEOSection,
  FinanceSection,
  SupportSection,
  type PendingDirectSale,
} from "./components/sections"

type AdminRole = "ceo" | "verification" | "finance" | "support"

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<{
    id: number
    nom: string
    prenom: string
    role: AdminRole
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<AdminRole | null>(null)

  // Direct sales state (for verification section)
  const [directSales, setDirectSales] = useState<PendingDirectSale[]>([])
  const [directSalesTotal, setDirectSalesTotal] = useState(0)
  const [selectedDirectSale, setSelectedDirectSale] = useState<PendingDirectSale | null>(null)
  const [directSaleRejectionReason, setDirectSaleRejectionReason] = useState("")
  const [processing, setProcessing] = useState(false)

  // Load pending direct sales for verification
  const loadPendingDirectSales = useCallback(async () => {
    const result = await getPendingDirectSales()
    if (result.success && result.directSales) {
      setDirectSales(result.directSales as unknown as PendingDirectSale[])
      setDirectSalesTotal(result.total || 0)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [])

  useEffect(() => {
    if (activeSection === "verification") {
      loadPendingDirectSales()
    }
  }, [activeSection, loadPendingDirectSales])

  const checkSession = async () => {
    const result = await getAdminSession()
    if (result.success && result.admin) {
      setAdmin(result.admin as { id: number; nom: string; prenom: string; role: AdminRole })
      // Set default section based on role
      if (result.admin.role === "ceo") {
        setActiveSection("ceo")
      } else if (result.admin.role === "verification") {
        setActiveSection("verification")
      } else if (result.admin.role === "finance") {
        setActiveSection("finance")
      } else if (result.admin.role === "support") {
        setActiveSection("support")
      }
    } else {
      router.push("/admin/login")
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await adminLogout()
    router.push("/admin/login")
  }

  const handleApproveDirectSale = async (directSaleId: number) => {
    setProcessing(true)
    const result = await approveDirectSale(directSaleId)
    if (result.success) {
      alert("Direct sale listing approved successfully")
      setSelectedDirectSale(null)
      loadPendingDirectSales()
    } else {
      alert(result.error || "Failed to approve listing")
    }
    setProcessing(false)
  }

  const handleRejectDirectSale = async (directSaleId: number) => {
    if (!directSaleRejectionReason.trim()) {
      alert("Please select a rejection reason")
      return
    }
    setProcessing(true)
    const result = await rejectDirectSale(directSaleId, directSaleRejectionReason)
    if (result.success) {
      alert("Direct sale listing rejected")
      setSelectedDirectSale(null)
      setDirectSaleRejectionReason("")
      loadPendingDirectSales()
    } else {
      alert(result.error || "Failed to reject listing")
    }
    setProcessing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#103090]"></div>
      </div>
    )
  }

  if (!admin) {
    return null
  }

  // Role-based access
  const roleConfig: Record<AdminRole, { label: string; color: string; sections: AdminRole[] }> = {
    ceo: {
      label: "CEO Access",
      color: "bg-gradient-to-r from-[#103090] to-[#041a5f]",
      sections: ["ceo", "verification", "finance", "support"],
    },
    verification: {
      label: "Verification Officer",
      color: "bg-gradient-to-r from-[#B8071C] to-[#8a0415]",
      sections: ["verification"],
    },
    finance: {
      label: "Finance Manager",
      color: "bg-gradient-to-r from-[#00A651] to-[#007a3d]",
      sections: ["finance"],
    },
    support: {
      label: "Customer Support",
      color: "bg-gradient-to-r from-[#DEB735] to-[#b3901b]",
      sections: ["support"],
    },
  }

  const currentRole = roleConfig[admin.role]
  const availableSections = currentRole.sections

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#B8071C] selection:text-white">
      {/* Premium Glass Header */}
      <header className="sticky top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm z-50 transition-all duration-300">
        {/* Top Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#B8071C] via-[#DEB735] to-[#103090]" />

        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left side - Logo and Role Badge */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-br from-[#B8071C] to-[#103090] rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                  <div className="relative w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm">
                    <Shield className="w-6 h-6 text-[#B8071C]" />
                  </div>
                </div>
                <div>
                  <h1 className="font-bold text-xl text-[#0f172a] tracking-tight">Karkey<span className="text-[#B8071C]">.Admin</span></h1>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <Badge className={`${currentRole.color} text-white border-0 px-3 py-1 shadow-sm`}>
                {currentRole.label}
              </Badge>
            </div>

            {/* Right side - Admin info and logout */}
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-3 text-right">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#0f172a]">
                    {admin.prenom} {admin.nom}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Administrator</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#103090] font-bold shadow-inner">
                  {admin.prenom.charAt(0)}{admin.nom.charAt(0)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-500 hover:text-[#B8071C] hover:bg-red-50 transition-colors gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1920px] mx-auto">
        {/* Section Tabs - Only show if user has multiple sections */}
        {availableSections.length > 1 && (
          <div className="mb-8 flex justify-center">
            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 inline-flex gap-1">
              {availableSections.includes("ceo") && (
                <Button
                  onClick={() => setActiveSection("ceo")}
                  variant="ghost"
                  className={`rounded-xl px-6 py-2 h-10 transition-all duration-200 ${activeSection === "ceo"
                      ? "bg-[#103090] text-white shadow-md shadow-blue-900/20"
                      : "text-slate-500 hover:text-[#103090] hover:bg-blue-50"
                    }`}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  CEO Dashboard
                </Button>
              )}
              {availableSections.includes("verification") && (
                <Button
                  onClick={() => setActiveSection("verification")}
                  variant="ghost"
                  className={`rounded-xl px-6 py-2 h-10 transition-all duration-200 ${activeSection === "verification"
                      ? "bg-[#B8071C] text-white shadow-md shadow-red-900/20"
                      : "text-slate-500 hover:text-[#B8071C] hover:bg-red-50"
                    }`}
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Verification
                  {directSalesTotal > 0 && (
                    <span className="ml-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-white text-[#B8071C]">
                      {directSalesTotal}
                    </span>
                  )}
                </Button>
              )}
              {availableSections.includes("finance") && (
                <Button
                  onClick={() => setActiveSection("finance")}
                  variant="ghost"
                  className={`rounded-xl px-6 py-2 h-10 transition-all duration-200 ${activeSection === "finance"
                      ? "bg-[#00A651] text-white shadow-md shadow-green-900/20"
                      : "text-slate-500 hover:text-[#00A651] hover:bg-green-50"
                    }`}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Finance
                </Button>
              )}
              {availableSections.includes("support") && (
                <Button
                  onClick={() => setActiveSection("support")}
                  variant="ghost"
                  className={`rounded-xl px-6 py-2 h-10 transition-all duration-200 ${activeSection === "support"
                      ? "bg-[#DEB735] text-white shadow-md shadow-yellow-900/20"
                      : "text-slate-500 hover:text-[#DEB735] hover:bg-yellow-50"
                    }`}
                >
                  <HeadphonesIcon className="w-4 h-4 mr-2" />
                  Support
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Section Content */}
        {activeSection === "verification" && (
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
        )}

        {activeSection === "ceo" && <CEOSection currentAdminId={admin.id} />}

        {activeSection === "finance" && <FinanceSection />}

        {activeSection === "support" && <SupportSection />}
      </main>
    </div>
  )
}
