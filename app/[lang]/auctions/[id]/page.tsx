"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Countdown from "@/components/Countdown"
import BoxedCountdown from "@/components/boxed-countdown"
import AuctionCard from "@/components/auction-card"
import { useTranslation } from "@/lib/i18n-context"
import UnifiedCarLayout, { CarData, SellerData } from "@/components/unified-car-layout"

export default function AuctionBidPage() {
  const { t, language } = useTranslation()
  const { id } = useParams()
  const [auction, setAuction] = useState<any>(null)
  const [loadingAuction, setLoadingAuction] = useState(true)

  // -------- Watchlist Logic --------
  const auctionId = id
  const cachedKey = auctionId ? `watchlist_cached:${String(auctionId)}` : null
  const [saved, setSaved] = useState<boolean>(false)
  const [stableSaved, setStableSaved] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [watchlistCount, setWatchlistCount] = useState<number>(0)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  // UI bubble state
  const [bubbleOpen, setBubbleOpen] = useState<boolean>(false)
  const [bubbleType, setBubbleType] = useState<"signin" | "confirm" | "success" | "error" | null>(null)
  const [bubbleText, setBubbleText] = useState<string | null>(null)
  const [confirmIsRemove, setConfirmIsRemove] = useState<boolean>(false)
  const bubbleRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Initial saved state from cache
    try {
      if (typeof window !== "undefined" && cachedKey) {
        const cv = localStorage.getItem(cachedKey)
        if (cv === "1") { setSaved(true); setStableSaved(true) }
      }
    } catch { }
  }, [cachedKey])

  useEffect(() => {
    const timer = setTimeout(() => setStableSaved(saved), 200)
    return () => clearTimeout(timer)
  }, [saved])

  const showBubble = (type: typeof bubbleType, text?: string) => {
    setBubbleType(type)
    setBubbleText(text ?? null)
    setBubbleOpen(true)
    // Auto-hide for success, error, and signin bubbles
    if (type === "success" || type === "error" || type === "signin") {
      setTimeout(() => { setBubbleOpen(false) }, 4000)
    }
  }

  const hideBubble = () => { setBubbleOpen(false) }

  // Click outside to close bubble
  useEffect(() => {
    if (!bubbleOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (bubbleRef.current && !bubbleRef.current.contains(target)) {
        hideBubble()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [bubbleOpen])

  // Auth & Watchlist Check
  useEffect(() => {
    if (!auctionId) return
    let mounted = true
      ; (async () => {
        try {
          const r = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" }).catch(() => null)
          if (!mounted) return
          if (!r || !r.ok) { setCurrentUserId(null); return }
          const j = await r.json().catch(() => ({}))
          const uid = (j?.user?.id ?? j?.user?.userId ?? j?.userId) ?? null
          if (uid) {
            setCurrentUserId(Number(uid))
            // Check watchlist
            const check = await fetch(`/api/direct-sales-watchlist/check?direct_sale_id=${encodeURIComponent(String(auctionId))}`, { credentials: "include" }).catch(() => null)
            if (check && check.ok) {
              const cj = await check.json()
              setSaved(!!cj.saved)
            }
          }
        } catch { }
      })()
    return () => { mounted = false }
  }, [auctionId])

  const handleAddToWatchlist = async () => {
    if (!currentUserId) {
      showBubble("signin", t("watchlist.signin_required"))
      return
    }
    if (saved) {
      setConfirmIsRemove(true)
      showBubble("confirm", t("watchlist.remove_confirm"))
    } else {
      setConfirmIsRemove(false)
      showBubble("confirm", t("watchlist.add_confirm"))
    }
  }

  const confirmAction = async () => {
    hideBubble()
    if (saving || !auctionId) return
    setSaving(true)
    try {
      const endpoint = confirmIsRemove ? "/api/direct-sales-watchlist/remove" : "/api/direct-sales-watchlist/add"
      const localToken = localStorage.getItem("auth_token")
      const headers: any = { "Content-Type": "application/json" }
      if (localToken) headers["Authorization"] = `Bearer ${localToken}`

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ direct_sale_id: Number(auctionId) })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && (data.success || data.alreadyExists || data.removed)) {
        setSaved(!confirmIsRemove)
        setWatchlistCount(p => confirmIsRemove ? Math.max(0, p - 1) : p + 1)
        // Build vehicle label for message
        const vehicleLabel = auction ? `${auction.make ?? auction.vehicle?.make ?? ""} ${auction.model ?? auction.vehicle?.model ?? ""}`.trim() : ""
        const successMsg = confirmIsRemove
          ? t("watchlist.success_remove").replace("{model}", vehicleLabel)
          : t("watchlist.success_add").replace("{model}", vehicleLabel)
        showBubble("success", successMsg)
        try {
          if (cachedKey) localStorage.setItem(cachedKey, confirmIsRemove ? "0" : "1")
        } catch { }
      } else {
        showBubble("error", data.error || "Failed")
      }
    } catch {
      showBubble("error", "Network Error")
    } finally {
      setSaving(false)
    }
  }

  // Load Auction
  useEffect(() => {
    if (!id) return
    const ac = new AbortController()
    setLoadingAuction(true)
      ; (async () => {
        try {
          const res = await fetch(`/api/auctions/${id}`, { signal: ac.signal })
          if (!res.ok) throw new Error("Failed")
          const data = await res.json()
          const merged = { ...(data.auction ?? data), vehicle: data.vehicle ?? data.auction?.vehicle, seller: data.seller ?? data.auction?.seller }
          setAuction(merged)
        } catch {
          setAuction(null)
        } finally {
          if (!ac.signal.aborted) setLoadingAuction(false)
        }
      })()
    return () => ac.abort()
  }, [id])

  // Content for Layout
  const photos = (auction?.photos ?? auction?.vehicle?.photos ?? (auction?.image ? [auction.image] : [])).map((url: string, i: number) => ({ id: i, url }))

  // Price logic
  const _priceCandidates = [
    auction?.current_bid,
    auction?.starting_price,
    auction?.price,
    auction?.vehicle?.price,
    auction?.startingPrice
  ]
  const displayPrice = _priceCandidates.find(p => p !== undefined && p !== null && p !== "") ?? 0

  const carData: CarData | null = auction ? {
    id: auction.id,
    make: auction.make ?? auction.vehicle?.make ?? "—",
    model: auction.model ?? auction.vehicle?.model ?? "—",
    year: auction.year ?? auction.vehicle?.year ?? "—",
    price: displayPrice,
    mileage: auction.mileage ?? auction.vehicle?.mileage ?? "—",
    transmission: auction.transmission ?? auction.vehicle?.transmission ?? "—",
    fuel_type: auction.fuel_type ?? auction.vehicle?.fuel_type ?? "—",
    condition: auction.vehicle_condition ?? auction.vehicle?.vehicle_condition ?? "—",
    location: auction.location ?? auction.vehicle?.location ?? auction.city ?? "—",
    description: auction.description ?? auction.vehicle?.description ?? t("auction.detail.no_description"),
    engine_size: auction.engine_size ?? auction.vehicle?.engine_size,
    doors: auction.doors ?? auction.vehicle?.doors,
    exterior_color: auction.exterior_color ?? auction.vehicle?.exterior_color,
    interior_color: auction.interior_color ?? auction.vehicle?.interior_color,
    is_original_paint: auction.is_original_paint ?? auction.vehicle?.is_original_paint,
    special_features: auction.special_features ?? auction.vehicle?.special_features,
    photos: photos.length ? photos : [{ id: 0, url: "/placeholder.svg" }]
  } : null

  const sellerData: SellerData | undefined = auction?.seller ? {
    name: auction.seller.name ?? auction.seller.username ?? "Seller",
    avatar: auction.seller.avatar ?? auction.seller.profile_picture ?? "/placeholder.svg"
  } : undefined

  // End Date for countdown
  const endIso = auction?.end_date ?? auction?.auction_end_date ?? null

  // Suggestions logic
  const [suggestions, setSuggestions] = useState<any[]>([])
  useEffect(() => {
    if (!auction) return
    fetch("/api/auctions/approved").then(r => r.json()).then(d => {
      const list = d.vehicles || d.auctions || []
      setSuggestions(list.filter((x: any) => String(x.id) !== String(id)).slice(0, 4))
    }).catch(() => { })
  }, [auction, id])

  const ActionButtons = () => (
    <div className="space-y-3">
      <Button className="w-full bg-[#B8071C] hover:bg-[#910515] text-white rounded-full font-bold font-serif text-base py-3 px-4 shadow-md transition-all">
        {t("auction.detail.place_bid")}
      </Button>

      <div className="relative">
        {bubbleOpen && (
          <div ref={bubbleRef} className="absolute bottom-full left-0 right-0 mb-2 p-4 bg-white shadow-xl rounded-xl border border-gray-100 z-50 text-center">
            <p className="text-base font-medium mb-3 text-gray-700">{bubbleText}</p>
            {bubbleType === "signin" && (
              <Link href={`/${language}/auth/login`} className="inline-flex items-center gap-2 bg-[#B8071C] text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-[#910515] transition-colors">
                {t("auth.login.submit")}
              </Link>
            )}
            {bubbleType === "confirm" && (
              <div className="flex gap-2 justify-center">
                <button onClick={confirmAction} className="bg-[#B8071C] text-white px-4 py-2 rounded-lg text-sm font-medium">{confirmIsRemove ? t("common.remove") : t("common.add")}</button>
                <button onClick={() => setBubbleOpen(false)} className="bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium">{t("common.cancel")}</button>
              </div>
            )}
          </div>
        )}
        <Button
          onClick={handleAddToWatchlist}
          className={`w-full border-2 rounded-full font-bold font-serif py-3 transition-colors ${stableSaved ? "bg-[#B8071C]/10 border-[#B8071C] text-[#B8071C]" : "bg-white border-[#B8071C] text-[#B8071C] hover:bg-[#B8071C]/10"}`}
        >
          {stableSaved ? t("watchlist.saved") : t("watchlist.add")}
        </Button>
      </div>
    </div>
  )

  const Suggestions = () => (
    <>
      <h2 className="text-2xl font-bold text-[#103090] font-serif mb-6">{t("auction.detail.suggested_auctions")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {suggestions.map((s) => (
          <AuctionCard key={s.id} data={s} initialIsWatched={s.is_watched} />
        ))}
      </div>
    </>
  )

  if (!auction && !loadingAuction) return <div className="p-10 text-center">Not Found</div>

  return (
    <UnifiedCarLayout
      car={carData!}
      seller={sellerData}
      isLoading={loadingAuction}
      action={<ActionButtons />}
      imageOverlay={null}
      galleryFooter={endIso ? <BoxedCountdown endDate={endIso} fullWidth={true} /> : null}
      extraContent={suggestions.length > 0 ? <Suggestions /> : null}
    />
  )
}
