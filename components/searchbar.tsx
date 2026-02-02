"use client"
import React, { useEffect, useRef, useState, useLayoutEffect, useMemo } from "react"
import { MainFilterPanel, PinnedFilterPanel } from "@/components/search/filter-panels"
import { useRouter, usePathname } from "next/navigation"
import { useTranslation } from "@/lib/i18n-context"
import { DesktopSearchView } from "@/components/search/desktop-search-view"
import { PinnedSearchView } from "@/components/search/pinned-search-view"
import { MobileSearchView } from "@/components/search/mobile-search-view"
import { FilterOptions } from "@/components/search/types"

type Props = { className?: string; options?: FilterOptions }

export default function SearchBar({ className = "", options: initialOptionsProp }: Props) {
    const { t } = useTranslation()
    const router = useRouter()
    const pathname = usePathname() || ""
    const currentLang = pathname.split('/')[1] || 'en'

    // background loading for filter options
    const [dynamicOptions, setDynamicOptions] = useState<FilterOptions | undefined>(initialOptionsProp)

    useEffect(() => {
        // If we didn't get options from props (homepage), fetch them in BG from API
        if (!dynamicOptions || Object.keys(dynamicOptions).length === 0) {
            fetch(`/api/direct-sales/filters`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.options) {
                        setDynamicOptions(data.options)
                    }
                })
                .catch(() => { /* ignore silent failure */ })
        }
    }, [])

    const options = dynamicOptions

    // refs + state
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const filterBtnRef = useRef<HTMLButtonElement | null>(null) // main search filter button
    const pinnedFilterBtnRef = useRef<HTMLButtonElement | null>(null) // pinned search filter button
    const [pinned, setPinned] = useState(false)
    // filter popover state
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [filterPos, setFilterPos] = useState<{ top: number; left: number } | null>(null)
    // which filter panel to show when filtersOpen is true
    const [filterVariant, setFilterVariant] = useState<"main" | "pinned" | null>(null)

    // default option lists
    const defaultMakes = ["Renault", "Toyota", "Peugeot"]
    const defaultModels = ["Clio", "208", "Corolla"]
    const defaultYears = ["2024", "2023", "2022"]
    const defaultFuels = [
        { value: "Petrol", label: t("vehicle.fuel.petrol") },
        { value: "Diesel", label: t("vehicle.fuel.diesel") },
        { value: "Electric", label: t("vehicle.fuel.electric") },
        { value: "Hybrid", label: t("vehicle.fuel.hybrid") },
    ]
    const defaultTrans = [
        { value: "Automatic", label: t("vehicle.transmission.automatic") },
        { value: "Manual", label: t("vehicle.transmission.manual") },
    ]
    const defaultLocations = ["Casablanca", "Rabat", "Agadir", "Marrakech", "Tangier"]
    const defaultConditions = [
        { value: "Excellent", label: t("vehicle.condition.excellent") },
        { value: "Good", label: t("vehicle.condition.good") },
        { value: "Fair", label: t("vehicle.condition.fair") },
        { value: "Poor", label: t("vehicle.condition.poor") },
    ]

    // effective lists: prefer `options` prop when provided, otherwise use defaults
    const makesList: string[] = options?.makes && options.makes.length ? options.makes : defaultMakes
    const modelsByMake: Record<string, string[]> = options?.modelsByMake ?? {}
    const yearsByMake: Record<string, string[]> = options?.yearsByMake ?? {}
    const yearsList: Array<string | number> = options?.years && options.years.length ? options.years : defaultYears
    // fuels used in select expect { value,label } objects: normalize both strings and objects
    const fuelsList: Array<{ value: string; label: string }> = (options?.fuelTypes && options.fuelTypes.length ? options.fuelTypes : defaultFuels).map((f) => {
        if (typeof f === "object" && f !== null && "value" in f) {
            return { value: String(f.value), label: String(f.label || f.value) }
        }
        return { value: String(f), label: String(f) }
    })
    const transList: Array<{ value: string; label: string }> = (options?.transmissions && options.transmissions.length ? options.transmissions : defaultTrans).map((t) => {
        if (typeof t === "object" && t !== null && "value" in t) {
            return { value: String(t.value), label: String(t.label || t.value) }
        }
        return { value: String(t), label: String(t) }
    })
    const locationsList: string[] = options?.locations && options.locations.length ? options.locations : defaultLocations

    // full (main) fields
    const [make, setMake] = useState<string[]>([])
    const [model, setModel] = useState<string[]>([])
    const [year, setYear] = useState("All")
    const [fuel, setFuel] = useState<string[]>([])
    const [transmission, setTransmission] = useState("All")
    const [location, setLocation] = useState<string[]>([])
    const [condition, setCondition] = useState<string[]>([])
    const [minPrice, setMinPrice] = useState("")
    const [maxPrice, setMaxPrice] = useState("")
    const [mobileQuery, setMobileQuery] = useState("")
    const [isFocused, setIsFocused] = useState(false)
    const [searchMode, setSearchMode] = useState<"auction" | "direct_sale" | null>(null)

    const inlineSearchRef = useRef<HTMLInputElement>(null)
    const pinnedSearchRef = useRef<HTMLInputElement>(null)

    // Auto-focus input when searchMode is selected
    useEffect(() => {
        if (searchMode) {
            // small timeout to ensure suggestions are rendered or previous refs are stable
            setTimeout(() => {
                // Only auto-focus on desktop to prevent mobile scroll jumps
                if (window.innerWidth > 640) {
                    if (pinned && pinnedSearchRef.current) pinnedSearchRef.current.focus()
                    else if (inlineSearchRef.current) inlineSearchRef.current.focus()
                }
            }, 100)
        }
    }, [searchMode, pinned])

    const conditionsList: Array<{ value: string; label: string }> = (options?.conditions && options.conditions.length ? options.conditions : defaultConditions).map((c) => {
        if (typeof c === "object" && c !== null && "value" in c) {
            return { value: String(c.value), label: String(c.label || c.value) }
        }
        return { value: String(c), label: String(c) }
    })

    // If a make is selected, show only models for that make; otherwise show all models
    // For multi-make, we show models for ALL selected makes
    const modelsList: string[] = useMemo(() => {
        if (make.length > 0) {
            const combined: string[] = []
            make.forEach(m => {
                if (modelsByMake[m]) combined.push(...modelsByMake[m])
            })
            if (combined.length > 0) return Array.from(new Set(combined)).sort()
        }
        return options?.models && options.models.length ? options.models : defaultModels
    }, [make, modelsByMake, options?.models, defaultModels])

    // If a make is selected, show only years for that make; otherwise show all years
    const effectiveYearsList: string[] = useMemo(() => {
        if (make.length > 0) {
            const combined: string[] = []
            make.forEach(m => {
                if (yearsByMake[m]) combined.push(...yearsByMake[m])
            })
            if (combined.length > 0) return Array.from(new Set(combined)).sort((a, b) => Number(b) - Number(a))
        }
        return yearsList.map(String)
    }, [make, yearsByMake, yearsList])

    // show the pinned search slightly earlier to avoid the "no search" gap
    const [showPinnedEarly, setShowPinnedEarly] = useState(false)
    // detect small screens so we can show only the pinned bar on mobile
    const [isSmallScreen, setIsSmallScreen] = useState(false)

    // Observe the main search pill so we can toggle the pinned copy when it scrolls out of view
    useEffect(() => {
        // ENABLE on mobile now: removing the early return
        const el = wrapperRef.current
        if (!el) return

        const getHeaderOffset = () => {
            try {
                const root = getComputedStyle(document.documentElement)
                const v = root.getPropertyValue("--site-header-height")?.trim() || "60px"
                return parseInt(v.replace("px", ""), 10) || 60
            } catch { return 60 }
        }

        const headerOffset = getHeaderOffset()
        const margin = isSmallScreen ? `-${headerOffset}px 0px 0px 0px` : `-50px 0px 0px 0px`

        const observer = new IntersectionObserver(
            (entries) => {
                const e = entries[0]
                if (!e) return
                setPinned(!e.isIntersecting)
            },
            { root: null, rootMargin: margin, threshold: 0 }
        )

        observer.observe(el)

        // initial check: if the pill is already scrolled near header, mark pinned
        try {
            const rect = el.getBoundingClientRect()
            if (rect.top <= Math.max(headerOffset - 24, 0)) setPinned(true)
        } catch { }

        // Fallback scroll handler to properly unpin when scrolling back to top
        // This handles edge cases where IntersectionObserver doesn't fire correctly
        const handleScrollFallback = () => {
            const scrollY = window.scrollY || document.documentElement.scrollTop || 0
            // If we're near the top of the page, force unpin
            if (scrollY <= 50) {
                setPinned(false)
            }
        }

        window.addEventListener("scroll", handleScrollFallback, { passive: true })

        return () => {
            try { observer.disconnect(); } catch { }
            window.removeEventListener("scroll", handleScrollFallback)
        }
    }, [isSmallScreen])

    // On small screens we want to hide the main search pill and show the pinned copy instead.
    // Use useLayoutEffect so the small-screen state is set before the browser paints,
    // preventing a visible flash of the main pill on mobile.
    useLayoutEffect(() => {
        if (typeof window === "undefined") return
        const mq = window.matchMedia('(max-width: 640px)')
        const handler = (ev: MediaQueryListEvent | MediaQueryList) => {
            const small = 'matches' in ev ? ev.matches : Boolean(ev)
            setIsSmallScreen(Boolean(small))
            // Do NOT force unpin on mobile switch; let observer handle it
        }
        // apply initial synchronously
        try { handler(mq) } catch { }
        // listen for changes
        if (typeof mq.addEventListener === 'function') mq.addEventListener('change', handler)
        else if (typeof mq.addListener === 'function') mq.addListener(handler as any)
        return () => {
            try { if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', handler) } catch { }
            try { if (typeof mq.removeListener === 'function') mq.removeListener(handler as any) } catch { }
        }
    }, [])

    // filter panel interactions
    useEffect(() => {
        if (!filtersOpen) return
        const onDoc = (e: MouseEvent) => {
            const target = e.target as Node
            // ignore clicks on either filter button
            if (filterBtnRef.current && filterBtnRef.current.contains(target)) return
            if (pinnedFilterBtnRef.current && pinnedFilterBtnRef.current.contains(target)) return
            const panelMain = document.getElementById("karkey-filter-panel-main")
            const panelPinned = document.getElementById("karkey-filter-panel-pinned")
            if (panelMain && panelMain.contains(target)) return
            if (panelPinned && panelPinned.contains(target)) return
            setFiltersOpen(false)
        }
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFiltersOpen(false) }
        document.addEventListener("mousedown", onDoc)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("mousedown", onDoc)
            document.removeEventListener("keydown", onKey)
        }
    }, [filtersOpen])

    // openFilters: toggle when clicking the same button; compute coords and position panel fixed under the button left edge
    const openFilters = (usePinned = false) => {
        const desired = usePinned ? "pinned" : "main"

        // If same panel is already open -> close (toggle)
        if (filtersOpen && filterVariant === desired) {
            setFiltersOpen(false)
            setFilterVariant(null)
            return
        }

        // Otherwise open the requested panel and compute position
        const btn = usePinned ? pinnedFilterBtnRef.current : filterBtnRef.current
        if (btn) {
            const rect = btn.getBoundingClientRect()

            // Determine approximate width based on variant (fallback to bigger one to be safe)
            const PANEL_WIDTH = desired === "pinned" ? 320 : 480
            const HALF_WIDTH = PANEL_WIDTH / 2
            const SCREEN_PADDING = 10

            // Initial center alignment
            let left = rect.left + rect.width / 2

            // Clamp to viewport edges
            if (typeof window !== "undefined") {
                const maxLeft = window.innerWidth - HALF_WIDTH - SCREEN_PADDING
                const minLeft = HALF_WIDTH + SCREEN_PADDING

                if (left > maxLeft) left = maxLeft
                if (left < minLeft) left = minLeft
            }

            setFilterPos({ top: Math.round(rect.bottom) + 8, left: Math.round(left) })
        } else {
            setFilterPos(null)
        }
        setFilterVariant(desired)
        setFiltersOpen(true)
    }

    // triggerSearch: navigate to /auctions with relevant query params so the Auctions page shows results
    const triggerSearch = (vals?: {
        make?: string | string[]
        model?: string | string[]
        year?: string | string[]
        fuel?: string | string[]
        transmission?: string | string[]
        location?: string | string[]
        condition?: string | string[]
        minPrice?: string
        maxPrice?: string
        query?: string
    }) => {
        const trimmedQuery = vals?.query?.trim()
        const v = {
            make: vals?.make ?? make,
            model: vals?.model ?? model,
            year: vals?.year ?? year,
            fuel: vals?.fuel ?? fuel,
            transmission: vals?.transmission ?? transmission,
            location: vals?.location ?? location,
            condition: vals?.condition ?? condition,
            minPrice: vals?.minPrice ?? minPrice,
            maxPrice: vals?.maxPrice ?? maxPrice,
            query: trimmedQuery && trimmedQuery.length ? trimmedQuery : undefined,
            type: searchMode || undefined
        }
        const params = new URLSearchParams()

        const addParam = (key: string, val: any) => {
            if (!val) return
            if (Array.isArray(val)) {
                val.forEach(item => {
                    if (item && item !== "All") params.append(key, String(item))
                })
            } else if (val !== "All") {
                params.set(key, String(val))
            }
        }

        addParam("make", v.make)
        addParam("model", v.model)
        addParam("year", v.year)
        addParam("fuel", v.fuel)
        addParam("transmission", v.transmission)
        addParam("location", v.location)
        addParam("condition", v.condition)

        if (v.minPrice) params.set("minPrice", String(v.minPrice))
        if (v.maxPrice) params.set("maxPrice", String(v.maxPrice))
        if (v.query) params.set("q", String(v.query))
        if (v.type) params.set("type", String(v.type))

        const queryString = params.toString()

        // --- PREFETCH (non-blocking) ---
        try {
            // build same url direct-sales page will call
            const url = queryString ? `/api/direct-sales/search?${queryString}` : `/api/direct-sales/search`
            // best-effort non-blocking fetch; store JSON in sessionStorage under a keyed name
            if (typeof window !== "undefined" && typeof window.fetch === "function" && typeof window.sessionStorage !== "undefined") {
                fetch(url, { cache: "no-store" })
                    .then((res) => res.ok ? res.json().catch(() => null) : null)
                    .then((data) => {
                        if (!data) return
                        try {
                            const key = `search_prefetch:${queryString}`
                            const payload = { ts: Date.now(), data }
                            sessionStorage.setItem(key, JSON.stringify(payload))
                        } catch { }
                    })
                    .catch(() => { /* ignore prefetch errors */ })
            }
        } catch { }
        // --- end prefetch ---

        // mark search-in-progress (so /auctions can show instant indicator after navigation)
        try {
            if (typeof window !== "undefined" && window.sessionStorage) {
                const key = `search_in_progress:${queryString}`
                sessionStorage.setItem(key, JSON.stringify({ ts: Date.now() }))
                // keep a short-lived marker (consumer will remove when refreshed)
            }
        } catch { }

        // signal a manual search so other UI (saved-search toggles) can clear
        try {
            if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new CustomEvent('karkey:search:manual', { detail: { params: queryString } }))
            }
        } catch { }

        // SMART ROUTING: Determine target based on current pathname
        let routeBase = `/${currentLang}/direct-sales`
        if (pathname.includes('/auctions')) {
            routeBase = `/${currentLang}/auctions`
        } else if (pathname.includes('/karkey-cars')) {
            routeBase = `/${currentLang}/karkey-cars`
        }

        const target = queryString ? `${routeBase}?${queryString}` : routeBase
        router.push(target)
    }

    // applyFilters: triggers the same search flow
    const applyFilters = () => {
        void triggerSearch()
        setFiltersOpen(false)
    }

    const resetAll = () => {
        setMake([])
        setModel([])
        setYear("All")
        setFuel([])
        setTransmission("All")
        setLocation([])
        setCondition([])
        setMinPrice("")
        setMaxPrice("")
        setMobileQuery("")
        window.dispatchEvent(new CustomEvent("karkey:search:reset"))
    }

    const handleMobileSearch = () => {
        const q = mobileQuery.trim()
        if (q.length === 0) {
            void triggerSearch()
            return
        }
        void triggerSearch({ query: q })
    }

    // State for minimizing the search bar (user requested capability to hide it) -> REMOVED

    // MAIN filter panel
    const mainFilterPanel = filtersOpen && filterVariant === "main" ? (
        <MainFilterPanel
            isOpen={filtersOpen && filterVariant === "main"}
            position={filterPos}
            condition={condition}
            minPrice={minPrice}
            maxPrice={maxPrice}
            conditionsList={conditionsList}
            t={t}
            setCondition={setCondition}
            setMinPrice={setMinPrice}
            setMaxPrice={setMaxPrice}
            onClose={() => setFiltersOpen(false)}
            onApply={() => { applyFilters(); setFilterVariant(null) }}
        />
    ) : null

    // PINNED filter panel
    const pinnedFilterPanel = filtersOpen && filterVariant === "pinned" ? (
        <PinnedFilterPanel
            isOpen={filtersOpen && filterVariant === "pinned"}
            position={filterPos}
            year={year}
            fuel={fuel}
            transmission={transmission}
            condition={condition}
            minPrice={minPrice}
            maxPrice={maxPrice}
            effectiveYearsList={effectiveYearsList}
            fuelsList={fuelsList}
            transList={transList}
            conditionsList={conditionsList}
            setYear={setYear}
            setFuel={setFuel}
            setTransmission={setTransmission}
            setCondition={setCondition}
            setMinPrice={setMinPrice}
            setMaxPrice={setMaxPrice}
            onClose={() => setFiltersOpen(false)}
            onApply={() => { applyFilters(); setFilterVariant(null) }}
        />
    ) : null

    // effect: monitor main-search position and set showPinnedEarly before pinned becomes true
    const [isNavbarVisible, setIsNavbarVisible] = useState(true)
    const lastScrollY = useRef(0)

    useEffect(() => {
        if (typeof window === "undefined") return

        const handleScroll = () => {
            const currentScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop
            if (currentScrollY < 0) return

            // Add hysteresis/threshold to prevent jitter on small movements
            const delta = currentScrollY - lastScrollY.current

            if (currentScrollY > 10 && Math.abs(delta) > 10) {
                if (delta > 0) {
                    setIsNavbarVisible(false)
                } else {
                    setIsNavbarVisible(true)
                }
            } else if (currentScrollY <= 10) {
                setIsNavbarVisible(true)
            }
            lastScrollY.current = currentScrollY
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        document.body.addEventListener("scroll", handleScroll, { passive: true })
        return () => {
            window.removeEventListener("scroll", handleScroll)
            document.body.removeEventListener("scroll", handleScroll)
        }
    }, [])

    useEffect(() => {
        if (typeof window === "undefined" || isSmallScreen) return
        let rafId: number | null = null

        const getHeaderHeight = () => {
            try {
                const headerEl = document.querySelector("header") as HTMLElement | null
                if (headerEl) {
                    const r = headerEl.getBoundingClientRect()
                    if (r.height && r.height > 0) return Math.round(r.height)
                }
                const v = getComputedStyle(document.documentElement).getPropertyValue("--site-header-height")
                const n = Number(String(v).replace("px", "").trim())
                return Number.isFinite(n) && n > 0 ? n : 76
            } catch {
                return 76
            }
        }

        const check = () => {
            const el = wrapperRef.current
            if (!el) {
                setShowPinnedEarly(false)
                return
            }
            const rect = el.getBoundingClientRect()
            const headerH = getHeaderHeight()
            const earlyThreshold = -65

            if (rect.top <= headerH + earlyThreshold) {
                setShowPinnedEarly(true)
            } else {
                setShowPinnedEarly(false)
            }
        }

        const onScroll = () => {
            if (rafId !== null) cancelAnimationFrame(rafId)
            rafId = requestAnimationFrame(check)
        }

        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll)
        check()

        return () => {
            if (rafId !== null) cancelAnimationFrame(rafId)
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
            setShowPinnedEarly(false)
        }
    }, [isSmallScreen])

    const commonProps = {
        t,
        make, setMake,
        model, setModel,
        year, setYear,
        fuel, setFuel,
        transmission, setTransmission,
        location, setLocation,
        makesList,
        modelsList,
        effectiveYearsList,
        fuelsList,
        transList,
        locationsList,
        openFilters,
        resetAll,
        triggerSearch
    }

    return (
        <>
            {/* Desktop / Large Screen Structure */}
            {!isSmallScreen && (
                <>
                    {/* Main "Inline" Search Bar */}
                    <div
                        ref={wrapperRef}
                        className={`w-full max-w-[900px] mx-auto bg-white rounded-full transition-all duration-300 relative z-[45] shadow-[0_15px_35px_rgba(0,0,0,0.1),0_5px_15px_rgba(0,0,0,0.04)] border border-transparent transform hover:-translate-y-0.5 ${className}`}
                    >
                        <DesktopSearchView
                            {...commonProps}
                            filterBtnRef={filterBtnRef}
                        />
                    </div>

                    {/* Pinned / Sticky Search Bar - shows when main is scrolled out */}
                    <div
                        className={`fixed top-4 left-1/2 transform -translate-x-1/2 w-full z-[50] transition-all duration-500 ease-out sm:px-4 ${showPinnedEarly || pinned // Show if either intersection observer or scroll calculation says so
                            ? `${isNavbarVisible ? 'translate-y-[calc(var(--site-header-height)-1rem)] opacity-100 pointer-events-auto' : '-translate-y-full opacity-0 pointer-events-none'}`
                            : '-translate-y-full opacity-0 pointer-events-none' // Hide if not scrolled far enough
                            }`}
                    >
                        <div className="container mx-auto max-w-[1400px]">
                            <div className="mx-auto w-full max-w-[520px] bg-white/95 backdrop-blur-md rounded-full shadow-[0_12px_40px_rgb(0,0,0,0.15)] border border-gray-100/50">
                                <PinnedSearchView
                                    {...commonProps}
                                    pinnedFilterBtnRef={pinnedFilterBtnRef}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Mobile Structure */}
            {isSmallScreen && (
                <div
                    className={`fixed top-[calc(var(--site-header-height)+10px)] left-0 right-0 z-[45] transition-all duration-300 transform ${isNavbarVisible
                        ? "translate-y-0 opacity-100 pointer-events-auto"
                        : "-translate-y-full opacity-0 pointer-events-none"
                        }`}
                >
                    <MobileSearchView
                        t={t}
                        searchMode={searchMode}
                        setSearchMode={setSearchMode}
                        currentLang={currentLang}
                        mobileQuery={mobileQuery}
                        setMobileQuery={setMobileQuery}
                        isFocused={isFocused}
                        setIsFocused={setIsFocused}
                        handleMobileSearch={handleMobileSearch}
                        inlineSearchRef={inlineSearchRef}
                        triggerSearch={triggerSearch}
                    />
                </div>
            )}

            {/* Filter Panels (Portals/Absolute) */}
            {mainFilterPanel}
            {pinnedFilterPanel}
        </>
    )
}
