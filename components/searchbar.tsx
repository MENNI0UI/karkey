"use client"

import React, { useEffect, useRef, useState, useLayoutEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n-context"
import CustomSelect from "@/components/ui/custom-select"
import CustomMultiSelect from "@/components/ui/custom-multi-select"
import { ScaleButton, SlideUp } from "@/components/ui/motion-wrappers"

type FilterOptions = {
    makes?: string[]
    models?: string[]
    modelsByMake?: Record<string, string[]>
    yearsByMake?: Record<string, string[]>
    years?: Array<string | number>
    fuelTypes?: Array<string | { value: string; label: string }>
    transmissions?: Array<string | { value: string; label: string }>
    locations?: string[]
    conditions?: Array<string | { value: string; label: string }>
}

type Props = { className?: string; options?: FilterOptions }

export default function SearchBar({ className = "", options }: Props) {
    const { t } = useTranslation()
    const router = useRouter()
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

        // use client-side navigation (faster, SPA style) to /direct-sales with query params
        const target = queryString ? `/direct-sales?${queryString}` : `/direct-sales`
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


    const fullInner = (
        <div className="searchbar-grid-main px-3 py-2.5 relative">
            <div className="sb-cell">
                <CustomMultiSelect
                    label={t("filters.make")}
                    value={make}
                    onChange={(val) => { setMake(val); setModel([]); }}
                    options={[
                        ...makesList.map((m) => ({ value: String(m), label: String(m) }))
                    ]}
                />
            </div>

            <div className="sb-cell">
                <CustomMultiSelect
                    label={t("filters.model")}
                    value={model}
                    onChange={setModel}
                    options={[
                        ...modelsList.map((m) => ({ value: String(m), label: String(m) }))
                    ]}
                />
            </div>

            <div className="sb-cell">
                <CustomSelect
                    label={t("filters.year_range")}
                    value={year}
                    onChange={setYear}
                    isAll={year === "All"}
                    options={[
                        { value: "All", label: t("filters.all") },
                        ...effectiveYearsList.map((y) => ({ value: String(y), label: String(y) }))
                    ]}
                />
            </div>

            <div className="sb-cell">
                <CustomMultiSelect
                    label={t("filters.fuel")}
                    value={fuel}
                    onChange={setFuel}
                    options={[
                        ...fuelsList.map((f) => ({ value: String(f.value), label: String(f.label) }))
                    ]}
                />
            </div>

            <div className="sb-cell">
                <CustomSelect
                    label={t("wizard.fields.transmission")}
                    value={transmission}
                    onChange={setTransmission}
                    isAll={transmission === "All"}
                    options={[
                        { value: "All", label: t("filters.all") },
                        ...transList.map((tr) => ({ value: tr.value, label: tr.label }))
                    ]}
                />
            </div>

            <div className="sb-cell">
                <CustomMultiSelect
                    label={t("wizard.fields.location")}
                    value={location}
                    onChange={setLocation}
                    options={[
                        ...locationsList.map((l) => ({ value: l, label: l }))
                    ]}
                />
            </div>

            {/* Hide Button (Left of Filters) -> REMOVED */}

            {/* compact container: use CSS class to keep sizing consistent (no inline styles) */}
            {/* remove right divider for the filter cell */}
            <div className="sb-cell sb-cell--tight sb-cell--no-divider flex items-center justify-center min-w-[50px]">
                <button
                    ref={filterBtnRef}
                    type="button"
                    onClick={() => openFilters(false)}
                    title="Filters"
                    className="w-8 h-8 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center transition-all hover:border-primary hover:shadow-md hover:-translate-y-0.5"
                    aria-label="Open filters"
                >
                    <img src="/icons/filtre.png" alt="Filters" className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                </button>
            </div>

            <div className="sb-cell searchbar-actions">
                <button
                    type="button"
                    onClick={resetAll}
                    title="Clear"
                    className="searchbar-search-btn searchbar-search-btn--clear"
                    aria-label="Clear filters"
                >
                    {/* small clear icon inside pill */}
                    <span className="text-sm" aria-hidden>✕</span>
                </button>

                {/* compact settings/filter button kept inside the main pill (already present) */}
                {/* primary search button: use image icon and slightly larger classes */}
                <ScaleButton
                    type="button"
                    onClick={() => void triggerSearch()}
                    aria-label="Search"
                    className="searchbar-search-btn searchbar-search-btn--primary"
                    title="Search"
                >
                    <svg aria-hidden="true" focusable="false" className="search-icon-svg" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" fill="none" />
                        <line x1="20.5" y1="20.5" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                </ScaleButton>
            </div>
        </div>
    )

    // COMPACT inner used only for pinned copy
    const compactInner = (
        <div className="searchbar-grid-main px-3 py-2.5">
            <div className="sb-cell">
                <CustomMultiSelect
                    label={t("filters.make")}
                    value={make}
                    onChange={(val) => { setMake(val); setModel([]); }}
                    options={[
                        ...makesList.map((m) => ({ value: String(m), label: String(m) }))
                    ]}
                />
            </div>

            <div className="sb-cell">
                <CustomMultiSelect
                    label={t("filters.model")}
                    value={model}
                    onChange={setModel}
                    options={[
                        ...modelsList.map((m) => ({ value: String(m), label: String(m) }))
                    ]}
                />
            </div>

            <div className="sb-cell">
                <CustomMultiSelect
                    label={t("wizard.fields.location")}
                    value={location}
                    onChange={setLocation}
                    options={[
                        ...locationsList.map((l) => ({ value: l, label: l }))
                    ]}
                />
            </div>

            {/* Hide Button (Pinned Mode) -> REMOVED */}

            {/* removed expandable spacer in compact/pinned mode to avoid large empty gaps */}
            {/* small gap now handled by CSS gaps; no grow element here */}

            {/* pinned: same compact treatment via CSS class */}
            {/* pinned filter cell: also remove the right divider */}
            <div className="sb-cell sb-cell--tight sb-cell--no-divider flex items-center justify-center">
                <button
                    ref={pinnedFilterBtnRef}
                    type="button"
                    onClick={() => openFilters(true)}
                    title="Filters"
                    className="w-8 h-8 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center transition-all hover:border-primary"
                    aria-label="Open pinned filters"
                >
                    <img src="/icons/filtre.png" alt="Filters" className="w-4 h-4" />
                </button>
            </div>

            <div className="sb-cell searchbar-actions">
                <button type="button" onClick={resetAll} title="Clear" className="searchbar-search-btn searchbar-search-btn--clear">
                    ✕
                </button>
                <button type="button" onClick={() => void triggerSearch()} aria-label="Search" className="searchbar-search-btn searchbar-search-btn--primary">
                    <svg aria-hidden="true" focusable="false" className="search-icon-svg" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" fill="none" />
                        <line x1="20.5" y1="20.5" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
        </div>
    )

    // MAIN filter panel: only MIN / MAX (render OUTSIDE the main wrapper)
    const mainFilterPanel = filtersOpen && filterVariant === "main" ? (
        <div
            id="karkey-filter-panel-main"
            role="dialog"
            aria-label="Advanced filters"
            className="custom-select-dropdown"
            style={{
                position: "fixed",
                zIndex: 60,
                top: filterPos ? `${filterPos.top}px` : `calc(var(--site-header-height) + 8px)`,
                left: filterPos ? `${filterPos.left}px` : "50%",
                transform: "translateX(-50%)",
                minWidth: "min(480px, 95vw)",
                animation: "none",
            }}
        >
            <div className="p-3 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-1">Condition</label>
                        <CustomMultiSelect
                            value={condition}
                            onChange={setCondition}
                            className="sb-dropdown-trigger-bordered text-[12px] h-8 min-h-[unset] py-1"
                            options={conditionsList}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-1">Min Price</label>
                        <div className="relative">
                            <input
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-full pl-2 pr-6 py-1.5 bg-white border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-[#00A651]/10 focus:border-[#00A651] transition-all professional-font h-8"
                                placeholder="0"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-bold professional-font">MAD</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-1">Max Price</label>
                        <div className="relative">
                            <input
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-full pl-2 pr-6 py-1.5 bg-white border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-[#00A651]/10 focus:border-[#00A651] transition-all professional-font h-8"
                                placeholder="Any"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-bold professional-font">MAD</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-100 px-1 pb-1">
                <button
                    onClick={() => setFiltersOpen(false)}
                    className="px-3 py-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 rounded-md transition-colors"
                >
                    Close
                </button>
                <button
                    onClick={() => { applyFilters(); setFilterVariant(null) }}
                    className="px-3 py-1.5 text-[11px] font-bold text-white bg-[#00A651] hover:bg-[#008f45] rounded-md shadow-sm shadow-[#00A651]/20 transition-all active:scale-[0.98]"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    ) : null

    // PINNED filter panel: show MIN/MAX plus the missing selects (render OUTSIDE)
    const pinnedFilterPanel = filtersOpen && filterVariant === "pinned" ? (
        <div
            id="karkey-filter-panel-pinned"
            role="dialog"
            aria-label="Advanced filters (pinned)"
            className="custom-select-dropdown"
            style={{
                position: "fixed",
                zIndex: 60,
                top: filterPos ? `${filterPos.top}px` : `calc(var(--site-header-height) + 8px)`,
                left: filterPos ? `${filterPos.left}px` : "50%",
                transform: "translateX(-50%)",
                minWidth: "min(320px, 95vw)",
                animation: "none",
            }}
        >
            <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-1">Year</label>
                        <CustomSelect
                            value={year}
                            onChange={setYear}
                            isAll={year === "All"}
                            className="sb-dropdown-trigger-bordered"
                            options={[
                                { value: "All", label: "All Years" },
                                ...effectiveYearsList.map((y) => ({ value: String(y), label: String(y) }))
                            ]}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-1">Fuel</label>
                        <CustomMultiSelect
                            value={fuel}
                            onChange={setFuel}
                            className="sb-dropdown-trigger-bordered"
                            options={fuelsList}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-1">Transmission</label>
                        <CustomSelect
                            value={transmission}
                            onChange={setTransmission}
                            isAll={transmission === "All"}
                            className="sb-dropdown-trigger-bordered"
                            options={[
                                { value: "All", label: "All Transmissions" },
                                ...transList.map((tr) => ({ value: tr.value, label: tr.label }))
                            ]}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-1">Condition</label>
                        <CustomMultiSelect
                            value={condition}
                            onChange={setCondition}
                            className="sb-dropdown-trigger-bordered"
                            options={conditionsList}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-1">Min Price</label>
                            <input
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00A651]/10 focus:border-[#00A651] transition-all professional-font"
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-1">Max Price</label>
                            <input
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00A651]/10 focus:border-[#00A651] transition-all professional-font"
                                placeholder="Any"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <button
                        onClick={() => setFiltersOpen(false)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-600 text-sm font-semibold transition-all hover:bg-gray-100"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => { applyFilters(); setFilterVariant(null) }}
                        className="flex-[1.5] px-4 py-2.5 rounded-xl bg-[#00A651] text-white text-sm font-semibold shadow-lg shadow-[#00A651]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
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

    const mobileInlineInner = (
        <div className="w-full max-w-md mx-auto px-4 pb-2">
            <div className="flex items-center gap-2 rounded-full border border-gray-100/20 bg-white/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,166,81,0.15)] px-4 py-3 transition-all">
                <input
                    type="text"
                    value={mobileQuery}
                    onChange={(e) => setMobileQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                            handleMobileSearch()
                        }
                    }}
                    placeholder={t("nav.search_placeholder") || "Search make, model, or type"}
                    className="flex-1 bg-transparent text-base text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none"
                    aria-label={t("nav.search_placeholder")}
                />
                {mobileQuery && (
                    <button
                        type="button"
                        onClick={() => setMobileQuery("")}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-[#475569] hover:bg-slate-100"
                    >
                        ✕
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleMobileSearch}
                    className="w-10 h-10 rounded-full bg-[#00A651] text-white flex items-center justify-center shadow-lg shadow-[#00A651]/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <svg aria-hidden="true" focusable="false" className="search-icon-svg" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
                        <line x1="20.5" y1="20.5" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
        </div>
    )

    // Unified pinned state to prevent double-rendering overlap
    const isPinnedState = pinned || showPinnedEarly

    return (
        <>
            {/* Main Search Bar (Desktop) - Animated */}
            {!isSmallScreen && (
                <SlideUp
                    ref={wrapperRef}
                    data-role="main-search"
                    className={`searchbar-floating py-2 ${className} main-search`}
                    data-pinned={isPinnedState ? "true" : "false"}
                    aria-hidden={isPinnedState}
                    delay={0.2}
                    style={{
                        position: "relative",
                        zIndex: isPinnedState ? undefined : 10020,
                        pointerEvents: isPinnedState ? "none" : "auto",
                        opacity: isPinnedState ? 0 : 1,
                        visibility: isPinnedState ? "hidden" : "visible",
                    }}
                >
                    {fullInner}
                </SlideUp>
            )}

            {/* Mobile Static (Initial) */}
            {isSmallScreen && !isPinnedState && (
                <div className={`searchbar-floating ${className} main-search relative z-[10020]`}>
                    {mobileInlineInner}
                </div>
            )}

            {/* Render filter panels as siblings so they float outside the main pill */}
            {mainFilterPanel}
            {pinnedFilterPanel}

            {isSmallScreen && isPinnedState && (
                <div
                    className="fixed left-1/2 z-[50000] w-full"
                    style={{
                        top: `calc(var(--site-header-height, 76px) + 8px)`,
                        transform: "translateX(-50%)",
                        opacity: isNavbarVisible ? 1 : 0,
                        pointerEvents: !isNavbarVisible ? "none" : "auto",
                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                >
                    <div className="px-4" style={{ width: "min(420px, 94vw)", margin: "0 auto" }}>
                        <div className="flex items-center gap-2 rounded-full border border-gray-100/20 bg-white/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,166,81,0.15)] px-4 py-2 transition-all">
                            <input
                                type="text"
                                value={mobileQuery}
                                onChange={(e) => setMobileQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        handleMobileSearch()
                                    }
                                }}
                                placeholder={t("nav.search_placeholder")}
                                className="flex-1 bg-transparent text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none"
                            />
                            {mobileQuery && (
                                <button type="button" onClick={() => setMobileQuery("")} className="w-7 h-7 rounded-full border border-[#e2e8f0] text-[#475569] text-xs">✕</button>
                            )}
                            <button type="button" onClick={handleMobileSearch} className="w-9 h-9 rounded-full bg-[#00A651] text-white flex items-center justify-center shadow-lg shadow-[#00A651]/20 hover:scale-105 active:scale-95 transition-all">
                                <svg aria-hidden="true" focusable="false" className="search-icon-svg" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" fill="none" />
                                    <line x1="20.5" y1="20.5" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* pinned search: desktop */}
            {!isSmallScreen && isPinnedState && (
                <div
                    className="fixed pointer-events-none transition-all duration-400 ease-in-out"
                    style={{
                        left: "50%",
                        top: `calc(var(--pinned-top, var(--site-header-height, 76px)) + 12px)`,
                        zIndex: 10010,
                        transform: `translateX(-50%) ${!isNavbarVisible ? "translateY(-150%) scale(0.9)" : "translateY(0) scale(1)"}`,
                        opacity: !isNavbarVisible ? 0 : 1,
                    }}
                >
                    <div className="searchbar-floating px-3 py-2 pointer-events-auto border-transparent shadow-[0_8px_32px_rgba(0,166,81,0.10)]">
                        {compactInner}
                    </div>
                </div>
            )}
        </>
    )
}
