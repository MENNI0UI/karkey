"use client"

import React, { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { X, LayoutGrid, StretchHorizontal } from "lucide-react"
import dynamic from "next/dynamic"
import AuctionCard from "@/components/auction-card"
import { CarCardSkeleton, CarGridSkeleton } from "@/components/ui/car-card-skeleton"
import { LuxuryLoader } from "@/components/ui/luxury-loader"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter as useNextRouter, useSearchParams } from "next/navigation"
import { useTranslation } from "@/lib/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { EmptyListingState, LoadMoreButton } from "@/components/listing-components"
import { AuctionFiltersSidebar, AuctionFiltersSidebarRef, FilterOptions } from "@/components/auction-filters-sidebar"

// Removed dynamic import for Sidebar to ensure ref works reliably
// const AuctionFiltersSidebar = dynamic(...)

const NewItemsNotifier = dynamic(() => import("@/components/NewItemsNotifier"), { ssr: false })
const UpcomingAuctionsPlaceholder = dynamic(() => import("@/components/upcoming-auction-placeholder"), { ssr: false })
const DraggableFilterButton = dynamic(() => import("@/components/DraggableFilterButton").then(mod => mod.DraggableFilterButton), { ssr: false })

// --- module-level in-memory cache so client navigations reuse results instantly ---
const _auctionsMemoryCache: { items: any[]; timestamp: number } | null = null

// Shared helper to detect if any filters are active in the URL
const hasActiveFilters = (params: URLSearchParams | null) => {
  if (!params) return false
  const keys = [
    "make", "model", "year", "fuel", "fuelType", "transmission", "location",
    "minPrice", "maxPrice", "minMileage", "maxMileage", "minEngine", "maxEngine",
    "condition", "doors", "exteriorColor", "interiorColor", "originalPaint", "q"
  ]
  return keys.some(k => Boolean(params.get(k)))
}

