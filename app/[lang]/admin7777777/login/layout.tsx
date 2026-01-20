"use client"
import React from "react"

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    // use main-site-like gentle background so admin login visually matches main site
    <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      {children}
    </main>
  )
}
