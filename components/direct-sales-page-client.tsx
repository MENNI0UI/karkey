"use client"

import React, { useEffect, useState, useRef } from "react"
import { X, LayoutGrid, StretchHorizontal } from "lucide-react"
import { DirectSaleCard } from "@/components/direct-sale-card"
import NewItemsNotifier from "@/components/NewItemsNotifier"
import { useRouter as useNextRouter, useSearchParams } from "next/navigation"
import { DirectSalesFiltersSidebar, DirectSalesFiltersSidebarRef } from "@/components/direct-sales-filters-sidebar"
import type { DirectSalesFilterOptions } from "@/lib/filter-utils"
import { useTranslation } from "@/lib/i18n-context"
import { useToast } from "@/hooks/use-toast"
import { DraggableFilterButton } from "@/components/DraggableFilterButton"
import { CarCardSkeleton, CarGridSkeleton } from "@/components/ui/car-card-skeleton"
import { LuxuryLoader } from "@/components/ui/luxury-loader"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { motion, AnimatePresence } from "framer-motion"

const PAGE_SIZE = 20

export default function DirectSalesPageClient({
  initialVehicles = [],
  filterOptions,
  initialSavedState
}: {
  initialVehicles?: any[];
  filterOptions?: DirectSalesFilterOptions;
  initialSavedState?: { isMatch: boolean; savedId: number | null; paramsStr: string | null }
}) {
  const { t, language } = useTranslation()
  const { toast } = useToast()
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)
  const filtersRef = useRef<DirectSalesFiltersSidebarRef>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window === 'undefined') return 'grid'
    const saved = localStorage.getItem('karkey_view_mode') as 'grid' | 'list'
    if (saved && (saved === 'grid' || saved === 'list')) {
      if (window.innerWidth >= 768 || saved === 'grid') return saved
    }
    return 'grid'
  })

  // Save view mode preference whenever it changes
  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid'
    setViewMode(newMode)
    localStorage.setItem('karkey_view_mode', newMode)
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

  // Scroll-lock for mobile filters
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (showFiltersMobile) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyHeight = document.body.style.height;
      const originalHtmlHeight = document.documentElement.style.height;

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.height = "100vh";
      document.documentElement.style.height = "100vh";

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.height = originalBodyHeight;
        document.documentElement.style.height = originalHtmlHeight;
      };
    }
  }, [showFiltersMobile]);
  const router = useNextRouter()
  const searchParams = useSearchParams()
  const paramString = searchParams ? searchParams.toString() : ""

  // Close mobile filters when URL changes (Apply clicked)
  useEffect(() => {
    setShowFiltersMobile(false)
  }, [searchParams])

  // Create refs for scroll handling
  const [globalFilters, setGlobalFilters] = useState<{ make: string; model: string; year: string | number }[]>([])

  // Items, pagination, loading
  const [items, setItems] = useState<any[]>(initialVehicles)
  const [loading, setLoading] = useState(initialVehicles.length === 0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(PAGE_SIZE)
  const [hasMore, setHasMore] = useState(true)

  // For NewItemsNotifier
  // Determine if there are active search filters - if so, disable the notifier
  // to prevent false positives when the user is actively searching
  const hasActiveFilters = (() => {
    if (!searchParams) return false
    const filterKeys = ["make", "model", "year", "fuel", "fuelType", "transmission", "location",
      "minPrice", "maxPrice", "minMileage", "maxMileage", "minEngine", "maxEngine",
      "condition", "doors", "exteriorColor", "interiorColor", "originalPaint", "q"]
    return filterKeys.some(k => Boolean(searchParams.get(k)))
  })()

  // Only show notifier when no active filters (browsing mode, not search mode)
  const notifierFetchUrl = `/api/direct-sales/approved?limit=1`
  const notifierTopId = loading ? null : (items?.[0]?.id ?? null)
  // Completely disable notifier during active search to prevent false positives
  const shouldShowNotifier = !hasActiveFilters && !loading

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

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      try {
        if (!e.key) return
        if (e.key === "me_cached") {
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
          setIsAuth(false)
          setIsVerified(false)
        }
      } catch { }
    }
    function onAuthChanged(e: Event) {
      try {
        const d = (e as CustomEvent)?.detail ?? {}
        if (d?.action === "login") {
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

  // Sync state when initialVehicles changes (e.g. after router.refresh())
  useEffect(() => {
    if (initialVehicles && initialVehicles.length > 0) {
      setItems(initialVehicles)
      setOffset(Math.max(PAGE_SIZE, initialVehicles.length))
      setHasMore(initialVehicles.length >= PAGE_SIZE)
      setLoading(false)
    }
  }, [initialVehicles])

  // Fetch global filter data for dependent make/model/year logic
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch("/api/direct-sales/filters", { cache: "no-store" })
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
      makeModels: makeModelsObj, // pass this explicit map for sidebar to use
      years: yearsArr,
    }
  }, [filterOptions, globalFilters, searchParams?.toString()])

  // Fetch items when search params change
  const skipInitialRef = useRef(initialVehicles.length > 0)
  const isInitialMountRef = useRef(true)
  useEffect(() => {
    let mounted = true

    // Skip the initial render if we have SSR data
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      if (initialVehicles.length > 0) {
        // We already have data from SSR, no need to fetch
        return
      }
    }

    // Skip if we already have items and this is triggered by the same params
    if (skipInitialRef.current) {
      skipInitialRef.current = false
      return
    }

    setLoading(true)
    setOffset(PAGE_SIZE)
    setHasMore(true)

    const tryFetch = async () => {
      try {
        const paramStr = searchParams?.toString() ?? ""

        // Smart Prefetch Guard Rail: Check sessionStorage first
        if (typeof window !== "undefined") {
          try {
            const cachedArr = sessionStorage.getItem(`direct_sales_search_prefetch:v3:${paramStr}`)
            if (cachedArr) {
              const { ts, data } = JSON.parse(cachedArr)
              const now = Date.now()
              // Only use if less than 60 seconds old
              if (now - ts < 60000 && data?.vehicles) {
                if (mounted) {
                  setItems(data.vehicles)
                  setHasMore(Boolean(data.hasMore))
                  setLoading(false)
                  return // Skip network request
                }
              }
            }
          } catch { }
        }

        const url = paramStr ? `/api/direct-sales/approved?${paramStr}&limit=${PAGE_SIZE}` : `/api/direct-sales/approved?limit=${PAGE_SIZE}`
        const res = await fetch(url, { cache: "no-store" })
        if (!mounted) return
        if (!res.ok) throw new Error("fetch-error")
        const data = await res.json().catch(() => ({}))
        if (mounted) {
          const arr = Array.isArray(data?.vehicles) ? data.vehicles : []
          setItems(arr)
          setHasMore(Boolean(data?.hasMore))
        }
      } catch (e) {
        // ignore; keep existing items
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void tryFetch()
    return () => { mounted = false }
  }, [searchParams?.toString()])

  useEffect(() => {
    try {
      const reason = searchParams?.get("blocked_reason") || searchParams?.get("blocked")
      if (!reason) return
      toast({
        title: t("common.error"),
        description: t("direct_sales.unverified_error"),
        variant: "error",
      })
      try {
        const url = new URL(window.location.href)
        url.searchParams.delete("blocked_reason")
        url.searchParams.delete("blocked")
        router.replace(url.toString())
      } catch { }
    } catch { }
  }, [searchParams, t, toast])

  const handleAddListing = async () => {
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      const j = await r.json().catch(() => ({}))
      if (!(r.ok && j?.success)) { router.push(`/${language}/auth/login`); return }
      const ver = (j.profile?.verification_status ?? j.profile?.verification?.status ?? "").toString().toLowerCase()
      setIsVerified(ver === "approved")
      setVerificationStatus(ver || null)
      if (ver !== "approved") {
        toast({
          title: t("common.error"),
          description: t("direct_sales.unverified_error"),
          variant: "error",
        })
        return
      }
      router.push(`/${language}/direct-sales/create`)
    } catch (err) {
      router.push(`/${language}/auth/login`)
    }
  }
  useEffect(() => {
    function onOpenFilters() { try { setShowFiltersMobile(true) } catch { } }
    window.addEventListener('open:filters', onOpenFilters as EventListener)
    return () => window.removeEventListener('open:filters', onOpenFilters as EventListener)
  }, [])

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <div className="w-full lg:px-0 lg:flex items-start flex-1">
        <DirectSalesFiltersSidebar
          ref={filtersRef}
          options={dynamicFilterOptions}
          className="flex-shrink-0"
          initialSavedState={initialSavedState}
        />
        <div className="flex-1 w-full min-w-0 px-4 lg:px-6 xl:px-8 pt-4">
          {loading ? (
            <div className="w-full">
              <CarGridSkeleton count={12} viewMode={viewMode} />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-[#103090] font-serif font-bold text-lg">{t("direct_sales.no_listings")}</div>
          ) : (
            <div className="w-full">
              {/* Single Toggle View Switcher - Hidden on Mobile */}
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
                      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 tv:grid-cols-6 4xl:grid-cols-8 gap-3 lg:gap-4 w-full"
                      : "flex flex-col gap-4 w-full"
                    }
                  >
                    {items.map((it) => (
                      <motion.div
                        key={it.id}
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
                        <DirectSaleCard
                          item={it}
                          linkPrefix="/direct-sales"
                          priority={false}
                          viewMode={viewMode}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
              {/* Load more / end marker */}
              {items.length > 0 ? (
                <div className="flex justify-center mt-6">
                  {hasMore ? (
                    <button
                      className="inline-flex items-center justify-center bg-white border border-gray-200 text-[#103090] hover:bg-gray-50 rounded-md px-4 py-2 shadow-sm text-sm font-semibold"
                      onClick={async () => {
                        try {
                          if (loadingMore) return
                          setLoadingMore(true)
                          const paramString = searchParams?.toString() ?? ""
                          const base = paramString ? `/api/direct-sales/approved?${paramString}` : `/api/direct-sales/approved`
                          const url = `${base}${paramString ? `&` : `?`}limit=${PAGE_SIZE}&offset=${offset}`
                          const res = await fetch(url, { cache: "no-store" })
                          if (!res.ok) throw new Error("load more failed")
                          const data = await res.json().catch(() => null)
                          const more = Array.isArray(data?.vehicles) ? data.vehicles : []
                          setItems((prev) => (Array.isArray(prev) ? prev.concat(more) : more))
                          setOffset((prev) => prev + (Array.isArray(more) ? more.length : 0))
                          setHasMore(Boolean(data?.hasMore))
                        } catch (err) {
                          // ignore
                        } finally {
                          setLoadingMore(false)
                        }
                      }}
                    >
                      {loadingMore ? (
                        <>
                          <LuxuryLoader size="sm" className="mr-2" />
                          {t("common.loading")}
                        </>
                      ) : (
                        t("direct_sales.load_more")
                      )}
                    </button>
                  ) : (
                    <div className="text-sm text-[#717171]">{t("common.end_of_results")}</div>
                  )}
                </div>
              ) : null}
            </div>
          )}
          <div id="filters-footer-sentinel" className="w-full h-px" aria-hidden="true" />
        </div>
      </div>
      {showFiltersMobile ? (
        <div className="fixed inset-0 z-[110000] lg:hidden">
          {/* Backdrop - z-10 to be BEHIND the content panel */}
          <div className="absolute inset-0 z-10 bg-black/50" onClick={handleCloseFilters} />
          {/* Content panel - z-20 to be ABOVE the backdrop */}
          <div className="absolute inset-0 z-20 bg-white shadow-xl flex flex-col overflow-hidden pointer-events-auto">
            <button
              onClick={handleCloseFilters}
              aria-label="Close filters"
              title="Close filters"
              className="absolute right-4 top-2.5 z-50 inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#B8071C] text-white shadow-[0_4px_12px_rgba(184,7,28,0.3)] hover:bg-[#910515] active:scale-95 transition-all outline-none ring-2 ring-white/10"
            >
              <X size={22} strokeWidth={2.5} />
            </button>
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50/50">
              <div className="text-xl font-bold font-serif text-[#111827]">{t("direct_sales.filter")}</div>
              <div />
            </div>
            <div className="px-4 py-4 border-b bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <button
                type="button"
                onClick={handleCloseFilters}
                className="w-full inline-flex items-center justify-center bg-gradient-to-r from-[#B8071C] to-[#D31027] hover:from-[#910515] hover:to-[#B8071C] text-white rounded-xl h-14 text-lg font-bold shadow-[0_4px_15px_rgba(184,7,28,0.25)] active:scale-[0.98] transition-all"
              >
                {t("direct_sales.close")}
              </button>
            </div>
            <div className="p-0 flex-1 overflow-hidden">
              <DirectSalesFiltersSidebar
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
      {/* Only show notifier when not actively searching to prevent false positives */}
      {shouldShowNotifier && (
        <NewItemsNotifier
          key={notifierFetchUrl}
          fetchUrl={notifierFetchUrl}
          initialTopId={notifierTopId}
          label={t("direct_sales.new_listings_label")}
          isLoading={loading}
        />
      )}
      {/* Mobile / small screens: Draggable Filter control */}
      {!showFiltersMobile ? (
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
