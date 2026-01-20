import React from "react"
import dynamic from "next/dynamic"
import RouteProtection from "@/components/auth/route-protection"

// Dynamic import to reduce initial bundle size
const CreateDirectSaleWizard = dynamic(
  () => import("@/components/create-direct-sale-wizard"),
  {
    loading: () => (
      <div className="w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    ),
  }
)

export const metadata = {
  title: "Create Direct Sale - Karkey",
}

export default function CreateDirectSalePage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] py-8">
      <RouteProtection redirectType="direct-sale" />
      <div className="w-full">
        <CreateDirectSaleWizard />
      </div>
    </main>
  )
}
