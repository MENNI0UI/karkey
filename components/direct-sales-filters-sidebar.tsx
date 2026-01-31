"use client"

import { useEffect, useState, useMemo, useCallback, forwardRef, useImperativeHandle } from "react"
import { SlidersHorizontal, RotateCcw, Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslation } from "@/lib/i18n-context"
import { FilterSection } from "@/components/direct-sales/filters/filter-section"
import { FilterChips } from "@/components/direct-sales/filters/filter-chips"
import { FilterColors } from "@/components/direct-sales/filters/filter-colors"
import { FilterRange } from "@/components/direct-sales/filters/filter-range"
import CustomMultiSelect from "@/components/ui/custom-multi-select"
import {
  normalizeConditionOptions,
  normalizeFuelOptions,
  DEFAULTS,
  DirectSalesFilterOptions,
  canonicalizeParams
} from "@/lib/filter-utils"
import { useSavedSearch } from "@/lib/saved-search-manager"

// Helper to normalize values for comparison
const normalize = (val: string) => val ? val.trim().toLowerCase() : ""

export interface DirectSalesFiltersSidebarRef {
  applyFilters: () => void;
}

export const DirectSalesFiltersSidebar = forwardRef<
  DirectSalesFiltersSidebarRef,
  {
    options?: DirectSalesFilterOptions;
    className?: string;
    mobile?: boolean;
    initialSavedState?: { isMatch: boolean; savedId: number | null; paramsStr: string | null };
  }
