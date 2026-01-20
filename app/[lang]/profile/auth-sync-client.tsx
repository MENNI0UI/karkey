"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AuthSyncClient({ fallbackRedirect = "/auth/login" }: { fallbackRedirect?: string }) {
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const run = async () => {
      try {
        // منع المزامنة إذا كان تسجيل الخروج معطل
        if (typeof window !== "undefined") {
          const disabled = localStorage.getItem("auth:disabled")
          const globalFlag = Boolean((window as any).__preventAuthSync)
          if (disabled === "1" || globalFlag) {
            // لا تزامن الجلسة بعد تسجيل الخروج
            return
          }
        }

        const token = typeof window !== "undefined" ? (localStorage.getItem("auth_token") ?? localStorage.getItem("auth:token")) : null
        if (!token) {
          if (!mounted) return
          router.replace(fallbackRedirect)
          return
        }

        // Best-effort: POST token to server to set HttpOnly cookie
        await fetch("/api/auth/session", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }).catch(() => null)

        if (!mounted) return
        // Replace current route so SSR runs again with cookie present
        try {
          router.replace(window.location.pathname)
        } catch {
          router.replace("/profile")
        }
      } catch {
        try { router.replace(fallbackRedirect) } catch {}
      }
    }

    run()
    return () => { mounted = false }
  }, [router, fallbackRedirect])

  // Render nothing — silent fast-path sync (no "Restoring session..." UI)
  return null
}
