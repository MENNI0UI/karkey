"use client"
import React from "react"
import CustomSelect from "@/components/ui/custom-select"
import CustomMultiSelect from "@/components/ui/custom-multi-select"
import { ScaleButton } from "@/components/ui/motion-wrappers"
import { SearchViewProps } from "./types"

export function DesktopSearchView({
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
    triggerSearch,
    filterBtnRef
}: SearchViewProps) {
    return (
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
                        ...locationsList.map((l) => ({
                            value: l,
                            label: t(`location.city.${l.toLowerCase().replace(/\s+/g, '')}` as any) || l
                        }))
                    ]}
                />
            </div>

            <div className="sb-cell sb-cell--tight sb-cell--no-divider flex items-center justify-center min-w-[50px]">
                <button
                    ref={filterBtnRef}
                    type="button"
                    onClick={() => openFilters(false)}
                    title="Filters"
                    className="w-8 h-8 shrink-0 aspect-square !rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center transition-all hover:border-primary hover:shadow-md hover:-translate-y-0.5 relative z-20"
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
                    <span className="text-sm" aria-hidden>✕</span>
                </button>

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
}