export default function AuctionsPageClient({
  initialVehicles = [],
  filterOptions,
  initialSavedState
}: {
  initialVehicles?: any[];
  filterOptions?: FilterOptions;
  initialSavedState?: { isMatch: boolean; savedId: number | null; paramsStr: string | null }
}) {
  const { t, language } = useTranslation()
  const { toast } = useToast()
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)
  const router = useNextRouter()
  const searchParams = useSearchParams()
  const filtersRef = useRef<AuctionFiltersSidebarRef>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window === 'undefined') return 'grid'
    const saved = localStorage.getItem('karkey_view_mode') as 'grid' | 'list'
    if (saved && (saved === 'grid' || saved === 'list')) {
      if (window.innerWidth >= 768 || saved === 'grid') return saved
    }
    return 'grid'
  })

  // Wrapped setter to handle persistence
  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('karkey_view_mode', mode)
  }

  // Enforce grid mode on small screens even if state is set to list
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode === 'list') {
        setViewMode('grid')
      }
    }
    handleResize() // Run on mount
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [viewMode])

  const handleCloseFilters = () => {
    filtersRef.current?.applyFilters()
    setShowFiltersMobile(false)
  }

  // Close mobile filters when URL changes (Apply clicked)
  useEffect(() => {
    setShowFiltersMobile(false)
  }, [searchParams])

  const [globalFilters, setGlobalFilters] = useState<{ make: string; model: string; year: string | number }[]>([])
  // determine a lightweight endpoint to poll for newest auction when no filters
  const paramString = searchParams ? searchParams.toString() : ""
  const fetchUrl = paramString ? `/api/search?${paramString}&limit=1` : `/api/auctions/approved?limit=1`
  // initialize auth/verification synchronously from local cache so UI shows immediately
  // Only trust `me_cached` (server-provided user/profile snapshot) as a fast-path.
  const [isAuth, setIsAuth] = useState<boolean>(() => {
    try {
      const meRaw = typeof window !== "undefined" ? localStorage.getItem("me_cached") : null
      if (meRaw) {
        const parsed = JSON.parse(meRaw)
        if (parsed?.user) return true
      }
    } catch { }
    return false
  })
  const [isVerified, setIsVerified] = useState<boolean>(() => {
    try {
      const meRaw = typeof window !== "undefined" ? localStorage.getItem("me_cached") : null
      if (meRaw) {
        const parsed = JSON.parse(meRaw)
        const ver = (parsed?.profile?.verification_status ?? parsed?.profile?.verification?.status ?? "").toString().toLowerCase()
        return ver === "approved"
      }
    } catch { }
    return false
  })
  // Keep the raw verification status string for contextual messaging (pending/rejected)
  const [verificationStatus, setVerificationStatus] = useState<string | null>(() => {
    try {
      const meRaw = typeof window !== "undefined" ? localStorage.getItem("me_cached") : null
      if (meRaw) {
        const parsed = JSON.parse(meRaw)
        const ver = (parsed?.profile?.verification_status ?? parsed?.profile?.verification?.status ?? "").toString().toLowerCase()
        return ver || null
      }
    } catch { }
    return null
  })
  // NOTE: All auction fetching & filtering now happens solely inside AuctionsGridClient.

  // check authentication + verification once (client-side) so we can show Add button only for approved users
  useEffect(() => {
    // react to storage/auth events so UI updates immediately when login/logout happens
    function onStorage(e: StorageEvent) {
      try {
        if (!e.key) return
        if (e.key === "me_cached") {
          // me_cached changed -> update immediate UI (do not treat auth_token alone as auth)
          try {
            const meRaw = localStorage.getItem("me_cached")
            if (meRaw) {
              const parsed = JSON.parse(meRaw)
              setIsAuth(Boolean(parsed?.user))
              const ver = (parsed?.profile?.verification_status ?? parsed?.profile?.verification?.status ?? "").toString().toLowerCase()
              setIsVerified(ver === "approved")
              return
            }
          } catch { }
          // no me_cached -> unauthenticated
          setIsAuth(false)
          setIsVerified(false)
        }
      } catch { }
    }
    // keep onAuthChanged handling (receives structured events from login/logout flows)
    function onAuthChanged(e: Event) {
      try {
        const d = (e as CustomEvent)?.detail ?? {}
        if (d?.action === "login") {
          // optional payload may include profile
          if (d?.profile) {
            const ver = (d.profile?.verification_status ?? d.profile?.verification?.status ?? "").toString().toLowerCase()
            setIsVerified(ver === "approved")
          }
          setIsAuth(true)
        } else if (d?.action === "logout") {
          setIsAuth(false)
          setIsVerified(false)
        }
      } catch { }
    }
    window.addEventListener("storage", onStorage)
    window.addEventListener("auth:changed", onAuthChanged as EventListener)

    // BACKGROUND: authoritative check to correct/confirm the cached value
    let mounted = true
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
        if (!mounted) return
        const j = await res.json().catch(() => ({}))
        if (res.ok && j?.success) {
          setIsAuth(true)
          const ver = (j.profile?.verification_status ?? j.profile?.verification?.status ?? "").toString().toLowerCase()
          setIsVerified(ver === "approved")
          setVerificationStatus(ver || null)
          // persist a light cache so next navigation is instant
          try { localStorage.setItem("me_cached", JSON.stringify({ user: j.user ?? null, profile: j.profile ?? null })) } catch { }
        } else {
          setIsAuth(false)
          setIsVerified(false)
          setVerificationStatus(null)
          try { localStorage.removeItem("me_cached") } catch { }
        }
      } catch {
        if (mounted) { setIsAuth(false); setIsVerified(false) }
      }
    })()
    return () => {
      mounted = false
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("auth:changed", onAuthChanged as EventListener)
    }
  }, [])

  // If middleware redirected with a blocked reason (e.g. ?blocked_reason=unverified),
  // show the concise message and remove the query param so it doesn't persist.
  useEffect(() => {
    try {
      const reason = searchParams?.get("blocked_reason") || searchParams?.get("blocked")
      if (!reason) return
      // Always show the unified message regardless of specific blocked reason
      toast({
        title: t("common.error"),
        description: t("error.unverified_auction"),
        variant: "error",
      })
      // remove the query param without navigating
      try {
        const url = new URL(window.location.href)
        url.searchParams.delete("blocked_reason")
        url.searchParams.delete("blocked")
        window.history.replaceState({}, "", url.toString())
      } catch { }
    } catch { }
  }, [searchParams, t, toast])

  const handleAddAuction = async () => {
    // Always perform an authoritative server-side check before allowing auction creation.
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      const j = await r.json().catch(() => ({}))
      // If server doesn't confirm an authenticated session, send to login
      if (!(r.ok && j?.success)) { router.push(`/${language}/auth/login`); return }
      const ver = (j.profile?.verification_status ?? j.profile?.verification?.status ?? "").toString().toLowerCase()
      // update local status
      setIsVerified(ver === "approved")
      setVerificationStatus(ver || null)
      if (ver !== "approved") {
        // authenticated but not approved -> show a short contextual message under the button (English)
        // Use unified message for all non-approved statuses
        toast({
          title: t("common.error"),
          description: t("error.unverified_auction"),
          variant: "error",
        })
        // do not navigate; leave the user on the page and show the message
        return
      }
      // verified -> go to creation page
      router.push(`/${language}/direct-sales/create`)
    } catch (err) {
      // network or unexpected error -> fallback to login
      router.push(`/${language}/auth/login`)
    }
  }

  // Listen for global header filter-open events (dispatched by Header) on mobile
  useEffect(() => {
    function onOpenFilters() { try { setShowFiltersMobile(true) } catch { } }
    window.addEventListener('open:filters', onOpenFilters as EventListener)
    return () => window.removeEventListener('open:filters', onOpenFilters as EventListener)
  }, [])

  // Helpers
  const getStartingPrice = (item: any): string => {
    if (!item) return "Contact for price"
    const candidates = [
      item.starting_price,
      item.startingPrice,
      item?.auction?.starting_price,
      item?.auction?.startingPrice,
      item?.auction?.current_bid,
      item?.vehicle?.starting_price,
      item?.vehicle?.startingPrice,
      item.price,
      item.current_bid,
      item?.vehicle?.price,
    ]
    for (const c of candidates) {
      if (c === undefined || c === null || c === "") continue
      const n = typeof c === "number" ? c : parseFloat(String(c).replace(/[^\d.,-]/g, "").replace(",", "."))
      if (!isNaN(n) && isFinite(n)) return String(n)
    }
    return "Contact for price"
  }

  const formatMAD = (value: string) => {
    if (!value || value === "Contact for price") return "Contact for price"
    const num = parseFloat(String(value).replace(/[^\d.-]/g, ""))
    if (isNaN(num)) return "—"
    return new Intl.NumberFormat(language === "ar" ? "ar-MA" : "fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(num)
  }

  const getNumericField = (obj: any, candidates: string[]) => {
    for (const k of candidates) {
      const parts = k.split(".")
      let cur = obj
      for (const p of parts) {
        if (cur == null) break
        cur = cur[p]
      }
      if (cur === undefined || cur === null || cur === "") continue
      if (typeof cur === "number") return cur
      if (typeof cur === "string") {
        const cleaned = cur.replace(",", ".").replace(/[^0-9.\-]/g, "")
        const n = Number(cleaned)
        if (!Number.isNaN(n)) return n
      }
    }
    return null
  }

  const normalize = (item: any) => {
    const id = item?.id ?? item?.auction_id ?? item?.vehicle_id ?? item?.vehicle?.id ?? Math.random()
    const photos = item?.photos ?? item?.vehicle?.photos ?? (item?.image ? [item.image] : [])
    const seller = item?.seller ?? item?.user ?? {}
    const sellerName = seller?.name ?? seller?.username ?? "Seller"
    const sellerAvatar = seller?.avatar ?? seller?.profile_picture ?? null
    const model = item?.model ?? item?.vehicle?.model ?? item?.title ?? "Vehicle"
    const location = item?.location ?? item?.vehicle?.location ?? item?.city ?? "—"
    const make = item?.make ?? item?.vehicle?.make ?? ""
    const rawPrice = getStartingPrice(item) || getStartingPrice(item?.vehicle) || getStartingPrice(item?.auction)
    const displayPrice = formatMAD(rawPrice)
    const mileage = item?.mileage ?? item?.vehicle?.mileage ?? "—"
    const transmission = item?.transmission ?? item?.vehicle?.transmission ?? "—"
    const fuelType = item?.fuel_type ?? item?.vehicle?.fuel_type ?? item?.fuelType ?? item?.fuel ?? "—"
    const condition = item?.vehicle_condition ?? item?.vehicle?.vehicle_condition ?? "—"
    const engine_size = getNumericField(item, [
      "engine_size",
      "engineSize",
      "vehicle.engine_size",
      "vehicle.engineSize",
      "auction.vehicle.engine_size",
      "auction.vehicle.engineSize",
      "attributes.engine_size",
    ])
    const doors = getNumericField(item, [
      "doors",
      "num_doors",
      "number_of_doors",
      "vehicle.doors",
      "auction.vehicle.doors",
      "attributes.doors",
    ])
    // ensure we include auction end date and numeric starting price for the shared card
    const end_date = item.end_date ?? item.auction_end_date ?? item?.auction?.end_date ?? item?.endDate ?? null
    const startingPriceNum = (() => {
      const p = getStartingPrice(item) || getStartingPrice(item?.vehicle) || getStartingPrice(item?.auction)
      const n = Number(String(p).replace(/[^\d.-]/g, ""))
      return Number.isFinite(n) ? n : null
    })()
    return {
      id,
      photos,
      seller: { name: sellerName, avatar: sellerAvatar },
      model,
      location,
      make,
      displayPrice,
      starting_price: startingPriceNum,
      mileage,
      transmission,
      fuel_type: fuelType,
      fuelType,
      // expose both legacy `condition` and the expected `vehicle_condition`
      condition,
      vehicle_condition: condition,
      engine_size,
      doors,
      end_date,
    }
  }



  // Fetch global filter data for dependent make/model/year logic
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch("/api/auctions/filters", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          if (data.success && Array.isArray(data.filters)) {
            setGlobalFilters(data.filters)
          }
        }
      } catch { }
    }
    fetchFilters()
  }, [])

  // Derive dynamic options locally (overriding/augmenting props)
  const dynamicFilterOptions = React.useMemo(() => {
    const baseOptions = filterOptions || {}
    if (globalFilters.length === 0) return baseOptions

    // helper: dedupe 
    const collectMap = (items: any[], extractor: (it: any) => string | undefined, filter?: (it: any) => boolean) => {
      const map = new Map<string, string>()
      for (const it of items || []) {
        try {
          if (filter && !filter(it)) continue
          const raw = extractor(it)
          if (!raw) continue
          const v = String(raw).trim()
          if (!v) continue
          const key = v.toLowerCase()
          if (!map.has(key)) map.set(key, v)
        } catch { }
      }
      return Array.from(map.values()).sort()
    }

    const selectedMakes = (searchParams?.getAll("make") ?? []).map(m => m.trim().toLowerCase()).filter(Boolean)
    const selectedModels = (searchParams?.getAll("model") ?? []).map(m => m.trim().toLowerCase()).filter(Boolean)
    const selectedYears = (searchParams?.getAll("year") ?? []).map(y => String(y).trim()).filter(Boolean)

    const makesArr = collectMap(globalFilters, (it) => it?.make, (it) => {
      if (selectedYears.length > 0 && !selectedYears.includes(String(it.year))) return false
      return true
    })

    const makeMap = new Map<string, Set<string>>()
    for (const it of globalFilters || []) {
      try {
        if (selectedYears.length > 0 && !selectedYears.includes(String(it.year))) continue
        const mk = String(it?.make ?? "").trim()
        const md = String(it?.model ?? "").trim()
        if (!mk || !md) continue
        const key = mk.toLowerCase()
        if (!makeMap.has(key)) makeMap.set(key, new Set())
        makeMap.get(key)!.add(md)
      } catch { }
    }
    const makeModelsObj: Record<string, string[]> = {}
    for (const [k, s] of makeMap.entries()) makeModelsObj[k] = Array.from(s).sort()

    const modelsArr = collectMap(globalFilters, (it) => it?.model, (it) => {
      const mm = String(it.make || "").toLowerCase()
      if (selectedMakes.length > 0 && !selectedMakes.includes(mm)) return false
      if (selectedYears.length > 0 && !selectedYears.includes(String(it.year))) return false
      return true
    })

    const yearsArr = collectMap(globalFilters, (it) => it?.year ?? String(it?.year ?? ""), (it) => {
      if (selectedMakes.length > 0 && !selectedMakes.includes(String(it.make).toLowerCase())) return false
      if (selectedModels.length > 0 && !selectedModels.includes(String(it.model).toLowerCase())) return false
      return true
    })

    return {
      ...baseOptions,
      makes: makesArr,
      models: modelsArr,
      modelsByMake: makeModelsObj, // pass this explicit map for sidebar to use
      years: yearsArr,
    }
  }, [filterOptions, globalFilters, searchParams?.toString()])

  // Determine if we should show the placeholder (no vehicles + no filters)
  // Initialize based on server props to prevent layout shift
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(() => {
    // If we have vehicles, definitely not placeholder
    if (initialVehicles && initialVehicles.length > 0) return false;
    // If we haven't loaded yet (undefined), assume false (show sidebar/skeletons) until we know
    if (!initialVehicles) return false;

    // We have empty vehicles array. Check if we have active filters.
    const hasFilters = hasActiveFilters(searchParams);
    return !hasFilters;
  });

  return (
    <div className={`min-h-screen flex flex-col ${isPlaceholderVisible ? 'bg-white' : 'bg-[#f8fafc]'}`}>
      <div className="w-full lg:px-0 lg:flex items-start flex-1">

        {/* Sidebar Filters (Desktop) - Only show if NOT showing placeholder */}
        {!isPlaceholderVisible && (
          <AuctionFiltersSidebar
            ref={filtersRef}
            options={dynamicFilterOptions}
            className="flex-shrink-0"
            initialSavedState={initialSavedState}
          />
        )}

        <div className={`flex-1 w-full min-w-0 px-4 pt-4 ${isPlaceholderVisible ? 'max-w-7xl mx-auto' : 'lg:px-6 xl:px-8'}`}>
          <AuctionsGridClient
            initialVehiclesFromServer={initialVehicles}
            onPlaceholderVisibilityChange={setIsPlaceholderVisible}
            viewMode={viewMode}
            setViewMode={handleSetViewMode}
          />
          {/* sentinel placed after main content so sidebar can detect when footer is approaching */}
          <div id="filters-footer-sentinel" className="w-full h-px" aria-hidden="true" />
        </div>
      </div>
      {/* Mobile filter drawer - Only allow opening if not placeholder */}
      {showFiltersMobile && !isPlaceholderVisible ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseFilters} />
          {/* Bottom sheet: anchored at bottom and fills viewport */}
          <div className="absolute left-0 right-0 bottom-0 top-0 bg-white shadow-xl flex flex-col overflow-hidden transform transition-transform duration-200">
            {/* Floating close button (top-right) for clear exit action */}
            <button
              onClick={handleCloseFilters}
              aria-label="Close filters"
              title="Close filters"
              className="absolute right-4 top-2.5 z-50 inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#B8071C] text-white shadow-[0_4px_12px_rgba(184,7,28,0.3)] hover:bg-[#910515] active:scale-95 transition-all outline-none ring-2 ring-white/10"
            >
              <X size={22} strokeWidth={2.5} />
            </button>
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50/50">
              <div className="text-xl font-bold font-serif text-[#111827]">{t("auctions.filters")}</div>
              <div />
            </div>
            {/* Visible close action for accessibility: full-width button below header */}
            <div className="px-4 py-4 border-b bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <button
                type="button"
                onClick={handleCloseFilters}
                className="w-full inline-flex items-center justify-center bg-gradient-to-r from-[#B8071C] to-[#D31027] hover:from-[#910515] hover:to-[#B8071C] text-white rounded-xl h-14 text-lg font-bold shadow-[0_4px_15px_rgba(184,7,28,0.25)] active:scale-[0.98] transition-all"
              >
                {t("auctions.close")}
              </button>
            </div>
            <div className="p-0 flex-1 overflow-hidden">
              <AuctionFiltersSidebar
                ref={filtersRef}
                options={dynamicFilterOptions}
                mobile
                className="h-full"
                initialSavedState={initialSavedState}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Mobile / small screens: Draggable Filter control */}
      {!showFiltersMobile && !isPlaceholderVisible ? (
        <DraggableFilterButton
          onClick={() => {
            setShowFiltersMobile(true);
            try { window.dispatchEvent(new CustomEvent('open:filters')) } catch { }
          }}
        />
      ) : null}
    </div>
  )
}

