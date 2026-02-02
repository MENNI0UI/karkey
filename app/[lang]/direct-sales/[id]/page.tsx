"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Phone } from "lucide-react"
import { DirectSaleCard } from "@/components/direct-sale-card"
import UnifiedCarLayout, { CarData, SellerData } from "@/components/unified-car-layout"
import ContactUsModal from "@/components/contact-us-modal"
import { useTranslation } from "@/lib/i18n-context"

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

  // For all other cases, if it doesn't look like base64 or external URL, it's a filename
  const filename = cleanedString.includes("/") ? cleanedString.split("/").pop() : cleanedString
  return `https://img.karkey.space/vehicles/${filename}`
}

export default function DirectSalePage() {
  const { id } = useParams()
  const { t, language } = useTranslation()
  const [vehicle, setVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showContactModal, setShowContactModal] = useState(false)

  // Watchlist state
  const vehicleId = id
  const cachedKey = vehicleId ? `watchlist_cached:${String(vehicleId)}` : null
  const [saved, setSaved] = useState<boolean>(false)

  useEffect(() => {
    try {
      if (cachedKey) {
        const cv = localStorage.getItem(cachedKey)
        if (cv === "1") setSaved(true)
      }
    } catch { }
  }, [cachedKey])
  const [stableSaved, setStableSaved] = useState<boolean>(saved)
  const [saving, setSaving] = useState<boolean>(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [transitionsDisabled, setTransitionsDisabled] = useState<boolean>(true)
  const lastSavedToggleRef = (globalThis as any).__lastSavedToggleRefForDetail ??= { value: 0 }

  const safeSetSaved = (val: boolean) => {
    try {
      const now = Date.now()
      if (now - lastSavedToggleRef.value < 250) return
      lastSavedToggleRef.value = now
      setSaved(val)
    } catch { try { setSaved(val) } catch { } }
  }

  useEffect(() => {
    let idt: any = null
    try { idt = setTimeout(() => setStableSaved(saved), 200) } catch { }
    return () => { try { if (idt) clearTimeout(idt) } catch { } }
  }, [saved])

  // Bubble UI state
  const [bubbleOpen, setBubbleOpen] = useState<boolean>(false)
  const [bubbleType, setBubbleType] = useState<"signin" | "confirm" | "success" | "error" | null>(null)
  const [bubbleText, setBubbleText] = useState<string | null>(null)
  const [confirmIsRemove, setConfirmIsRemove] = useState<boolean>(false)
  let bubbleTimer: any = null
  const bubbleRef = useRef<HTMLDivElement | null>(null)
  const watchlistBtnRef = useRef<HTMLButtonElement | null>(null)

  const showBubble = (type: typeof bubbleType, text?: string, autoHideMs?: number) => {
    setBubbleType(type)
    setBubbleText(text ?? null)
    setBubbleOpen(true)
    if (bubbleTimer) clearTimeout(bubbleTimer)
    const ms = typeof autoHideMs === "number" ? autoHideMs : (type === "signin" ? 5000 : undefined)
    if (ms && ms > 0) {
      bubbleTimer = setTimeout(() => { setBubbleOpen(false); setBubbleType(null); setBubbleText(null) }, ms)
    }
  }

  const hideBubble = () => {
    if (bubbleTimer) clearTimeout(bubbleTimer)
    setBubbleOpen(false)
    setBubbleType(null)
    setBubbleText(null)
  }

  useEffect(() => {
    if (!bubbleOpen) return
    function onDocClick(e: MouseEvent) {
      try {
        const target = e.target as Node | null
        if (!target) return
        if (bubbleRef.current && bubbleRef.current.contains(target)) return
        if (watchlistBtnRef.current && watchlistBtnRef.current.contains(target)) return
        hideBubble()
      } catch { }
    }
    function onKey(e: KeyboardEvent) {
      try { if (e.key === "Escape") hideBubble() } catch { }
    }
    document.addEventListener("click", onDocClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("click", onDocClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [bubbleOpen])

  const isClientAuthenticated = (): boolean => {
    try {
      if (typeof window === "undefined") return false
      if (localStorage.getItem("auth:disabled") === "1" || Boolean((window as any).__preventAuthSync)) return false
      const token = localStorage.getItem("auth_token") ?? localStorage.getItem("auth:token")
      if (token) return true
      const ck = document.cookie || ""
      if (ck.includes("auth_token=") || ck.includes("auth:token=") || ck.includes("karkey_auth")) return true
    } catch { }
    return false
  }

  // Resolve user & initial saved state
  useEffect(() => {
    if (!vehicleId) return
    let mounted = true
      ; (async () => {
        try {
          try {
            if (cachedKey) {
              const cv = localStorage.getItem(cachedKey)
              if (cv === "1" || cv === "0") safeSetSaved(cv === "1")
            }
          } catch { }

          const r = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" }).catch(() => null)
          if (!mounted) return
          if (!r || !r.ok) { setCurrentUserId(null); return }
          const j = await r.json().catch(() => ({}))
          const uid = (j?.user?.id ?? j?.user?.userId ?? j?.userId) ?? null
          if (uid && Number(uid) > 0) {
            setCurrentUserId(Number(uid))
            try {
              const key = `watchlist:${String(uid)}:${String(vehicleId)}`
              const v = localStorage.getItem(key)
              if (v === "1" || v === "0") safeSetSaved(v === "1")
            } catch { }
            try {
              const check = await fetch(`/api/direct-sales-watchlist/check?direct_sale_id=${encodeURIComponent(String(vehicleId))}`, {
                credentials: "include",
                cache: "no-store"
              })
              if (check.ok) {
                const cj = await check.json().catch(() => null)
                if (cj && typeof cj.saved === "boolean") {
                  safeSetSaved(Boolean(cj.saved))
                  try { if (cachedKey) localStorage.setItem(cachedKey, cj.saved ? "1" : "0") } catch { }
                }
              }
            } catch { }
          } else {
            setCurrentUserId(null)
          }
        } catch { }
        try { setTransitionsDisabled(false) } catch { }
      })()
    return () => { mounted = false }
  }, [vehicleId])

  useEffect(() => {
    function onWatchlistChanged(e: Event) {
      try {
        const d = (e as CustomEvent)?.detail
        if (!d) return
        const payloadVehicleId = String(d.direct_sale_id ?? d.directSaleId ?? "")
        const payloadUserId = d.userId ?? null
        if (String(vehicleId) !== payloadVehicleId) return
        if (payloadUserId && currentUserId && Number(payloadUserId) !== Number(currentUserId)) return
        if (d.action === "add") {
          safeSetSaved(true)
          try { if (cachedKey) localStorage.setItem(cachedKey, "1") } catch { }
        } else if (d.action === "remove") {
          safeSetSaved(false)
          try { if (cachedKey) localStorage.setItem(cachedKey, "0") } catch { }
        }
      } catch { }
    }
    function onStorage(e: StorageEvent) {
      try {
        const key = e.key ?? ""
        if (cachedKey && key === cachedKey) { safeSetSaved(e.newValue === "1"); return }
        if (!key.startsWith("watchlist:")) return
        const parts = key.split(":")
        const storedUserId = parts[1] ? Number(parts[1]) : null
        const storedVehicleId = parts[2] ? String(parts[2]) : null
        if (!storedVehicleId || String(vehicleId) !== storedVehicleId) return
        if (storedUserId && currentUserId && Number(storedUserId) !== Number(currentUserId)) return
        const isSaved = e.newValue === "1"
        safeSetSaved(Boolean(isSaved))
        try { if (cachedKey) localStorage.setItem(cachedKey, isSaved ? "1" : "0") } catch { }
      } catch { }
    }
    window.addEventListener("watchlist:changed", onWatchlistChanged)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("watchlist:changed", onWatchlistChanged)
      window.removeEventListener("storage", onStorage)
    }
  }, [vehicleId, currentUserId])

  const handleAddToWatchlist = async (e?: any) => {
    if (e) e.stopPropagation()
    if (!vehicleId) { alert("Invalid vehicle"); return }
    if (saving) return
    if (saved) {
      setConfirmIsRemove(true)
      showBubble("confirm", "Remove this vehicle from your watchlist?")
      return
    }
    if (!currentUserId && !isClientAuthenticated()) {
      showBubble("signin", t("watchlist.signin_required"))
      return
    }
    try {
      const chk = await fetch("/api/auth/check", { cache: "no-store" }).catch(() => null)
      if (!chk) { showBubble("signin", "Sign in to save items"); return }
      const cj = await chk.json().catch(() => ({}))
      if (!cj?.isAuthenticated) { showBubble("signin", "Sign in to save items"); return }
    } catch { showBubble("signin", "Sign in to save items"); return }
    setConfirmIsRemove(false)
    showBubble("confirm", "Add this vehicle to your watchlist?")
  }

  const confirmAdd = async () => {
    hideBubble()
    if (!vehicleId || saving) return
    setSaving(true)
    try {
      try {
        const chk = await fetch("/api/auth/check", { cache: "no-store" }).catch(() => null)
        const cj = chk ? await chk.json().catch(() => ({})) : {}
        if (!cj?.isAuthenticated) {
          showBubble("signin", t("watchlist.signin_required"))
          setSaving(false)
          return
        }
      } catch { }
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      try {
        const localToken = localStorage.getItem("auth_token") ?? localStorage.getItem("auth:token")
        if (localToken && localStorage.getItem("auth:disabled") !== "1" && !(window as any).__preventAuthSync)
          headers["Authorization"] = `Bearer ${localToken}`
      } catch { }
      const res = await fetch("/api/direct-sales-watchlist/add", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ direct_sale_id: Number(vehicleId) })
      })
      if (res.status === 401) {
        showBubble("signin", t("watchlist.signin_required"))
        setSaving(false)
        return
      }
      const json = await res.json().catch(() => ({}))
      if (res.ok && (json.success || json.alreadyExists)) {
        try {
          if (currentUserId != null)
            localStorage.setItem(`watchlist:${currentUserId}:${String(vehicleId)}`, "1")
        } catch { }
        safeSetSaved(true)
        try { if (cachedKey) localStorage.setItem(cachedKey, "1") } catch { }
        const msg = json.alreadyExists
          ? `Already saved to your watchlist.`
          : `You saved to your watchlist.`
        showBubble("success", msg, 1600)
        try { window.dispatchEvent(new CustomEvent("notifications:updated")) } catch { }
        try { localStorage.setItem("notifications:refresh", String(Date.now())) } catch { }
        try {
          window.dispatchEvent(new CustomEvent("watchlist:changed", {
            detail: { direct_sale_id: Number(vehicleId), userId: currentUserId, action: "add" }
          }))
        } catch { }
        try { localStorage.setItem("watchlist:refresh", String(Date.now())) } catch { }
      } else {
        try {
          if (currentUserId != null)
            localStorage.removeItem(`watchlist:${currentUserId}:${String(vehicleId)}`)
        } catch { }
        try { if (cachedKey) localStorage.setItem(cachedKey, "0") } catch { }
        showBubble("error", json.error ?? "Failed to save", 3000)
      }
    } catch (err) {
      console.error("[watchlist] confirmAdd error:", err)
      try {
        if (currentUserId != null)
          localStorage.removeItem(`watchlist:${currentUserId}:${String(vehicleId)}`)
      } catch { }
      try { if (cachedKey) localStorage.setItem(cachedKey, "0") } catch { }
      showBubble("error", "Network error", 3000)
    } finally {
      setSaving(false)
    }
  }

  const confirmRemove = async () => {
    hideBubble()
    if (!vehicleId || saving) return
    setSaving(true)
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      try {
        const localToken = localStorage.getItem("auth_token") ?? localStorage.getItem("auth:token")
        if (localToken && localStorage.getItem("auth:disabled") !== "1" && !(window as any).__preventAuthSync)
          headers["Authorization"] = `Bearer ${localToken}`
      } catch { }
      const res = await fetch("/api/direct-sales-watchlist/remove", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ direct_sale_id: Number(vehicleId) })
      })
      if (res.status === 401) {
        showBubble("signin", "Sign in to remove items")
        setSaving(false)
        return
      }
      const json = await res.json().catch(() => ({}))
      if (res.ok && (json.success || json.removed)) {
        try {
          if (currentUserId != null)
            localStorage.removeItem(`watchlist:${currentUserId}:${String(vehicleId)}`)
        } catch { }
        safeSetSaved(false)
        try { if (cachedKey) localStorage.setItem(cachedKey, "0") } catch { }
        showBubble("success", `Removed from your watchlist.`, 1400)
        try {
          window.dispatchEvent(new CustomEvent("watchlist:changed", {
            detail: { showroomId: Number(vehicleId), userId: currentUserId, action: "remove" }
          }))
        } catch { }
        try { localStorage.setItem("watchlist:refresh", String(Date.now())) } catch { }
      } else {
        if (json && typeof json.error === "string" && json.error.length > 0) {
          showBubble("error", json.error, 2600)
        } else {
          try {
            if (currentUserId != null)
              localStorage.removeItem(`watchlist:${currentUserId}:${String(vehicleId)}`)
          } catch { }
          safeSetSaved(false)
          try { if (cachedKey) localStorage.setItem(cachedKey, "0") } catch { }
          try {
            window.dispatchEvent(new CustomEvent("watchlist:changed", {
              detail: { direct_sale_id: Number(vehicleId), userId: currentUserId, action: "remove" }
            }))
          } catch { }
          try { localStorage.setItem("watchlist:refresh", String(Date.now())) } catch { }
          showBubble("success", "Removed locally (server may be unavailable)", 2200)
        }
      }
    } catch (err) {
      console.error("[watchlist] confirmRemove error:", err)
      showBubble("error", "Network error", 2600)
    } finally {
      setSaving(false)
    }
  }

  const cancelAdd = () => hideBubble()

  // Load main vehicle
  useEffect(() => {
    if (!id) return
    const ac = new AbortController()
    setLoading(true)
      ; (async () => {
        try {
          const res = await fetch(`/api/direct-sales/${id}`, { signal: ac.signal, cache: "no-store", credentials: "include" })
          if (!res.ok) throw new Error("not-ok")
          const data = await res.json().catch(() => null)
          if (!data || !data.success || !data.direct_sale) throw new Error("no-data")

          // Unpack direct_sale and merge seller
          setVehicle({
            ...data.direct_sale,
            seller: data.seller
          })

          // Increment view count
          fetch(`/api/listings/${id}/view`, { method: "POST", cache: "no-store", credentials: "include" }).catch(() => { })
        } catch {
          try {
            // Fallback: try to find in approved list
            const res2 = await fetch("/api/direct-sales/approved", { signal: ac.signal, cache: "no-store" })
            if (res2.ok) {
              const data2 = await res2.json().catch(() => null)
              const found = Array.isArray(data2?.vehicles)
                ? data2.vehicles.find((v: any) => String(v.id) === String(id))
                : null
              setVehicle(found)
              if (found) {
                fetch(`/api/listings/${id}/view`, { method: "POST", cache: "no-store", credentials: "include" }).catch(() => { })
              }
            } else {
              setVehicle(null)
            }
          } catch {
            setVehicle(null)
          }
        } finally {
          if (!ac.signal.aborted) setLoading(false)
        }
      })()
    return () => { ac.abort() }
  }, [id])

  // Fetch suggestions
  const [allVehicles, setAllVehicles] = useState<any[]>([])
  useEffect(() => {
    if (!vehicle) return
    let mounted = true
    const ac = new AbortController()
    const run = async () => {
      try {
        const res = await fetch("/api/direct-sales/approved", { signal: ac.signal, cache: "no-store" })
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        if (!mounted) return
        if (Array.isArray(data?.vehicles)) setAllVehicles(data.vehicles)
      } catch { }
    }
    if (typeof (window as any).requestIdleCallback === "function") {
      (window as any).requestIdleCallback(() => void run(), { timeout: 1000 })
    } else {
      const t = window.setTimeout(() => void run(), 300)
      return () => { mounted = false; ac.abort; clearTimeout(t) }
    }
    return () => { mounted = false; ac.abort() }
  }, [vehicle])

  // Build suggestions
  const suggestions = (() => {
    if (!vehicle || !Array.isArray(allVehicles)) return []
    const normalize = (v: any) => String(v ?? "").trim().toLowerCase()
    const currentMake = normalize(vehicle.make ?? "")
    const currentModel = normalize(vehicle.model ?? "")

    const currentIds = new Set<string>()
    const pushId = (v: any) => {
      if (v !== undefined && v !== null && String(v) !== "") currentIds.add(String(v))
    }
    pushId(vehicle.id)
    pushId(vehicle.vehicle_id)
    pushId(vehicle._id)

    const filtered = allVehicles.filter((v: any) => {
      try {
        const candidates = [v?.id, v?.vehicle_id, v?._id].filter(Boolean).map(String)
        for (const c of candidates) if (currentIds.has(c)) return false
        return true
      } catch { return true }
    })

    const sameMakeModel = filtered.filter((v: any) => {
      const vMake = normalize(v.make)
      const vModel = normalize(v.model)
      return vMake && vModel && vMake === currentMake && vModel === currentModel
    })
    if (sameMakeModel.length) return sameMakeModel.slice(0, 8)

    const sameMake = filtered.filter((v: any) => {
      const vMake = normalize(v.make)
      return vMake && vMake === currentMake
    })
    return sameMake.slice(0, 8)
  })()

  // Handle contact us button
  const handleContactUs = () => {
    setShowContactModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-full max-w-4xl p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-72 bg-[#ececec] rounded-3xl" />
            <div className="h-6 w-2/3 bg-[#ececec] rounded" />
            <div className="h-4 w-1/3 bg-[#ececec] rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center pt-20 pb-40 px-4">
        <h1 className="text-3xl font-bold text-[#103090] font-serif mb-4">Vehicle Not Found</h1>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          The vehicle you are looking for may have been removed or does not exist.
        </p>
        <Button onClick={() => window.history.back()} variant="outline">
          Go Back
        </Button>
      </div>
    )
  }

  // Define data for UnifiedCarLayout

  const rawPhotos = vehicle.photos ?? (vehicle.image ? [vehicle.image] : ["/placeholder.svg"])
  const photos = rawPhotos.map((url: string, i: number) => ({ id: i, url: formatImageSrc(url) }))

  const seller = vehicle.seller ?? vehicle.owner ?? vehicle.user ?? {}
  const sellerData: SellerData = {
    name: seller?.name ?? seller?.username ?? seller?.first_name ?? "Seller",
    avatar: seller?.avatar ?? seller?.profile_picture ?? "/placeholder.svg",
    id: seller?.id ?? seller?.userId
  }

  const carData: CarData = {
    id: vehicle.id,
    make: vehicle.make ?? "—",
    model: vehicle.model ?? vehicle.title ?? "Vehicle",
    year: vehicle.year ?? "—",
    price: vehicle.price,
    mileage: vehicle.mileage ?? "—",
    transmission: vehicle.transmission ?? "—",
    fuel_type: vehicle.fuel_type ?? "—",
    condition: vehicle.vehicle_condition ?? "—",
    location: vehicle.location ?? vehicle.city ?? "—",
    description: vehicle.description ?? "No description available.",
    engine_size: vehicle?.engine_size !== "—" ? vehicle?.engine_size : undefined,
    doors: vehicle?.doors,
    exterior_color: vehicle?.exterior_color,
    interior_color: vehicle?.interior_color,
    is_original_paint: vehicle?.is_original_paint,
    special_features: vehicle?.special_features,
    photos
  }


  const isOwner = Boolean(currentUserId && vehicle?.user_id && Number(currentUserId) === Number(vehicle.user_id))

  const actionsContent = (() => {
    if (isOwner) {
      return (
        <div className="w-full space-y-3">
          <div className="p-5 bg-gray-50 rounded-2xl text-center border border-gray-200">
            <p className="text-gray-900 font-medium mb-1 font-serif text-lg">{t("listings.your_listing") || "Your Listing"}</p>
            <p className="text-gray-500 text-sm mb-4">{t("listings.this_is_yours") || "You are viewing your own listing."}</p>
            <Link
              href={`/${language}/profile?tab=listings`}
              className="inline-flex items-center justify-center w-full px-4 py-3 bg-white border border-gray-200 shadow-sm text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:text-[#B8071C] hover:border-[#B8071C]/30 transition-all"
            >
              {t("nav.my_listings") || "Manage Listings"}
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-3 relative">
        <div className="relative w-full">
          {bubbleOpen && (
            <div ref={bubbleRef} className="absolute bottom-full left-0 right-0 mb-2 p-4 bg-white shadow-xl rounded-xl border border-gray-100 z-50 text-center">
              <p className="text-base font-medium mb-3 text-gray-700">{bubbleText}</p>
              {bubbleType === "signin" && (
                <Link href={`/${language}/auth/login`} className="inline-flex items-center gap-2 bg-[#B8071C] text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-[#910515] transition-colors">
                  {t("auth.login.submit")}
                </Link>
              )}
              {bubbleType === "confirm" && (
                <div className="flex gap-2 justify-center mt-2">
                  <button onClick={confirmIsRemove ? confirmRemove : confirmAdd} className="px-4 py-2 bg-[#B8071C] text-white text-sm font-medium rounded-lg">
                    {confirmIsRemove ? t("common.remove") : t("common.add")}
                  </button>
                  <button onClick={cancelAdd} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">{t("common.cancel")}</button>
                </div>
              )}
            </div>
          )}

          <Button
            type="button"
            onClick={handleAddToWatchlist}
            aria-pressed={saved}
            aria-busy={saving}
            disabled={saving}
            className={`w-full rounded-full font-medium py-4 text-base transition-all flex items-center justify-center gap-2 mb-3 ${stableSaved
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-[#f8f8f8]"
              } ${transitionsDisabled ? "watchlist-btn--no-transition" : ""}`}
          >
            {stableSaved ? (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" role="img" aria-hidden>
                  <path d="M20.8 6.6a5.1 5.1 0 0 0-7.2 0L12 8.2l-1.6-1.6a5.1 5.1 0 1 0-7.2 7.2L12 22l8.8-8.8a5.1 5.1 0 0 0 0-7.6z" />
                </svg>
                <span>{t("watchlist.saved")}</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none stroke-2" role="img" aria-hidden>
                  <path d="M20.8 6.6a5.1 5.1 0 0 0-7.2 0L12 8.2l-1.6-1.6a5.1 5.1 0 1 0-7.2 7.2L12 22l8.8-8.8a5.1 5.1 0 0 0 0-7.6z" />
                </svg>
                <span>{t("watchlist.add")}</span>
              </>
            )}
          </Button>
        </div>

        <Button
          className="w-full bg-[#B8071C] hover:bg-[#910515] text-white rounded-full font-medium py-4 text-base transition-all flex items-center justify-center gap-2 shadow-md"
          type="button"
          onClick={handleContactUs}
        >
          <Phone className="w-5 h-5" />
          {t("common.contact_us")}
        </Button>
      </div>
    )
  })()

  const suggestionsContent = suggestions.length > 0 ? (
    <>
      <h2 className="text-2xl font-bold text-[#103090] font-serif mb-6">{t("listings.similar_vehicles" as any) || "Similar Vehicles"}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {(suggestions || []).slice(0, 8).map((s: any) => {
          const key = s?.id ?? s?.vehicle_id ?? JSON.stringify(s)
          return <DirectSaleCard key={String(key)} item={s} linkPrefix="/direct-sales" />
        })}
      </div>
    </>
  ) : null

  return (
    <>
      <UnifiedCarLayout
        car={carData}
        seller={sellerData}
        action={actionsContent}
        extraContent={suggestionsContent}
      >
        {carData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Car",
                "name": `${carData.make} ${carData.model}`,
                "image": carData.photos[0]?.url,
                "description": carData.description,
                "brand": {
                  "@type": "Brand",
                  "name": carData.make
                },
                "model": carData.model,
                "productionDate": carData.year,
                "vehicleModelDate": carData.year,
                "offers": {
                  "@type": "Offer",
                  "price": carData.price,
                  "priceCurrency": "MAD",
                  "availability": "https://schema.org/InStock",
                  "url": typeof window !== "undefined" ? window.location.href : ""
                }
              })
            }}
          />
        )}
      </UnifiedCarLayout>

      <ContactUsModal
        open={showContactModal}
        onClose={() => setShowContactModal(false)}
        directSaleId={Number(id)}
        listingTitle={`${carData.make} ${carData.model}`}
        listingPrice={carData.price}
      />
    </>
  )
}
