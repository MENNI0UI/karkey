"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n-context"
import {
    canonicalizeParams,
    normalizeConditionValue,
    DEFAULTS
} from "@/lib/filter-utils"

// Definition of the state shape
export type SidebarState = {
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

export function useFilterState(conditionOptions: any[]) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { language } = useTranslation()
    const debounceRef = useRef<number | null>(null)

    // Normalize helper: always lowercase and trimmed
    const normalize = (val: string) => val ? val.trim().toLowerCase() : ""

    // Initialize state from URL
    const [state, setState] = useState<SidebarState>(() => {
        const getVal = (key: string) => {
            const vals = searchParams?.getAll(key) || []
            return vals
                .filter(v => v && normalize(v) !== "all")
                .map(normalize) // Store as normalized internally
        }
        const current = new URLSearchParams(searchParams?.toString())

        return {
            make: getVal("make"), // Makes are usually case-sensitive identifiers, but for robust comparison we can normalize or keep original if needed. 
            // Strategy: Store normalized for comparison, but we might need original casing for display?
            // Actually, standardizing on lowercase for logic is safer.
            model: getVal("model"),
            year: getVal("year"),
            fuel: getVal("fuel"),
            transmission: getVal("transmission"),
            location: getVal("location"), // Locations might be case sensitive? Let's normalize for consistency.
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

    // Sync state with URL changes (popstate, etc)
    useEffect(() => {
        const getVal = (key: string) => {
            const vals = searchParams?.getAll(key) || []
            return vals.filter(v => v && normalize(v) !== "all").map(normalize)
        }

        // We recalculate the "next" state from URL to ensure we represent truth
        const nextState: SidebarState = {
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

        // Only update if different to avoid loops
        if (JSON.stringify(state) !== JSON.stringify(nextState)) {
            setState(nextState)
        }
    }, [searchParams, conditionOptions])

    // Update logic (Debounced URL push)
    useEffect(() => {
        // Determine if we need to update URL
        if (debounceRef.current) window.clearTimeout(debounceRef.current)

        debounceRef.current = window.setTimeout(() => {
            const currentParams = new URLSearchParams(searchParams?.toString())
            const nextParams = new URLSearchParams()

            // Reconstruct params from state
            Object.entries(state).forEach(([key, val]) => {
                if (Array.isArray(val)) {
                    val.forEach(v => {
                        if (v && v !== "All") nextParams.append(key, v) // Should we restore casing? Ideally API handles case-insensitive.
                    })
                } else {
                    if (val && val !== "All") nextParams.set(key, val)
                }
            })

            const currentStr = canonicalizeParams(currentParams)
            let nextStr = canonicalizeParams(nextParams)

            if (!nextStr) nextStr = "reset=true"

            if (currentStr !== nextStr) {
                router.push(`/${language}/direct-sales?${nextStr}`)
            }
        }, 450)

        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current)
        }
    }, [state, language, searchParams, router])


    // Helper: Strict toggle/update
    // Guaranteed to handle normalization
    const updateState = (key: keyof SidebarState, value: string | string[]) => {
        setState(prev => {
            // Handle array replacement
            if (Array.isArray(value)) {
                return { ...prev, [key]: value.map(normalize) }
            }
            return { ...prev, [key]: normalize(value) }
        })
    }

    const toggleValue = (key: keyof SidebarState, value: string) => {
        const target = normalize(value)
        setState(prev => {
            const current = prev[key]
            if (Array.isArray(current)) {
                // Exists?
                if (current.includes(target)) {
                    return { ...prev, [key]: current.filter(v => v !== target) }
                } else {
                    return { ...prev, [key]: [...current, target] }
                }
            } else {
                // Toggle single value (if needed, usually single value is direct set)
                // For radio-like behavior:
                return { ...prev, [key]: prev[key] === target ? "All" : target }
            }
        })
    }

    return {
        state,
        updateState,
        toggleValue,
        setState // Expose for complex resets if needed
    }
}
