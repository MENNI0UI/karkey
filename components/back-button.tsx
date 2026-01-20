"use client"

import { useRouter } from "next/navigation"
import React from "react"

export default function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 text-sm text-[#FF385C] hover:underline"
      aria-label="Go back"
    >
      ← {label}
    </button>
  )
}
