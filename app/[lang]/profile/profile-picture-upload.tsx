"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"

export default function ProfilePictureUpload({
  userId,
  currentPicture = null,
  children,
  className,
}: {
  userId: number,
  currentPicture?: string | null,
  children?: React.ReactNode,
  className?: string,
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentPicture ?? null)
  const router = useRouter()

  const normalizePhotoUrl = (p: any) => {
    if (!p) return "/placeholder.svg"
    const s = String(p || "").trim()
    if (!s) return "/placeholder.svg"
    if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) return s
    return `/uploads/vehicles/${s}`
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append("picture", file)
      fd.append("userId", String(userId))

      // endpoint: create /api/profile/picture to accept multipart/form-data and return { success: true, url }
      const res = await fetch("/api/profile/picture", {
        method: "POST",
        credentials: "include",
        body: fd,
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json?.success && json?.url) {
        const url = normalizePhotoUrl(json.url)
        // If the server returns the same filename (overwrite), browsers may
        // continue to show the cached image. Append a cache-busting query
        // param so clients fetch the fresh upload immediately in dev.
        const cacheBusted = url.includes("?") ? `${url}&cb=${Date.now()}` : `${url}?cb=${Date.now()}`
        setPreview(cacheBusted)
        try {
          localStorage.setItem("auth_profile_picture", String(cacheBusted))
          localStorage.setItem("auth_profile_userid", String(userId))
        } catch { }
        // notify header and other tabs immediately
        try {
          window.dispatchEvent(new CustomEvent("profile:picture-updated", { detail: { userId, url: cacheBusted } }))
          // include minimal user object so header fast-path updates immediately
          window.dispatchEvent(new CustomEvent("auth:changed", { detail: { action: "profile-update", user: { id: Number(userId), profile_picture: cacheBusted }, url: cacheBusted, userId } }))
        } catch { }
        // optionally refresh route fragments that rely on profile
        try { router.replace(window.location.pathname); router.refresh?.(); } catch { }
      } else {
        console.error("Upload failed", json)
      }
    } catch (err) {
      console.error("Upload error", err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={className || (!children ? "absolute -bottom-3 -right-3" : "")}>
      <label className={!children ? "inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-[#d1f2e1] shadow-sm cursor-pointer" : "cursor-pointer block"}>
        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        {children || (
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="none" stroke="#B8071C">
            <path d="M12 5v14M5 12h14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </label>
    </div>
  )
}
