import React from "react"

export type FilterOptions = {
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

export interface SearchViewProps {
    t: (key: any, params?: any) => string
    make: string[]
    setMake: (val: string[]) => void
    model: string[]
    setModel: (val: string[]) => void
    year: string
    setYear: (val: string) => void
    fuel: string[]
    setFuel: (val: string[]) => void
    transmission: string
    setTransmission: (val: string) => void
    location: string[]
    setLocation: (val: string[]) => void
    makesList: string[]
    modelsList: string[]
    effectiveYearsList: string[] | Array<string | number>
    fuelsList: Array<{ value: string; label: string }>
    transList: Array<{ value: string; label: string }>
    locationsList: string[]
    openFilters: (usePinned: boolean) => void
    resetAll: () => void
    triggerSearch: () => void
    filterBtnRef?: React.Ref<HTMLButtonElement>
    pinnedFilterBtnRef?: React.Ref<HTMLButtonElement>
}
