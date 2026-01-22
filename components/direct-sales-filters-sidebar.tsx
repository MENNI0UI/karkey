"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { useToast } from '@/hooks/use-toast'

import { useTranslation } from "@/lib/i18n-context"
import { CAR_COLORS } from "@/lib/car-colors"
import CustomMultiSelect from "@/components/ui/custom-multi-select"
import {
  ConditionOption,
  DEFAULT_CONDITION_OPTIONS,
  DEFAULTS,
  normalizeConditionOptions,
  normalizeConditionValue,
  canonicalizeParams,
  normalizeFuelOptions,
  paramsToObject,
  parseParams
} from "@/lib/filter-utils"
import { clearSavedSearchCookie } from "@/lib/saved-search-utils"

export type DirectSalesFilterOptions = {
  makes?: string[]
  models?: string[]
  makeModels?: Record<string, string[]>
  years?: Array<string | number>
  fuelTypes?: Array<{ value: string; label: string } | string>
  transmissions?: string[]
  locations?: string[]
  conditions?: Array<{ value: string; label: string } | string>
  minPrice?: number
  maxPrice?: number
}

type SidebarState = {
  make: string[]
  model: string[]
  year: string[]
  fuel: string[]
  transmission: string[]
  location: string[]
  minMileage: string
  maxMileage: string
  minEngine: string
  maxEngine: string
  condition: string[]
  doors: string[]
  minPrice: string
  maxPrice: string
  exteriorColor: string[]
  interiorColor: string[]
  originalPaint: string
}

const DEFAULT_STATE: SidebarState = {
  make: [],
  model: [],
  year: [],
  fuel: [],
  transmission: [],
  location: [],
  minMileage: "",
  maxMileage: "",
  minEngine: "",
  maxEngine: "",
  condition: [],
  doors: [],
  minPrice: "",
  maxPrice: "",
  exteriorColor: [],
  interiorColor: [],
  originalPaint: "All",
}



