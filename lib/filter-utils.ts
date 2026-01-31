
export type ConditionOption = { value: string; label: string }

export type DirectSalesFilterOptions = {
    makes?: string[]
    models?: string[]
    makeModels?: Record<string, string[]>
    makeCounts?: Record<string, number>
    modelCounts?: Record<string, number>
    years?: Array<string | number>
    fuelTypes?: Array<{ value: string; label: string } | string>
    transmissions?: string[]
    locations?: string[]
    conditions?: Array<{ value: string; label: string } | string>
    minPrice?: number
    maxPrice?: number
}

// Type for raw condition input that could come from database
interface RawConditionObject {
    value?: string | null
    label?: string | null
    condition?: string | null
    vehicle_condition?: string | null
}

type RawConditionInput = RawConditionObject | string

export const DEFAULT_CONDITION_OPTIONS: ConditionOption[] = [
    { value: "excellent", label: "Excellent" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
    { value: "poor", label: "Poor" },
]

export function formatConditionLabel(value: string) {
    if (!value) return ""
    const trimmed = value.trim()
    if (!trimmed) return ""
    return trimmed
        .split(/\s+/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ")
}

export function normalizeConditionOptions(raw?: Array<RawConditionInput>): ConditionOption[] {
    const base = DEFAULT_CONDITION_OPTIONS
    if (!raw || !Array.isArray(raw)) return base

    const result = [...base]
    const seen = new Set(result.map(r => r.value.toLowerCase()))

    for (const item of raw) {
        if (!item) continue
        let val = ""
        let label = ""

        if (typeof item === "string") {
            val = item.trim().toLowerCase()
            label = formatConditionLabel(item)
        } else if (typeof item === "object") {
            const rawVal = item.value ?? item.condition ?? item.vehicle_condition
            if (!rawVal) continue
            val = String(rawVal).trim().toLowerCase()
            label = item.label ? String(item.label) : formatConditionLabel(String(rawVal))
        }

        if (val && !seen.has(val)) {
            seen.add(val)
            result.push({ value: val, label })
        }
    }

    return result
}

export function normalizeConditionValue(value?: string | null, list: ConditionOption[] = DEFAULT_CONDITION_OPTIONS) {
    if (!value) return "All"
    const trimmed = String(value).trim()
    if (!trimmed || trimmed.toLowerCase() === "all") return "All"
    const lower = trimmed.toLowerCase()
    const match = list.find(item => item.value === lower || item.label.toLowerCase() === lower)
    return match ? match.value : lower
}

export const mapDbToLabel = (v?: string) => {
    if (!v) return ""
    const s = String(v).trim().toLowerCase()
    if (s === "gasoline" || s === "petrol") return "Petrol"
    if (s === "diesel") return "Diesel"
    if (s === "electric") return "Electric"
    if (s === "hybrid") return "Hybrid"
    return String(v).replace(/^(\w)/, c => c.toUpperCase())
}

export const canonicalizeParams = (input?: URLSearchParams | Record<string, any> | null) => {
    if (!input) return ""
    const entries: Array<[string, string]> = []
    if (input instanceof URLSearchParams) {
        input.forEach((value, key) => {
            if (key !== "reset" && value !== undefined && value !== null && String(value) !== "All" && String(value) !== "") {
                entries.push([key, String(value)])
            }
        })
    } else {
        Object.entries(input).forEach(([key, value]) => {
            if (value === undefined || value === null) return
            if (Array.isArray(value)) {
                value.forEach(v => {
                    if (v !== undefined && v !== null && String(v) !== "") {
                        entries.push([key, String(v)])
                    }
                })
            } else {
                const str = String(value)
                if (!str || str === "All" || key === "reset") return
                entries.push([key, str])
            }
        })
    }
    entries.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]))
    return new URLSearchParams(entries).toString()
}

export const paramsToObject = (params: URLSearchParams) => {
    const obj: Record<string, any> = {}
    params.forEach((value, key) => {
        if (obj[key]) {
            if (Array.isArray(obj[key])) {
                obj[key].push(value)
            } else {
                obj[key] = [obj[key], value]
            }
        } else {
            obj[key] = value
        }
    })
    return obj
}

/**
 * Safely parses stored params (which could be JSON or a query string) 
 * and returns an object suitable for mapParamsToState.
 */
export const parseParams = (input: string | Record<string, unknown> | null | undefined): Record<string, unknown> => {
    if (!input) return {}
    if (typeof input !== "string") return input

    const trimmed = input.trim()
    if (!trimmed) return {}

    // Try JSON first (for backward compatibility)
    if (trimmed.startsWith("{")) {
        try {
            return JSON.parse(trimmed) as Record<string, unknown>
        } catch { }
    }

    // Fallback to query string
    try {
        return paramsToObject(new URLSearchParams(trimmed))
    } catch {
        return {}
    }
}

export const DEFAULTS = {
    makes: ["Renault", "Toyota", "Peugeot"],
    models: ["Clio", "208", "Corolla"],
    years: ["2024", "2023", "2022"],
    // Lowercase to match Prisma enum and URL params
    transmissions: ["automatic", "manual"],
    locations: ["Casablanca", "Rabat", "Agadir"],
    conditions: DEFAULT_CONDITION_OPTIONS,
    doors: ["2", "3", "4", "5"],
    fuelTypes: [
        { value: "gasoline", label: "Petrol" },
        { value: "diesel", label: "Diesel" },
        { value: "hybrid", label: "Hybrid" },
        { value: "electric", label: "Electric" },
    ],
}

// Type for raw fuel option input
interface RawFuelObject {
    value?: string | null
    label?: string | null
    fuel_type?: string | null
}

type RawFuelInput = RawFuelObject | string

export function normalizeFuelOptions(raw?: Array<RawFuelInput>): Array<{ value: string; label: string }> {
    const base = DEFAULTS.fuelTypes
    if (!raw || !Array.isArray(raw)) return base

    const canonicalize = (v: string): string => {
        const lower = v.toLowerCase()
        if (lower === "petrol") return "gasoline"
        return lower
    }

    const incoming = raw
        .map((v): { value: string; label: string } | null => {
            if (!v) return null
            if (typeof v === "string") return { value: canonicalize(v), label: mapDbToLabel(v) }
            if (typeof v === "object" && (v.value || v.fuel_type)) {
                const val = String(v.value ?? v.fuel_type)
                return { value: canonicalize(val), label: String(v.label ?? mapDbToLabel(val)) }
            }
            return null
        })
        .filter((v): v is { value: string; label: string } => v !== null)

    // Merge: start with defaults, add any others from incoming that aren't already there
    const result = [...base]
    const seen = new Set(result.map(r => canonicalize(r.value)))

    for (const opt of incoming) {
        const val = canonicalize(opt.value)
        if (!seen.has(val)) {
            seen.add(val)
            result.push(opt)
        }
    }

    return result
}