>(({
  options,
  className,
  mobile = false,
  initialSavedState
}, ref) => {
  const { t, language } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Use unified saved search hook - complete isolation from auctions
  // Pass initialSavedState to prevent flash of unsaved button
  const { isSavedActive, toggleSave, isLoading: savedSearchLoading } = useSavedSearch(
    'direct-sales',
    searchParams,
    language,
    t,
    initialSavedState
  )

  // --- Dynamic Options ---
  const conditionOptions = useMemo(() => normalizeConditionOptions(options?.conditions), [options?.conditions])
  const fuelOptions = useMemo(() => normalizeFuelOptions(options?.fuelTypes), [options?.fuelTypes])
  const makes = options?.makes?.length ? options!.makes : DEFAULTS.makes
  const years = options?.years?.length ? options!.years : DEFAULTS.years
  const transmissions = options?.transmissions?.length ? options!.transmissions : DEFAULTS.transmissions
  const locations = options?.locations?.length ? options!.locations : DEFAULTS.locations
  const doorOptions = DEFAULTS.doors

  // --- URL State Helpers ---
  const getParam = (key: string) => normalize(searchParams.get(key) ?? "")
  const getParams = (key: string) => (searchParams.getAll(key) ?? []).map(normalize).filter(Boolean)

  const pushParams = useCallback((newParams: URLSearchParams) => {
    const keys = Array.from(newParams.keys())
    for (const key of keys) {
      const vals = newParams.getAll(key)
      if (vals.length === 0 || (vals.length === 1 && (vals[0] === "" || normalize(vals[0]) === "all"))) {
        newParams.delete(key)
      }
    }
    const qs = canonicalizeParams(newParams)
    router.push(`/${language}/direct-sales?${qs}`, { scroll: false })
  }, [language, router])

  // --- Consolidated Local State for ALL Filters (Debounced) ---
  // This prevents immediate server roundtrips on every checkbox click
  const [localFilters, setLocalFilters] = useState({
    make: getParams("make"),
    model: getParams("model"),
    year: getParams("year"),
    fuel: getParams("fuel"),
    transmission: getParams("transmission"),
    condition: getParams("condition"),
    location: getParams("location"),
    doors: getParams("doors"),
    exteriorColor: getParams("exteriorColor"),
    interiorColor: getParams("interiorColor"),
    originalPaint: getParam("originalPaint"),
    minPrice: getParam("minPrice"),
    maxPrice: getParam("maxPrice"),
    minMileage: getParam("minMileage"),
    maxMileage: getParam("maxMileage"),
    minEngine: getParam("minEngine"),
    maxEngine: getParam("maxEngine"),
  })

  // Sync from URL changes (active external navigation/back button)
  useEffect(() => {
    setLocalFilters({
      make: getParams("make"),
      model: getParams("model"),
      year: getParams("year"),
      fuel: getParams("fuel"),
      transmission: getParams("transmission"),
      condition: getParams("condition"),
      location: getParams("location"),
      doors: getParams("doors"),
      exteriorColor: getParams("exteriorColor"),
      interiorColor: getParams("interiorColor"),
      originalPaint: getParam("originalPaint"),
      minPrice: getParam("minPrice"),
      maxPrice: getParam("maxPrice"),
      minMileage: getParam("minMileage"),
      maxMileage: getParam("maxMileage"),
      minEngine: getParam("minEngine"),
      maxEngine: getParam("maxEngine"),
    })
  }, [searchParams])

  // Debounced URL Update
  useEffect(() => {
    // On mobile, we wait for manual apply (via ref)
    if (mobile) return

    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString())

      // Helper to cleanup and set params
      const apply = (key: string, val: string | string[]) => {
        next.delete(key)
        if (Array.isArray(val)) {
          val.forEach(v => {
            if (v && normalize(v) !== "all") next.append(key, normalize(v))
          })
        } else {
          if (val && normalize(val) !== "all") next.set(key, normalize(val))
        }
      }

      Object.entries(localFilters).forEach(([key, val]) => apply(key, val))

      const currentQs = canonicalizeParams(searchParams)
      const nextQs = canonicalizeParams(next)

      if (currentQs !== nextQs) {
        pushParams(next)
      }
    }, 800) // 800ms delay feels responsive but batches quick clicks

    return () => clearTimeout(timer)
  }, [localFilters, pushParams, searchParams, mobile])

  const applyFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString())
    const apply = (key: string, val: string | string[]) => {
      next.delete(key)
      if (Array.isArray(val)) {
        val.forEach(v => {
          if (v && normalize(v) !== "all") next.append(key, normalize(v))
        })
      } else {
        if (val && normalize(val) !== "all") next.set(key, normalize(val))
      }
    }
    Object.entries(localFilters).forEach(([key, val]) => apply(key, val))
    pushParams(next)
  }, [localFilters, pushParams, searchParams])

  useImperativeHandle(ref, () => ({
    applyFilters
  }));

  // --- Handlers updating LOCAL state only ---

  const updateLocal = (key: keyof typeof localFilters, val: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: val }))
  }

  const toggleLocal = (key: keyof typeof localFilters, val: string) => {
    const norm = normalize(val)
    setLocalFilters(prev => {
      const current = prev[key] as string[]
      const exists = current.includes(norm)
      const next = exists
        ? current.filter(v => v !== norm)
        : [...current, norm]
      return { ...prev, [key]: next }
    })
  }

  // --- Derived Models logic (Now uses instant local state!) ---
  const selectedMakes = localFilters.make
  const filteredModels = useMemo(() => {
    if (selectedMakes.length === 0) return options?.models ?? DEFAULTS.models

    // Logic to filter models based on selected makes
    const mm = options?.makeModels as Record<string, string[]> || {}
    const combined = new Set<string>()
    let found = false

    selectedMakes.forEach(m => {
      const k = Object.keys(mm).find(key => normalize(key) === m)
      if (k && mm[k]) {
        mm[k].forEach(mod => combined.add(mod))
        found = true
      } else if (mm[m]) {
        mm[m].forEach(mod => combined.add(mod))
        found = true
      }
    })

    if (found) return Array.from(combined).sort()
    return options?.models ?? DEFAULTS.models
  }, [selectedMakes, options?.makeModels, options?.models])


  // --- Results Count Logic (Debounced fetch) ---
  const [resultCount, setResultCount] = useState<number | null>(null)

  useEffect(() => {
    // Only fetch count if we have localFilters (state is ready)
    if (!localFilters) return

    const fetchCount = async () => {
      // Build temp query string from LOCAL filters to show predicted count
      const next = new URLSearchParams()
      Object.entries(localFilters).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          val.forEach(v => { if (v && normalize(v) !== "all") next.append(key, normalize(v)) })
        } else {
          if (val && normalize(val) !== "all") next.set(key, normalize(val))
        }
      })

      const qs = canonicalizeParams(next)
      const url = qs ? `/api/direct-sales/approved?${qs}` : `/api/direct-sales/approved`

      try {
        const res = await fetch(url, { cache: "no-store" })
        if (res.ok) {
          const data = await res.json().catch(() => null)
          if (data) {
            const arr = data.vehicles || data.results || []
            setResultCount(arr.length)
            if (typeof data.totalCount === 'number') setResultCount(data.totalCount)
          }
        }
      } catch { }
    }
    const t = setTimeout(fetchCount, 800) // longer debounce for network
    return () => clearTimeout(t)
  }, [localFilters]) // Fetch count based on LOCAL changes

  const resetFilters = () => {
    setResultCount(null)
    router.push(`/${language}/direct-sales?reset=true`)
  }


  // --- Collapsible UI ---
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('sidebar-collapsed-direct-sales')
    return saved ? JSON.parse(saved) : false
  })
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const updateCollapsed = (val: boolean) => {
    setCollapsed(val)
    localStorage.setItem('sidebar-collapsed-direct-sales', JSON.stringify(val))
  }

  const asideClass = mobile
    ? `w-full max-w-full bg-white border border-[#e5e7eb] rounded-none shadow-sm relative flex flex-col ${className ?? ""}`
    : `hidden lg:flex ${collapsed ? "w-[60px]" : "w-full max-w-full lg:w-[320px] xl:w-[360px] 2xl:w-[400px] 3xl:w-[450px] 4xl:w-[500px]"} bg-white border border-[#e5e7eb] border-t-0 rounded-none shadow-sm relative lg:sticky lg:top-[var(--site-header-height,76px)] lg:h-[calc(100vh-var(--site-header-height,76px))] flex-col ${mounted ? "transition-all duration-300" : ""} ${className ?? ""}`

  if (!mobile && collapsed) {
    return (
      <aside className={asideClass} style={{ zIndex: 120 }}>
        <div className="flex flex-col items-center py-5 h-full cursor-pointer hover:bg-gray-50/80 transition-colors duration-300" onClick={() => updateCollapsed(false)}>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-b from-white to-gray-50 border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] text-gray-400 hover:text-[#B8071C] hover:border-[#B8071C]/20 hover:shadow-[0_2px_8px_rgba(184,7,28,0.1)] transition-all duration-300">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside className={asideClass} style={{ zIndex: 120 }}>
      {/* Header with Save Search & Hide */}
      <div className="flex items-center px-4 pt-4 pb-3 gap-3">
        <div className="w-full">
          <div className={`rounded-2xl px-3.5 py-3 shadow-sm border border-transparent transition-all duration-300 ${isSavedActive ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50/50 border-gray-100 hover:bg-gray-100/50'}`}>
            <div
              role="button"
              tabIndex={0}
              onClick={toggleSave}
              className="flex items-center justify-between w-full gap-3 select-none cursor-pointer group"
            >
              <span className={`text-[13px] font-bold font-serif tracking-tight transition-colors ${isSavedActive ? 'text-[#00A651]' : 'text-gray-600 group-hover:text-gray-900'}`}>{t("filters.save_search")}</span>
              <span className={`relative inline-flex items-center w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 shadow-inner ${isSavedActive ? 'bg-[#00A651]' : 'bg-gray-300 group-hover:bg-gray-400'}`}>
                <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isSavedActive ? 'translate-x-5' : 'translate-x-0'}`}></span>
              </span>
            </div>
          </div>
        </div>
        {!mobile && (
          <button
            onClick={() => updateCollapsed(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-b from-white to-gray-50 border border-gray-200/80 shadow-sm text-gray-400 hover:text-[#B8071C] hover:border-[#B8071C]/20 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
      </div>

      <div className="border-t border-[#f3f4f6]" />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">

        {/* Make */}
        <FilterSection title={t("filters.make")}>
          <CustomMultiSelect
            value={localFilters.make}
            onChange={(val) => updateLocal("make", val)}
            options={makes.map(m => ({
              value: m.toLowerCase(),
              label: options?.makeCounts?.[m] ? `${m} (${options.makeCounts[m]})` : m
            }))}
            placeholder={t("filters.any")}
            className="sb-dropdown-trigger-bordered"
          />
        </FilterSection>

        {/* Model */}
        <FilterSection title={t("filters.model")}>
          <CustomMultiSelect
            value={localFilters.model}
            onChange={(val) => updateLocal("model", val)}
            options={filteredModels.map(m => ({
              value: m.toLowerCase(),
              label: options?.modelCounts?.[m] ? `${m} (${options.modelCounts[m]})` : m
            }))}
            disabled={selectedMakes.length === 0 && !options?.models?.length}
            placeholder={t("filters.any")}
            className="sb-dropdown-trigger-bordered"
          />
        </FilterSection>

        {/* Year */}
        <FilterSection title={t("filters.year")}>
          <CustomMultiSelect
            value={localFilters.year}
            onChange={(val) => updateLocal("year", val)}
            options={years.map(y => ({ value: String(y), label: String(y) }))}
            placeholder={t("filters.any")}
            className="sb-dropdown-trigger-bordered"
          />
        </FilterSection>

        {/* Price Range */}
        <FilterSection title={t("filters.price_range")}>
          <FilterRange
            min={localFilters.minPrice} max={localFilters.maxPrice}
            onChangeMin={(v) => updateLocal("minPrice", v)}
            onChangeMax={(v) => updateLocal("maxPrice", v)}
            minPlaceholder="0" maxPlaceholder="1000000"
            step="1000"
          />
        </FilterSection>

        {/* Fuel */}
        <FilterSection title={t("filters.fuel")}>
          <FilterChips
            options={fuelOptions.map(opt => ({
              value: opt.value,
              label: ["petrol", "gasoline", "diesel", "electric", "hybrid"].includes(opt.value.toLowerCase())
                ? t(`vehicle.fuel.${opt.value.toLowerCase()}` as any)
                : opt.label
            }))}
            selected={localFilters.fuel}
            onToggle={(v) => toggleLocal("fuel", v)}
            onClear={() => updateLocal("fuel", [])}
            anyLabel={t("filters.any")}
            colorTheme="green"
          />
        </FilterSection>

        {/* Transmission */}
        <FilterSection title={t("filters.transmission")}>
          <FilterChips
            options={transmissions.map(tVal => ({
              value: tVal,
              label: t(`vehicle.transmission.${tVal.toLowerCase()}` as any)
            }))}
            selected={localFilters.transmission}
            onToggle={(v) => toggleLocal("transmission", v)}
            onClear={() => updateLocal("transmission", [])}
            anyLabel={t("filters.any")}
          />
        </FilterSection>

        {/* Location */}
        <FilterSection title={t("filters.location_label")}>
          <CustomMultiSelect
            value={localFilters.location}
            onChange={(val) => updateLocal("location", val)}
            options={locations.map(l => ({
              value: String(l).toLowerCase(),
              label: t(`location.city.${String(l).toLowerCase().replace(/\s+/g, '')}` as any) || String(l)
            }))}
            placeholder={t("filters.any")}
            className="sb-dropdown-trigger-bordered"
          />
        </FilterSection>

        {/* Condition */}
        <FilterSection title={t("filters.condition")}>
          <FilterChips
            options={conditionOptions.map(c => ({
              value: c.value,
              label: t(`vehicle.condition.${c.value.toLowerCase()}` as any)
            }))}
            selected={localFilters.condition}
            onToggle={(v) => toggleLocal("condition", v)}
            onClear={() => updateLocal("condition", [])}
            anyLabel={t("filters.any")}
            colorTheme="green"
          />
        </FilterSection>

        {/* Mileage */}
        <FilterSection title={t("filters.mileage_range") || "Mileage"}>
          <FilterRange
            min={localFilters.minMileage} max={localFilters.maxMileage}
            onChangeMin={(v) => updateLocal("minMileage", v)}
            onChangeMax={(v) => updateLocal("maxMileage", v)}
            minPlaceholder="0" maxPlaceholder="200000"
            labelMin={t("filters.min_mileage")} labelMax={t("filters.max_mileage")}
            step="5000"
          />
        </FilterSection>

        {/* Engine */}
        <FilterSection title={t("filters.engine_size") || "Engine"}>
          <FilterRange
            min={localFilters.minEngine} max={localFilters.maxEngine}
            onChangeMin={(v) => updateLocal("minEngine", v)}
            onChangeMax={(v) => updateLocal("maxEngine", v)}
            minPlaceholder="1.0" maxPlaceholder="6.0"
            labelMin={t("filters.min_engine")} labelMax={t("filters.max_engine")}
            step="0.1"
          />
        </FilterSection>

        {/* Doors */}
        <FilterSection title={t("filters.how_many_doors")}>
          <FilterChips
            options={doorOptions.map(d => ({ value: String(d), label: String(d) }))}
            selected={localFilters.doors}
            onToggle={(v) => toggleLocal("doors", v)}
            onClear={() => updateLocal("doors", [])}
            anyLabel={t("filters.any")}
          />
        </FilterSection>

        {/* Colors */}
        <FilterSection title={t("wizard.fields.exterior_color")}>
          <FilterColors
            selected={localFilters.exteriorColor}
            onToggle={(v) => toggleLocal("exteriorColor", v)}
            onClear={() => updateLocal("exteriorColor", [])}
            anyLabel={t("filters.any")}
          />
        </FilterSection>

        <FilterSection title={t("wizard.fields.interior_color")}>
          <FilterColors
            selected={localFilters.interiorColor}
            onToggle={(v) => toggleLocal("interiorColor", v)}
            onClear={() => updateLocal("interiorColor", [])}
            anyLabel={t("filters.any")}
          />
        </FilterSection>

        {/* Original Paint */}
        <FilterSection title={t("wizard.fields.original_paint")}>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateLocal("originalPaint", "yes")}
              className={`px-3 py-1.5 rounded-full border text-sm font-medium font-serif transition-colors touch-action-manipulation cursor-pointer ${localFilters.originalPaint === "yes"
                ? "bg-[#B8071C] text-white border-[#B8071C]"
                : "text-[#111827] border-[#d1d5db] lg:hover:border-[#B8071C]"
                }`}
            >
              {t("filters.yes")}
            </button>
            <button
              type="button"
              onClick={() => updateLocal("originalPaint", "no")}
              className={`px-3 py-1.5 rounded-full border text-sm font-medium font-serif transition-colors touch-action-manipulation cursor-pointer ${localFilters.originalPaint === "no"
                ? "bg-[#B8071C] text-white border-[#B8071C]"
                : "text-[#111827] border-[#d1d5db] lg:hover:border-[#B8071C]"
                }`}
            >
              {t("filters.no")}
            </button>
            <button
              type="button"
              onClick={() => updateLocal("originalPaint", "All")}
              className={`px-3 py-1.5 rounded-full border text-sm font-medium font-serif transition-colors touch-action-manipulation cursor-pointer ${!["yes", "no"].includes(localFilters.originalPaint)
                ? "bg-[#B8071C] text-white border-[#B8071C]"
                : "text-[#111827] border-[#d1d5db] lg:hover:border-[#B8071C]"
                }`}
            >
              {t("filters.any")}
            </button>
          </div>
        </FilterSection>

      </div>

      {/* Persistent Footer */}
      <div className="px-4 py-4 border-t bg-white/80 backdrop-blur-sm sticky bottom-0">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="w-full bg-gradient-to-r from-[#00A651] to-[#018E44] text-white text-sm font-bold py-3.5 rounded-xl shadow-[0_4px_12px_rgba(0,166,81,0.25)] hover:shadow-[0_6px_16px_rgba(0,166,81,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2.5 group"
          >
            <Search className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span className="font-serif tracking-wide">
              {resultCount === null ? "..." : `${resultCount} ${t("nav.direct_sales") || "Direct Sales"}`}
            </span>
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="group w-full flex items-center justify-center gap-2 py-2 text-[13px] font-semibold text-gray-500 hover:text-[#B8071C] transition-colors duration-300"
          >
            <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-90 transition-transform duration-500" />
            <span className="font-serif underline-offset-4 group-hover:underline">{t("filters.reset")}</span>
          </button>
        </div>
      </div>
    </aside>
  )
})

DirectSalesFiltersSidebar.displayName = "DirectSalesFiltersSidebar"
