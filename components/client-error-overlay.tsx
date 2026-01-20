"use client"
import React, { useEffect, useState } from "react"

export default function ClientErrorOverlay() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const onError = (ev: ErrorEvent) => {
      try {
        const msg = ev?.message || String(ev?.error?.message ?? ev?.error ?? "Unknown client error")
        setErrorMsg(msg)
        // also emit global event for diagnostics if other code listens
        try { window.dispatchEvent(new CustomEvent("client:error", { detail: { message: msg } })) } catch {}
      } catch {}
    }
    const onRejection = (ev: PromiseRejectionEvent) => {
      try {
        const reason = ev?.reason
        const msg = typeof reason === "string" ? reason : (reason && reason.message) ? reason.message : "Unhandled promise rejection"
        setErrorMsg(msg)
        try { window.dispatchEvent(new CustomEvent("client:error", { detail: { message: msg } })) } catch {}
      } catch {}
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  if (!errorMsg) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-4 right-4 z-[99999] max-w-sm w-full bg-red-600 text-white rounded-lg shadow-lg p-3"
      style={{ fontSize: 13 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="font-semibold">Client error</div>
          <div className="mt-1 truncate" title={errorMsg}>{errorMsg}</div>
        </div>
        <button
          onClick={() => setErrorMsg(null)}
          aria-label="Dismiss error"
          className="ml-2 text-white opacity-90 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