// replace other icon references with this helper and use Image
function getAllowedIcon(name?: string) {
  switch ((name || "").toLowerCase()) {
    case "condition": return "/icons/condition.png"
    case "fuel": return "/icons/fuel.png"
    case "electric": return "/icons/electric-fuel.png"
    case "engine": return "/icons/engine.png"
    case "transmission": return "/icons/transmission.png"
    case "camera": return "/icons/camera.png"
    case "doors": return "/icons/car-door.png"
    case "mileage": return "/icons/mileage.png"
    default: return "/icons/condition.png"
  }
}

// Add the robust extractor helper near the top of the file (once)
function getField(obj: any, ...keys: string[]) {
  // robust extractor: check multiple variants (top-level, nested, snake/camel)
  for (const key of keys) {
    const parts = key.split(".")
    let cur: any = obj
    for (const p of parts) {
      if (cur == null) { cur = null; break }
      // tolerate snake_case / camelCase and direct property
      cur = cur[p] ?? cur[String(p)] ?? cur[p.replace(/_/g, "")] ?? cur[p.replace(/_/g, "-")]
    }
    if (cur !== undefined && cur !== null && cur !== "") return cur
  }
  return null
}

// New client component for fetching and displaying auctions (used by /auctions page)
export function AuctionsGridClient({
  initialVehiclesFromServer,
  onPlaceholderVisibilityChange,
  viewMode: controlledViewMode,
  setViewMode: controlledSetViewMode
}: {
  initialVehiclesFromServer?: any[];
  onPlaceholderVisibilityChange?: (visible: boolean) => void;
  viewMode?: 'grid' | 'list';
  setViewMode?: (mode: 'grid' | 'list') => void;
} = {}) {
  const [internalViewMode, setInternalViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window === 'undefined') return 'grid'
    const saved = localStorage.getItem('karkey_view_mode') as 'grid' | 'list'
    return (saved === 'grid' || saved === 'list') ? saved : 'grid'
  })
  const viewMode = controlledViewMode ?? internalViewMode

  // Custom setter that handles localStorage
  const setViewMode = (mode: 'grid' | 'list') => {
    if (controlledSetViewMode) {
      controlledSetViewMode(mode)
    } else {
      setInternalViewMode(mode)
    }
    localStorage.setItem('karkey_view_mode', mode)
  }

  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid'
    setViewMode(newMode)
  }

  // Load view mode preference on mount
  useEffect(() => {
    // We already initialize from localStorage in useState, but we keep this to sync
    // if there are multiple instances or external changes, while avoiding the initial flicker.
    const savedMode = localStorage.getItem('karkey_view_mode') as 'grid' | 'list'
    if (savedMode && (savedMode === 'grid' || savedMode === 'list')) {
      if (window.innerWidth >= 768 || savedMode === 'grid') {
        if (controlledSetViewMode) {
          controlledSetViewMode(savedMode)
        } else {
          setInternalViewMode(savedMode)
        }
      }
    }
  }, [controlledSetViewMode])

  // Enforce grid mode on small screens even if state is set to list
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode === 'list') {
        setViewMode('grid')
      }
    }
    handleResize() // Run on mount
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [viewMode])

  const { t, language } = useTranslation()
  const params = useSearchParams()
  const paramString = params ? params.toString() : ""
  const router = useNextRouter()
  const storageKey = `search_prefetch:v3:${paramString}`

  const initialFromStorage = (() => {
    try {
      if (typeof window === "undefined") return null
      const raw = sessionStorage.getItem(storageKey)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      // ignore stale cached prefetches: keep only recent entries so DB edits show quickly
      try {
        const ts = Number(parsed?.ts ?? parsed?.timestamp ?? null)
        const TTL = 60000 // 1 minute guard rail
        if (ts && Number.isFinite(ts) && Date.now() - ts > TTL) {
          try { sessionStorage.removeItem(storageKey) } catch { }
          return null
        }
      } catch { }

      // helper: try common shapes and also scan nested objects to find the first
      // array that looks like a list of auctions/vehicles.
      const tryExtract = (candidate: any): any[] | null => {
        if (!candidate) return null
        if (Array.isArray(candidate)) return candidate
        if (Array.isArray(candidate?.results)) return candidate.results
        if (Array.isArray(candidate?.vehicles)) return candidate.vehicles
        if (Array.isArray(candidate?.auctions)) return candidate.auctions
        // sometimes we store { ts, data } -> data may wrap the actual payload
        if (candidate?.data) return tryExtract(candidate.data)
        // scan first-level keys for an array value
        for (const k of Object.keys(candidate || {})) {
          try {
            const v = candidate[k]
            if (Array.isArray(v)) return v
          } catch { }
        }
        return null
      }

      const arr = tryExtract(parsed)
      if (arr && Array.isArray(arr)) {

        return arr
      }
      return null
    } catch (err) {

      return null
    }
  })()
  // prefer server-provided initial vehicles (fast first paint), then sessionStorage
  const initialFromServer = Array.isArray(initialVehiclesFromServer) && initialVehiclesFromServer.length ? initialVehiclesFromServer : null
  const PAGE_SIZE = 12
  const [vehicles, setVehicles] = useState<any[] | null>(initialFromServer ?? initialFromStorage) // null = not loaded yet
  const [loading, setLoading] = useState<boolean>(() => (initialFromServer ?? initialFromStorage) === null)
  const [page, setPage] = useState<number>(1) // for /api/search (1-based)
  const [offset, setOffset] = useState<number>((initialFromServer ?? initialFromStorage)?.length ?? 0) // for /api/auctions/approved (0-based)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const skipInitialRef = useRef(!!initialFromServer)

  useEffect(() => {
    let mounted = true

    const run = async () => {
      try {
        if (skipInitialRef.current) {
          skipInitialRef.current = false
          return
        }

        setLoading(true)

        // detect if we have active filters in the URL
        const hasFilters = hasActiveFilters(params)

        let res: Response
        if (hasFilters) {
          const search = new URLSearchParams()
          for (const key of [
            "make",
            "model",
            "year",
            "fuel",
            "fuelType",
            "transmission",
            "location",
            "minPrice",
            "maxPrice",
            "minMileage",
            "maxMileage",
            "minEngine",
            "maxEngine",
            "condition",
            "doors",
            "exteriorColor",
            "interiorColor",
            "originalPaint",
            "q",
          ]) {
            const vals = params.getAll(key)
            if (vals.length > 0) {
              vals.forEach(v => {
                if (v && v !== "All") search.append(key, v)
              })
            }
          }
          const qs = search.toString()
          // fetch first page when filters are present - ALWAYS include type=auction
          search.append('type', 'auction')
          res = await fetch(`/api/search?${search.toString()}&page=1&limit=${PAGE_SIZE}`, { cache: "no-store" })
        } else {
          // No URL filters: fall back to listing approved auctions
          res = await fetch(`/api/auctions/approved?limit=${PAGE_SIZE}&offset=0`, { cache: "no-store" })
        }

        if (!mounted) return
        if (!res.ok) {
          setVehicles([])
          return
        }
        const data = await res.json().catch(() => null)
        if (!mounted) return
        const list = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.vehicles)
            ? data.vehicles
            : Array.isArray(data?.auctions)
              ? data.auctions
              : []
        setVehicles(list)
        // determine hasMore: prefer explicit flag from search endpoint
        if (data && typeof data.hasMore === "boolean") setHasMore(Boolean(data.hasMore))
        else setHasMore(list.length >= PAGE_SIZE)
        // set pagination trackers
        setPage(1)
        setOffset(list.length)
      } catch (err) {
        if (!mounted) return
        setVehicles([])
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    void run()
    return () => {
      mounted = false
    }
  }, [params])

  // Sync state when initialVehiclesFromServer changes (e.g. after router.refresh() from NewItemsNotifier)
  useEffect(() => {
    if (initialVehiclesFromServer && initialVehiclesFromServer.length > 0) {
      setVehicles(initialVehiclesFromServer)
      setPage(1)
      setOffset(initialVehiclesFromServer.length)
      setHasMore(initialVehiclesFromServer.length >= PAGE_SIZE)
      setLoading(false)
    }
  }, [initialVehiclesFromServer])

  // Notify parent about placeholder visibility
  useEffect(() => {
    if (vehicles === null) return // still loading
    const hasFilters = hasActiveFilters(params)

    const shouldShowPlaceholder = vehicles.length === 0 && !hasFilters
    onPlaceholderVisibilityChange?.(shouldShowPlaceholder)
  }, [vehicles, params, onPlaceholderVisibilityChange])

  // skeleton while initial fetch running (prevents flashing empty state)
  if (loading || vehicles === null) {
    // Optimization: If no filters are active, optimistically show the Placeholder
    // instead of skeletons. This prevents the "flash of skeletons" -> "placeholder"
    // transition that users find jarring when simply landing on the page.
    const hasFilters = (() => {
      if (!params) return false
      const keys = [
        "make", "model", "year", "fuel", "transmission", "location",
        "minPrice", "maxPrice", "q", "condition", "exteriorColor", "interiorColor", "originalPaint"
      ]
      return keys.some(k => Boolean(params.get(k)))
    })()

    if (!hasFilters) {
      return <UpcomingAuctionsPlaceholder />
    }

    return (
      <div className="w-full">
        <CarGridSkeleton count={12} viewMode={internalViewMode} />
      </div>
    )
  }


  if (Array.isArray(vehicles) && vehicles.length === 0) {
    // If we have filters active, show standard no results
    if (hasActiveFilters(params)) {
      return (
        <EmptyListingState
          titleKey="auctions.no_results"
          descKey="auctions.no_results_desc"
        />
      )
    }

    // Weekday empty state -> Show Premium Placeholder
    return <UpcomingAuctionsPlaceholder />
  }

  // Determine if there are active search filters - if so, disable the notifier
  // to prevent false positives when the user is actively searching
  const hasActiveSearchFilters = hasActiveFilters(params)

  // Only show notifier when no active filters (browsing mode, not search mode)
  const notifierFetchUrl = `/api/auctions/approved?limit=1`
  const notifierTopId = loading ? null : (vehicles?.[0]?.id ?? null)
  const shouldShowNotifier = !hasActiveSearchFilters && !loading

  return (
    <div className="w-full">
      {/* Only show notifier when not actively searching to prevent false positives */}
      {shouldShowNotifier && (
        <NewItemsNotifier
          key={notifierFetchUrl}
          fetchUrl={notifierFetchUrl}
          initialTopId={notifierTopId}
          isLoading={loading}
        />
      )}
      {/* Search Result Stats & View Controls */}
      <div className="hidden md:flex justify-end mb-4">
        <button
          onClick={toggleViewMode}
          className="p-2 rounded-xl transition-all border-2 bg-white text-[#103090] border-[#DEB735]/60 hover:border-[#DEB735] hover:shadow-md shadow-sm active:scale-90 flex items-center justify-center"
          title={viewMode === 'grid' ? t("common.list_view" as any) : t("common.grid_view" as any)}
        >
          {viewMode === 'grid' ? <StretchHorizontal size={20} strokeWidth={2.5} /> : <LayoutGrid size={20} strokeWidth={2.5} />}
        </button>
      </div>

      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.12,
                  delayChildren: 0.1,
                  ease: [0.22, 1, 0.36, 1]
                }
              },
              exit: {
                opacity: 0,
                transition: { duration: 0.3 }
              }
            }}
            className={viewMode === 'grid'
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 tv:grid-cols-6 4xl:grid-cols-8 gap-3 lg:gap-4 w-full"
              : "flex flex-col gap-4 w-full"
            }
          >
            {vehicles!.map((it: any) => {
              const key = it?.id ?? it?.auction_id ?? JSON.stringify(it)
              return (
                <motion.div
                  key={String(key)}
                  variants={{
                    hidden: { opacity: 0, y: 30, filter: "blur(10px)", scale: 0.98 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      filter: "blur(0px)",
                      scale: 1,
                      transition: {
                        duration: 0.8,
                        ease: [0.22, 1, 0.36, 1]
                      }
                    },
                    exit: {
                      opacity: 0,
                      scale: 0.96,
                      transition: { duration: 0.2 }
                    }
                  }}
                >
                  <AuctionCard
                    data={it}
                    priority={vehicles!.indexOf(it) < 4}
                    initialIsWatched={it.is_watched}
                    viewMode={viewMode}
                  />
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Load more button / end marker */}
      <LoadMoreButton
        onLoadMore={async () => {
          try {
            if (loadingMore) return
            setLoadingMore(true)
            if (hasActiveFilters(params)) {
              const search = new URLSearchParams()
              for (const key of [
                "make", "model", "year", "fuel", "fuelType", "transmission", "location",
                "minPrice", "maxPrice", "minMileage", "maxMileage", "minEngine", "maxEngine",
                "condition", "doors", "exteriorColor", "interiorColor", "originalPaint", "q",
              ]) {
                const vals = params.getAll(key)
                if (vals.length > 0) {
                  vals.forEach(v => {
                    if (v && v !== "All") search.append(key, v)
                  })
                }
              }
              const nextPage = page + 1
              // ALWAYS include type=auction for auctions page
              search.append('type', 'auction')
              const moreRes = await fetch(`/api/search?${search.toString()}&page=${nextPage}&limit=${PAGE_SIZE}`, { cache: "no-store" })
              if (!moreRes.ok) throw new Error("load more failed")
              const moreData = await moreRes.json().catch(() => ({}))
              const moreList = Array.isArray(moreData?.results) ? moreData.results : (Array.isArray(moreData?.vehicles) ? moreData.vehicles : (Array.isArray(moreData?.auctions) ? moreData.auctions : []))
              setVehicles((prev) => (Array.isArray(prev) ? prev.concat(moreList) : moreList))
              setPage(nextPage)
              setHasMore(Boolean(moreData?.hasMore))
            } else {
              const nextOffset = offset
              const moreRes = await fetch(`/api/auctions/approved?limit=${PAGE_SIZE}&offset=${nextOffset}`, { cache: "no-store" })
              if (!moreRes.ok) throw new Error("load more failed")
              const moreData = await moreRes.json().catch(() => ({}))
              const moreList = Array.isArray(moreData?.results) ? moreData.results : (Array.isArray(moreData?.vehicles) ? moreData.vehicles : (Array.isArray(moreData?.auctions) ? moreData.auctions : (Array.isArray(moreData?.auctions) ? moreData.auctions : moreData.auctions || [])))
              setVehicles((prev) => (Array.isArray(prev) ? prev.concat(moreList) : moreList))
              setOffset((prev) => prev + (Array.isArray(moreList) ? moreList.length : 0))
              setHasMore(Array.isArray(moreList) ? moreList.length >= PAGE_SIZE : false)
            }
          } catch (err) {
            // ignore
          } finally {
            setLoadingMore(false)
          }
        }}
        loading={loadingMore}
        hasMore={hasMore}
        loadMoreKey="auctions.load_more"
        endKey="common.end_of_results"
      />
    </div>
  )
}