export function DirectSalesFiltersSidebar({ options, className, mobile = false, savedParamsString, setSavedParamsString, isSavedActive, setIsSavedActive, isLoaded, setIsLoaded, initialSavedId }: { options?: DirectSalesFilterOptions; className?: string; mobile?: boolean; savedParamsString?: string | null; setSavedParamsString?: (v: string | null) => void; isSavedActive?: boolean; setIsSavedActive?: (v: boolean) => void; isLoaded?: boolean; setIsLoaded?: (v: boolean) => void; initialSavedId?: number | null }) {
  const { t, language } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()

  const conditionOptions = useMemo(() => normalizeConditionOptions(options?.conditions), [options?.conditions])
  const [state, setState] = useState<SidebarState>(() => {
    const current = new URLSearchParams(searchParams?.toString())
    const getVal = (key: string) => {
      const vals = searchParams?.getAll(key) || []
      return vals.filter(v => v.toLowerCase() !== "all")
    }

    return {
      make: getVal("make"),
      model: getVal("model"),
      year: getVal("year"),
      fuel: getVal("fuel"),
      transmission: getVal("transmission"),
      location: getVal("location"),
      minMileage: current.get("minMileage") ?? "",
      maxMileage: current.get("maxMileage") ?? "",
      minEngine: current.get("minEngine") ?? "",
      maxEngine: current.get("maxEngine") ?? "",
      condition: getVal("condition").map(c => normalizeConditionValue(c, conditionOptions)).filter(c => c !== "All"),
      doors: getVal("doors"),
      minPrice: current.get("minPrice") ?? "",
      maxPrice: current.get("maxPrice") ?? "",
      exteriorColor: getVal("exteriorColor"),
      interiorColor: getVal("interiorColor"),
      originalPaint: current.get("originalPaint") ?? "All",
    }
  })

  useEffect(() => {
    const getVal = (key: string) => {
      const vals = searchParams?.getAll(key) || []
      return vals.filter(v => v.toLowerCase() !== "all")
    }

    setState(prev => {
      const next: SidebarState = {
        make: getVal("make"),
        model: getVal("model"),
        year: getVal("year"),
        fuel: getVal("fuel"),
        transmission: getVal("transmission"),
        location: getVal("location"),
        minMileage: searchParams?.get("minMileage") ?? "",
        maxMileage: searchParams?.get("maxMileage") ?? "",
        minEngine: searchParams?.get("minEngine") ?? "",
        maxEngine: searchParams?.get("maxEngine") ?? "",
        condition: getVal("condition").map(c => normalizeConditionValue(c, conditionOptions)).filter(c => c !== "All"),
        doors: getVal("doors"),
        minPrice: searchParams?.get("minPrice") ?? "",
        maxPrice: searchParams?.get("maxPrice") ?? "",
        exteriorColor: getVal("exteriorColor"),
        interiorColor: getVal("interiorColor"),
        originalPaint: searchParams?.get("originalPaint") ?? "All",
      }

      const changed = JSON.stringify(prev) !== JSON.stringify(next)
      return changed ? next : prev
    })
  }, [searchParams, conditionOptions])

  const makes = options?.makes?.length ? options!.makes : DEFAULTS.makes
  // compute available models depending on selected make (if provided via options.makeModels)
  const models = (() => {
    try {
      const selRaw = String(state.make ?? "").trim()
      if (selRaw && selRaw !== "All" && options?.makeModels) {
        const mm = options.makeModels as Record<string, string[]>
        const normalize = (s: string) => String(s || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "")
        const target = normalize(selRaw)
        // try exact key, lowercase key, and normalized match across keys
        if (mm[selRaw]) return mm[selRaw]
        if (mm[selRaw.toLowerCase()]) return mm[selRaw.toLowerCase()]
        for (const k of Object.keys(mm)) {
          if (normalize(k) === target) return mm[k]
        }
        // also try matching where the models array contains the name (some mappings are reversed)
        for (const k of Object.keys(mm)) {
          const arr = mm[k] ?? []
          for (const m of arr) {
            if (normalize(m) === target) return arr
          }
        }
      }
    } catch { }
    return options?.models?.length ? options!.models : DEFAULTS.models
  })()

  // decide which models to render in the Model select (only show related ones when a make selected)
  const modelsToShow = (() => {
    try {
      const selectedMakes = state.make && state.make.length > 0 ? state.make : []
      if (selectedMakes.length > 0) {
        // iterate all selected makes and collect their models
        const combinedModels = new Set<string>()
        const mm = options?.makeModels ?? {}
        const hasMap = Object.keys(mm).length > 0
        const normalize = (s: string) => String(s || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "")

        if (hasMap) {
          selectedMakes.forEach(sel => {
            if (sel === "All") return
            const target = normalize(sel)

            // direct check
            if (mm[sel]) { mm[sel].forEach(m => combinedModels.add(m)); return }
            if (mm[sel.toLowerCase()]) { mm[sel.toLowerCase()].forEach(m => combinedModels.add(m)); return }

            // scan keys
            for (const k of Object.keys(mm)) {
              if (normalize(k) === target) {
                mm[k].forEach(m => combinedModels.add(m))
              }
            }
          })
          // if we found models, return them
          if (combinedModels.size > 0) return Array.from(combinedModels).sort()
          return []
        }

        // fallback heuristic
        try {
          const fallbackModels = new Set<string>()
          selectedMakes.forEach(sel => {
            if (sel === "All") return
            const lower = sel.toLowerCase()
              ; (options?.models ?? DEFAULTS.models).forEach(m => {
                if (String(m).toLowerCase().includes(lower)) fallbackModels.add(String(m))
              })
          })
          return fallbackModels.size > 0 ? Array.from(fallbackModels).sort() : []
        } catch { return [] }
      }
    } catch { }
    return options?.models?.length ? options!.models : DEFAULTS.models
  })()
  const years = options?.years?.length ? options!.years : DEFAULTS.years
  const transmissions = options?.transmissions?.length ? options!.transmissions : DEFAULTS.transmissions
  const locations = options?.locations?.length ? options!.locations : DEFAULTS.locations
  const doorOptions = DEFAULTS.doors
  const fuelOptions = useMemo(() => normalizeFuelOptions(options?.fuelTypes), [options?.fuelTypes])

  const { toast } = useToast()

  const updateField = (key: keyof SidebarState, value: string | string[]) => {
    setState(prev => ({ ...prev, [key]: value, ...(key === "make" ? { model: [] } : {}) }))
  }

  // If a make is selected that does not include the current model, reset model to All.
  useEffect(() => {
    try {
      if (state.make.length === 0) return
      const map = options?.makeModels ?? {}
      const allAllowedModels = new Set<string>()
      state.make.forEach(m => {
        const key = String(m).toLowerCase()
          ; (map[key] ?? []).forEach(mod => allAllowedModels.add(String(mod).trim().toLowerCase()))
      })

      if (state.model.length > 0) {
        const nextModels = state.model.filter(m => allAllowedModels.has(String(m).trim().toLowerCase()))
        if (nextModels.length !== state.model.length) {
          setState(prev => ({ ...prev, model: nextModels }))
        }
      }
    } catch { }
  }, [state.make, options?.makeModels])

  const buildParams = () => {
    const params = new URLSearchParams()

    const addParam = (key: string, val: string | string[]) => {
      if (Array.isArray(val)) {
        val.forEach(v => {
          if (v && v !== "All") params.append(key, v)
        })
      } else if (val && val !== "All" && val.trim() !== "") {
        params.set(key, val.trim())
      }
    }

    addParam("make", state.make)
    addParam("model", state.model)
    addParam("year", state.year)
    addParam("fuel", state.fuel)
    addParam("transmission", state.transmission)
    addParam("location", state.location)
    addParam("minMileage", state.minMileage)
    addParam("maxMileage", state.maxMileage)
    addParam("minEngine", state.minEngine)
    addParam("maxEngine", state.maxEngine)
    addParam("condition", state.condition)
    addParam("doors", state.doors)
    addParam("minPrice", state.minPrice)
    addParam("maxPrice", state.maxPrice)
    addParam("exteriorColor", state.exteriorColor)
    addParam("interiorColor", state.interiorColor)
    addParam("originalPaint", state.originalPaint)
    return params
  }

  const prefetchSearch = (paramString: string) => {
    try {
      const url = paramString ? `/api/direct-sales/approved?${paramString}` : `/api/direct-sales/approved`
      if (typeof window !== "undefined" && typeof window.fetch === "function") {
        fetch(url, { cache: "no-store" })
          .then(res => (res.ok ? res.json().catch(() => null) : null))
          .then(data => {
            if (!data) return
            try {
              sessionStorage.setItem(`direct_sales_search_prefetch:v3:${paramString}`, JSON.stringify({ ts: Date.now(), data }))
              try {
                const computed = extractCountFromPayload(data)
                if (typeof setResultCount === "function" && computed !== null) setResultCount(computed)
              } catch { }
            } catch { }
          })
          .catch(() => { })
      }
    } catch { }
  }

  const extractCountFromPayload = (data: any): number | null => {
    if (!data) return null
    if (data && typeof data === 'object') {
      if (typeof data.total === 'number') return data.total
      if (typeof data.count === 'number') return data.count
      if (typeof data.totalCount === 'number') return data.totalCount
      if (data?.meta && typeof data.meta.total === 'number') return data.meta.total
    }
    const candidates = [data?.direct_sales, data?.results, data?.vehicles, data]
    for (const c of candidates) {
      if (Array.isArray(c)) return c.length
      if (c && typeof c === 'object') {
        if (typeof c.total === 'number') return c.total
        if (typeof c.count === 'number') return c.count
        if (typeof c.totalCount === 'number') return c.totalCount
        if (c?.meta && typeof c.meta.total === 'number') return c.meta.total
      }
    }
    return null
  }

  const fetchAndSetCount = async (paramString: string) => {
    try {
      const url = paramString ? `/api/direct-sales/approved?${paramString}` : `/api/direct-sales/approved`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json().catch(() => null)
      if (typeof data?.totalCount === 'number') {
        if (typeof setResultCount === 'function') setResultCount(data.totalCount)
      } else {
        const cnt = extractCountFromPayload(data)
        if (typeof setResultCount === 'function') setResultCount(cnt === null ? 0 : cnt)
      }
      try {
        sessionStorage.setItem(`direct_sales_search_prefetch:${paramString}`, JSON.stringify({ ts: Date.now(), data }))
      } catch { }
    } catch { }
  }

  const [resultCount, setResultCount] = useState<number | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const debounceRef = useRef<number | null>(null)

  // Fetch initial count on mount
  useEffect(() => {
    const fetchInitialCount = async () => {
      try {
        const params = buildParams()
        const paramString = params.toString()
        const url = paramString ? `/api/direct-sales/approved?${paramString}` : `/api/direct-sales/approved`
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        if (!data) return
        if (typeof data.totalCount === 'number') {
          setResultCount(data.totalCount)
        } else {
          const payload = data?.results ?? data?.vehicles ?? data
          const len = Array.isArray(payload) ? payload.length : null
          if (len !== null) setResultCount(len)
        }
      } catch { }
    }
    fetchInitialCount()
  }, [])

  // Saved-search state
  // Saved-search state (optional controlled props with internal fallbacks)
  // Hydrate saved search state
  const [savedId, setSavedId] = useState<number | null>(initialSavedId ?? null)
  const [internalSavedParamsString, setInternalSavedParamsString] = useState<string | null>(initialSavedId ? (savedParamsString ?? null) : null)
  const [internalIsSavedActive, setInternalIsSavedActive] = useState<boolean>(!!initialSavedId)
  const [internalIsLoaded, setInternalIsLoaded] = useState<boolean>(false)
  const [authChecked, setAuthChecked] = useState<boolean>(false)

  const _savedParamsString = typeof savedParamsString !== "undefined" ? savedParamsString : internalSavedParamsString
  const _setSavedParamsString = setSavedParamsString ?? setInternalSavedParamsString
  const _isSavedActive = typeof isSavedActive !== "undefined" ? isSavedActive : internalIsSavedActive
  const _setIsSavedActive = setIsSavedActive ?? setInternalIsSavedActive
  const _isLoaded = typeof isLoaded !== "undefined" ? isLoaded : internalIsLoaded
  const _setIsLoaded = setIsLoaded ?? setInternalIsLoaded

  const paramsToString = (p?: URLSearchParams) => (p ?? buildParams()).toString()

  const hasFiltersSelected = () => {
    return paramsToString() !== ""
  }

  const mapParamsToState = (obj: Record<string, any>): Partial<SidebarState> => {
    const next: Partial<SidebarState> = {}

    const getVal = (val: any) => {
      if (!val) return []
      if (Array.isArray(val)) return val.filter(v => v && v.toLowerCase() !== "all")
      const s = String(val).trim()
      return (s && s.toLowerCase() !== "all") ? [s] : []
    }

    if (obj.make) next.make = getVal(obj.make)
    if (obj.model) next.model = getVal(obj.model)
    if (obj.year) next.year = getVal(obj.year)
    if (obj.fuel) next.fuel = getVal(obj.fuel)
    if (obj.transmission) next.transmission = getVal(obj.transmission)
    if (obj.location) next.location = getVal(obj.location)
    if (obj.minMileage) next.minMileage = String(obj.minMileage)
    if (obj.maxMileage) next.maxMileage = String(obj.maxMileage)
    if (obj.minEngine) next.minEngine = String(obj.minEngine)
    if (obj.maxEngine) next.maxEngine = String(obj.maxEngine)
    if (obj.condition) next.condition = getVal(obj.condition).map(c => normalizeConditionValue(c, conditionOptions)).filter(c => c !== "All")
    if (obj.doors) next.doors = getVal(obj.doors)
    if (obj.minPrice) next.minPrice = String(obj.minPrice)
    if (obj.maxPrice) next.maxPrice = String(obj.maxPrice)
    if (obj.exteriorColor) next.exteriorColor = getVal(obj.exteriorColor)
    if (obj.interiorColor) next.interiorColor = getVal(obj.interiorColor)
    if (obj.originalPaint) next.originalPaint = String(obj.originalPaint)
    return next
  }

  const tryReadStoredCount = (paramString: string) => {
    try {
      if (typeof window === "undefined") return null
      const raw = sessionStorage.getItem(`direct_sales_search_prefetch:${paramString}`)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      const payload = parsed?.data ?? parsed
      if (payload && typeof payload === 'object') {
        if (typeof payload.total === 'number') return payload.total
        if (typeof payload.count === 'number') return payload.count
        if (payload?.meta && typeof payload.meta.total === 'number') return payload.meta.total
      }
      const candidates = [payload?.direct_sales, payload?.results, payload?.vehicles, payload]
      for (const c of candidates) {
        if (Array.isArray(c)) return c.length
      }
      return null
    } catch { return null }
  }

  const markInProgress = (paramString: string) => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem(`search_in_progress:${paramString}`, JSON.stringify({ ts: Date.now() }))
      }
    } catch { }
  }

  const applyFilters = (e?: FormEvent) => { e?.preventDefault() }

  useEffect(() => {
    const params = buildParams()
    const paramString = params.toString()
    const cached = tryReadStoredCount(paramString)
    if (cached !== null) setResultCount(cached)

    try {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    } catch { }
    debounceRef.current = window.setTimeout(() => {
      const currentParamStr = canonicalizeParams(searchParams ? new URLSearchParams(searchParams.toString()) : undefined)

      // Fix: If the new state is empty (no filters), we force reset=true.
      // This ensures that manually clearing filters prevents the server from
      // redirecting back to the saved search.
      let finalParamString = paramString
      if (!finalParamString) {
        finalParamString = "reset=true"
      }

      // If URL already matches AND we have a result count, we can skip navigation & count fetch.
      // But if resultCount is null (e.g. after reset), we MUST proceed to fetch it.
      if (finalParamString === currentParamStr && resultCount !== null) return

      setIsUpdating(true)
      markInProgress(finalParamString)
      try { fetchAndSetCount(finalParamString).then(() => setIsUpdating(false)).catch(() => setIsUpdating(false)) } catch { }
      try { prefetchSearch(finalParamString) } catch { }
      try { router.push(finalParamString ? `/${language}/direct-sales?${finalParamString}` : `/${language}/direct-sales`) } catch { }
    }, 450)

    return () => {
      try { if (debounceRef.current) window.clearTimeout(debounceRef.current) } catch { }
    }
  }, [state])

  // Sync Saved Toggle state
  // Stay ACTIVE as long as a saved search exists, fulfilling user preference
  // even if current filters don't match.
  useEffect(() => {
    if (!authChecked || !_isLoaded) return
    const shouldBeActive = !!_savedParamsString
    if (_isSavedActive !== shouldBeActive) {
      _setIsSavedActive(shouldBeActive)
    }
  }, [_savedParamsString, authChecked, _isLoaded])

  const resetFilters = () => {
    // Cancel any pending debounced navigation
    try { if (debounceRef.current) window.clearTimeout(debounceRef.current) } catch { }
    // Force count refresh by setting to null
    setResultCount(null)
    // Use client-side navigation instead of hard reload to keep history stack clean
    router.push(`/${language}/direct-sales?reset=true`)
  }

  // Load saved-searches on mount
  useEffect(() => {
    const tryLoad = async () => {
      const hasExplicitUrlFilters = (() => {
        try {
          if (!searchParams) return false
          const snapshot = new URLSearchParams(searchParams.toString())
          const keys = [
            "make",
            "model",
            "year",
            "fuel",
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
            "q",
          ]
          return keys.some(key => {
            const value = snapshot.get(key)
            if (!value) return false
            const trimmed = value.trim()
            if (!trimmed) return false
            if (key !== "q" && trimmed.toLowerCase() === "all") return false
            return true
          })
        } catch {
          return false
        }
      })()

      // If ?reset=true is present, do not auto-load saved searches (redirect),
      // BUT we still want to load the "Active" state if a saved search exists.
      const isReset = searchParams?.get("reset") === "true"

      // Get current params from URL directly instead of state (more reliable on mount)
      const currentParams = canonicalizeParams(searchParams ? new URLSearchParams(searchParams.toString()) : null)

      try {
        // Guest cookie checks omitted for brevity (similar pattern)
        try { if (typeof window !== "undefined") { /* ... */ } } catch { }

        // Try server-side saved searches for authenticated users
        try {
          const res = await fetch('/api/direct-sales-saved-searches', { cache: 'no-store', credentials: 'include' })
          if (res.ok) {
            const data = await res.json()
            const arr = Array.isArray(data?.saved_searches) ? data.saved_searches : []

            if (arr.length > 0) {
              const latest = arr[0]
              const p = canonicalizeParams(parseParams(latest.params))

              setSavedId(Number(latest.id))
              // Set active because we found a saved search
              _setIsSavedActive(true)
              _setSavedParamsString(p)

              // Only redirect if NOT reset, NOT explicit filters, and empty params
              if (!currentParams && !hasExplicitUrlFilters && !isReset) {
                if (p && p !== currentParams) {
                  try { router.replace(`/${language}/direct-sales?${p}`) } catch { }
                }
              }
            }
          }
        } catch { }

      } catch (err) { }

      setAuthChecked(true)
      setIsLoaded?.(true)
    }

    tryLoad()
  }, [])

  // Removed: automatic _setIsSavedActive state change based on filter changes
  // The save search toggle should only change when the user clicks the button

  const removeGuestSavedMatching = (_paramString: string) => {
    // Delegate to shared utility
    clearSavedSearchCookie('direct-sales');
  }

  const handleToggleSave = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    e?.preventDefault()

    if (isSaving) return
    setIsSaving(true)

    try {
      const params = buildParams()
      const paramString = canonicalizeParams(params)
      const viewingSavedResults = !paramString && Boolean(_savedParamsString)

      // If button is active and user wants to unsave
      if (_isSavedActive) {
        if (savedId) {
          try { await fetch(`/api/direct-sales-saved-searches/${savedId}`, { method: 'DELETE', credentials: 'include' }) } catch { }
          setSavedId(null)
        }
        if (_savedParamsString) {
          removeGuestSavedMatching(_savedParamsString)
          try { if (typeof window !== 'undefined' && window.sessionStorage) { sessionStorage.removeItem(`direct_sales_search_prefetch:${_savedParamsString}`) } } catch { }
        }
        _setSavedParamsString(null)
        _setIsSavedActive(false)
        try { toast({ title: t("filters.removed"), description: t("filters.saved_search_removed") }) } catch { }
        return
      }

      if (!paramString) {
        try { toast({ title: t("filters.select_filters"), description: t("filters.select_filters_desc") }) } catch { }
        return
      }

      try {
        if (_savedParamsString && _savedParamsString !== paramString) {
          try { removeGuestSavedMatching(_savedParamsString) } catch { }
          if (savedId) {
            try { await fetch(`/api/direct-sales-saved-searches/${savedId}`, { method: 'DELETE', credentials: 'include' }) } catch { }
            setSavedId(null)
          }
          _setSavedParamsString(null)
          _setIsSavedActive(false)
        }

        const paramsObj = paramsToObject(params)
        const body = {
          name: `${t("filters.save_search")} ${new Date().toLocaleString()}`,
          params: paramsObj,
          replaceExisting: true
        }

        try {
          const res = await fetch('/api/direct-sales-saved-searches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'include' })

          if (res.ok) {
            const data = await res.json()
            if (data?.success) {
              setSavedId(data.id || null)
              _setSavedParamsString(paramString)
              _setIsSavedActive(true)
              try {
                const newEntry = { name: body.name, params: paramsObj, created_at: new Date().toISOString() }
                const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
                document.cookie = `direct_sales_saved_searches_guest=${encodeURIComponent(JSON.stringify([newEntry]))}; path=/; max-age=${60 * 60 * 24 * 365}${secure}`
              } catch { }
              try { toast({ title: t("filters.saved_search_active"), description: t("filters.search_saved") }) } catch { }
              return
            }
          }
        } catch { }

        // fallback to cookie
        const newEntry = {
          name: `${t("filters.save_search")} ${new Date().toLocaleString()}`,
          params: paramsObj,
          created_at: new Date().toISOString()
        }
        const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
        document.cookie = `direct_sales_saved_searches_guest=${encodeURIComponent(JSON.stringify([newEntry]))}; path=/; max-age=${60 * 60 * 24 * 365}${secure}`
        _setSavedParamsString(paramString)
        _setIsSavedActive(true)
        try { toast({ title: t("filters.saved_search_active"), description: t("filters.search_saved") }) } catch { }

      } catch (err) {
        console.error(err)
      }

    } catch (err) {
      console.error(err)
      toast({ variant: "destructive", title: t("common.error"), description: t("filters.failed_to_save") })
    } finally {
      setIsSaving(false)
    }
  }





  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full border text-sm font-medium font-serif transition-colors ${active ? "bg-[#B8071C] text-white border-[#B8071C]" : "text-[#111827] border-[#d1d5db] hover:border-[#B8071C]"
    }`

  const toggleChip = (key: keyof SidebarState, value: string) => {
    setState(prev => {
      const current = prev[key]
      if (Array.isArray(current)) {
        const next = current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value]
        return { ...prev, [key]: next }
      }
      return { ...prev, [key]: prev[key] === value ? "All" : value }
    })
  }

  const fieldClass = "w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] bg-white font-serif"

  // Collapsible state with persistence
  const [collapsed, setCollapsed] = useState(false)

  // Initialize from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed-direct-sales')
    if (saved !== null) {
      setCollapsed(JSON.parse(saved))
    }
  }, [])

  // Helper to update state and storage
  const updateCollapsed = (val: boolean) => {
    setCollapsed(val)
    localStorage.setItem('sidebar-collapsed-direct-sales', JSON.stringify(val))
  }

  const asideClass = mobile
    ? `w-full max-w-full bg-white border border-[#e5e7eb] rounded-none shadow-sm relative flex flex-col ${className ?? ""}`
    : `hidden lg:flex ${collapsed ? "w-[60px]" : "w-full max-w-full lg:w-[320px] xl:w-[360px] 2xl:w-[400px] 3xl:w-[450px] 4xl:w-[500px]"} bg-white border border-[#e5e7eb] border-t-0 rounded-none shadow-sm relative lg:sticky lg:top-[var(--site-header-height,76px)] lg:h-[calc(100vh-var(--site-header-height,76px))] flex-col transition-all duration-300 ${className ?? ""}`


  // Render a single aside with animated content instead of conditional rendering
  // for smoother transitions
  return (
    <aside
      className={`${mobile
        ? `w-full max-w-full bg-white border border-[#e5e7eb] rounded-none shadow-sm relative flex flex-col ${className ?? ""}`
        : `hidden lg:flex bg-white border border-[#e5e7eb] border-t-0 rounded-none shadow-sm relative lg:sticky lg:top-[var(--site-header-height,76px)] lg:h-[calc(100vh-var(--site-header-height,76px))] flex-col overflow-hidden ${className ?? ""}`
        }`}
      style={{
        zIndex: 120,
        width: mobile ? undefined : (collapsed ? '56px' : '360px'),
        minWidth: mobile ? undefined : (collapsed ? '56px' : '320px'),
        maxWidth: mobile ? undefined : (collapsed ? '56px' : '500px'),
        transition: 'width 0.2s ease-out, min-width 0.2s ease-out, max-width 0.2s ease-out'
      }}
    >
      {/* Collapsed State Content */}
      {!mobile && collapsed && (
        <div
          className="flex flex-col items-center py-5 h-full cursor-pointer hover:bg-gray-50/80 transition-colors duration-300"
          onClick={() => updateCollapsed(false)}
          style={{
            opacity: collapsed ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out 0.1s'
          }}
        >
          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-b from-white to-gray-50 border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] text-gray-500 hover:text-[#B8071C] hover:border-[#B8071C]/20 hover:shadow-[0_2px_8px_rgba(184,7,28,0.1)] transition-all duration-300"
            title={t("common.show_filters") || "Show Filters"}
          >
            {/* Premium Sliders Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <circle cx="4" cy="12" r="2" />
              <circle cx="12" cy="10" r="2" />
              <circle cx="20" cy="14" r="2" />
            </svg>
          </button>
        </div>
      )}

      {/* Expanded State Content */}
      {(mobile || !collapsed) && (
        <div
          className="flex flex-col h-full"
          style={{
            opacity: (mobile || !collapsed) ? 1 : 0,
            transform: (mobile || !collapsed) ? 'translateX(0)' : 'translateX(-10px)',
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'
          }}
        >
          <div className="flex items-center px-4 pt-4 pb-3 gap-3">
            <div className="w-full">
              <div className="bg-white border border-[#e5e7eb] rounded-xl px-3 py-2.5 shadow-sm flex items-center hover:border-gray-300 transition-colors">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleToggleSave}
                  onKeyDown={async (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); await handleToggleSave() } }}
                  aria-pressed={_isSavedActive}
                  className="flex items-center justify-between w-full gap-3 select-none cursor-pointer group"
                  title={_isSavedActive ? t("filters.saved_search_active") : t("filters.save_this_search")}
                >
                  <span className="text-sm font-semibold text-gray-700 font-serif tracking-wide group-hover:text-black transition-colors">{t("filters.save_search")}</span>
                  <span className={`relative inline-flex items-center w-10 h-5 rounded-full transition-colors flex-shrink-0 ${_isSavedActive ? 'bg-[#B8071C]' : 'bg-gray-200 group-hover:bg-gray-300'}`}>
                    <span className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${_isSavedActive ? 'translate-x-[20px]' : 'translate-x-0'}`}></span>
                  </span>
                </div>
              </div>
            </div>

            {/* Hide Button (Desktop Only) - Premium Chevron */}
            {!mobile && (
              <button
                onClick={(e) => { e.stopPropagation(); updateCollapsed(true); }}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-b from-white to-gray-50 border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] text-gray-400 hover:text-[#B8071C] hover:border-[#B8071C]/20 hover:shadow-[0_2px_8px_rgba(184,7,28,0.1)] transition-all duration-300"
                title={t("common.hide_filters") || "Hide Filters"}
              >
                {/* Premium Chevron Left Icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
          </div>
          <div className="border-t border-[#f3f4f6]" />
          <div className="px-4 pb-4 space-y-4 overflow-y-auto flex-1 scrollbar-hide">
            <form onSubmit={applyFilters} className="space-y-4 pb-2">

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6b7280] font-serif">{t("filters.make")}?</label>
                <CustomMultiSelect
                  value={state.make}
                  onChange={(val: string[]) => updateField("make", val)}
                  options={makes.map(m => ({ value: String(m), label: String(m) }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6b7280] font-serif">{t("filters.model")}?</label>
                <CustomMultiSelect
                  value={state.model}
                  onChange={(val: string[]) => updateField("model", val)}
                  options={modelsToShow.map(m => ({ value: String(m), label: String(m) }))}
                />
                {state.make.length > 0 && (!modelsToShow || modelsToShow.length === 0) && (
                  <div className="text-xs text-[#6b7280] mt-1">{t("filters.no_models_found")}</div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6b7280] font-serif">{t("filters.year_range")}?</label>
                <CustomMultiSelect
                  value={state.year}
                  onChange={(val: string[]) => updateField("year", val)}
                  options={years.map(y => ({ value: String(y), label: String(y) }))}
                />
              </div>

              {/* Price Range - Direct Sales specific */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#6b7280] font-serif">{t("filters.min_budget")}</label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={10000}
                      value={state.minPrice}
                      onChange={e => updateField("minPrice", e.target.value)}
                      placeholder="0"
                      className={fieldClass}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#6b7280] font-serif">{t("filters.max_budget")}</label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={10000}
                      value={state.maxPrice}
                      onChange={e => updateField("maxPrice", e.target.value)}
                      placeholder="1000000"
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-[#6b7280] font-serif">{t("filters.fuel")}</label>
                <div className="flex flex-wrap gap-2">
                  {fuelOptions.map(option => {
                    const active = state.fuel.includes(option.value)
                    const fuelLabelKey = option.value.toLowerCase()
                    const translatedLabel = ["petrol", "diesel", "electric", "hybrid", "gasoline"].includes(fuelLabelKey)
                      ? t(`vehicle.fuel.${fuelLabelKey === "gasoline" ? "petrol" : fuelLabelKey}` as any)
                      : option.label
                    return (
                      <button
                        type="button"
                        key={option.value}
                        className={
                          (fuelLabelKey.includes("electric") || fuelLabelKey.includes("hybrid"))
                            ? `px-3 py-1.5 rounded-full border text-sm font-medium font-serif transition-colors ${active
                              ? "bg-[#00A651] text-white border-[#00A651]"
                              : "text-[#00A651] border-[#00A651] bg-white hover:bg-[#00A651] hover:text-white"
                            }`
                            : chipClass(active)
                        }
                        onClick={() => toggleChip("fuel", option.value)}
                      >
                        {translatedLabel}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    className={chipClass(state.fuel.length === 0)}
                    onClick={() => updateField("fuel", [])}
                  >
                    {t("filters.any")}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-[#6b7280] font-serif">{t("filters.transmission_label")}</label>
                <div className="flex flex-wrap gap-2">
                  {transmissions.map(item => {
                    const value = String(item)
                    const active = state.transmission.includes(value)
                    const transKey = value.toLowerCase() as "automatic" | "manual"
                    const translatedLabel = ["automatic", "manual"].includes(value.toLowerCase()) ? t(`vehicle.transmission.${transKey}` as any) : item
                    return (
                      <button
                        type="button"
                        key={value}
                        className={chipClass(active)}
                        onClick={() => toggleChip("transmission", value)}
                      >
                        {translatedLabel}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    className={chipClass(state.transmission.length === 0)}
                    onClick={() => updateField("transmission", [])}
                  >
                    {t("filters.any")}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6b7280] font-serif">{t("filters.location_label")}</label>
                <CustomMultiSelect
                  value={state.location}
                  onChange={(val: string[]) => updateField("location", val)}
                  options={locations.map(l => ({ value: String(l), label: String(l) }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#6b7280] font-serif">{t("filters.min_mileage")}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={10000}
                    value={state.minMileage}
                    onChange={e => updateField("minMileage", e.target.value)}
                    placeholder="0"
                    className={fieldClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#6b7280] font-serif">{t("filters.max_mileage")}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={10000}
                    value={state.maxMileage}
                    onChange={e => updateField("maxMileage", e.target.value)}
                    placeholder="200000"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#6b7280] font-serif">{t("filters.min_engine")}</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min={0}
                    value={state.minEngine}
                    onChange={e => updateField("minEngine", e.target.value)}
                    placeholder="1.0"
                    className={fieldClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#6b7280] font-serif">{t("filters.max_engine")}</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min={0}
                    value={state.maxEngine}
                    onChange={e => updateField("maxEngine", e.target.value)}
                    placeholder="6.0"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#6b7280] font-serif">{t("filters.condition")}</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateField("condition", [])}
                    className={chipClass(state.condition.length === 0)}
                  >
                    {t("filters.any")}
                  </button>
                  {conditionOptions.map(item => {
                    const active = state.condition.includes(item.value)
                    const condKey = item.value.toLowerCase() as "new" | "used" | "certified" | "damaged" | "fair" | "good" | "excellent" | "poor"
                    const translatedLabel = ["new", "used", "certified", "damaged", "fair", "good", "excellent", "poor"].includes(item.value.toLowerCase()) ? t(`vehicle.condition.${condKey}` as any) : item.label
                    return (
                      <button
                        key={item.value}
                        type="button"
                        className={
                          (condKey.includes("new") || condKey.includes("certified"))
                            ? `px-3 py-1.5 rounded-full border text-sm font-medium font-serif transition-colors ${active
                              ? "bg-[#00A651] text-white border-[#00A651]"
                              : "text-[#00A651] border-[#00A651] bg-white hover:bg-[#00A651] hover:text-white"
                            }`
                            : chipClass(active)
                        }
                        onClick={() => toggleChip("condition", item.value)}
                      >
                        {translatedLabel}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-[#6b7280] font-serif">{t("filters.how_many_doors")}</label>
                <div className="flex flex-wrap gap-2">
                  {doorOptions.map(item => {
                    const value = String(item)
                    const active = state.doors.includes(value)
                    return (
                      <button
                        type="button"
                        key={value}
                        className={chipClass(active)}
                        onClick={() => toggleChip("doors", value)}
                      >
                        {value}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    className={chipClass(state.doors.length === 0)}
                    onClick={() => updateField("doors", [])}
                  >
                    {t("filters.any")}
                  </button>
                </div>
              </div>

              {/* Exterior Color */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#6b7280] font-serif">{t("filters.exterior_color")}</label>
                <div className="flex flex-wrap gap-2">
                  {CAR_COLORS.map(color => {
                    const active = state.exteriorColor.includes(color.value)
                    return (
                      <button
                        type="button"
                        key={color.value}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${active ? "ring-2 ring-[#B8071C] ring-offset-2" : "hover:scale-110"} ${color.border ? "border-gray-300" : "border-transparent"}`}
                        style={{ background: color.hex }}
                        onClick={() => toggleChip("exteriorColor", color.value)}
                        title={t(`colors.${color.value}` as any)}
                      />
                    )
                  })}
                  <button
                    type="button"
                    className={chipClass(state.exteriorColor.length === 0)}
                    onClick={() => updateField("exteriorColor", [])}
                  >
                    {t("filters.any")}
                  </button>
                </div>
              </div>

              {/* Interior Color */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#6b7280] font-serif">{t("filters.interior_color")}</label>
                <div className="flex flex-wrap gap-2">
                  {CAR_COLORS.map(color => {
                    const active = state.interiorColor.includes(color.value)
                    return (
                      <button
                        type="button"
                        key={color.value}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${active ? "ring-2 ring-[#B8071C] ring-offset-2" : "hover:scale-110"} ${color.border ? "border-gray-300" : "border-transparent"}`}
                        style={{ background: color.hex }}
                        onClick={() => toggleChip("interiorColor", color.value)}
                        title={t(`colors.${color.value}` as any)}
                      />
                    )
                  })}
                  <button
                    type="button"
                    className={chipClass(state.interiorColor.length === 0)}
                    onClick={() => updateField("interiorColor", [])}
                  >
                    {t("filters.any")}
                  </button>
                </div>
              </div>

              {/* Original Paint */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#6b7280] font-serif">{t("filters.original_paint")}</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={chipClass(state.originalPaint === "yes")}
                    onClick={() => toggleChip("originalPaint", "yes")}
                  >
                    {t("filters.yes")}
                  </button>
                  <button
                    type="button"
                    className={chipClass(state.originalPaint === "no")}
                    onClick={() => toggleChip("originalPaint", "no")}
                  >
                    {t("filters.no")}
                  </button>
                  <button
                    type="button"
                    className={chipClass(state.originalPaint === "All")}
                    onClick={() => updateField("originalPaint", "All")}
                  >
                    {t("filters.any")}
                  </button>
                </div>
              </div>

            </form>
          </div>
          <div className="px-4 py-3 border-t bg-white">
            <div className="flex flex-col gap-2">
              <div className="w-full bg-[#fef2f2] border border-[#fecaca] text-[#B8071C] text-sm font-medium py-2 rounded-lg text-center flex items-center justify-center gap-2">
                <span className="font-serif">{resultCount === null ? "—" : t("filters.listings_count" as any).replace("{count}", String(resultCount))}</span>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="w-full border border-[#d1d5db] text-[#374151] text-sm font-medium font-serif py-2 rounded-lg"
              >
                {t("filters.reset")}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

