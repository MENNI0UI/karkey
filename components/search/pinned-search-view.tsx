"use client"
import React from "react"
import CustomMultiSelect from "@/components/ui/custom-multi-select"
import { SearchViewProps } from "./types"

export function PinnedSearchView({
    t,
    make, setMake,
    model, setModel,
    location, setLocation,
    makesList,
    modelsList,
    locationsList,
    openFilters,
    resetAll,
    triggerSearch,
    pinnedFilterBtnRef
}: SearchViewProps) {
    return (
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
                        ...locationsList.map((l) => ({
                            value: l,
                            label: t(`location.city.${l.toLowerCase().replace(/\s+/g, '')}` as any) || l
                        }))
                    ]}
                />
            </div>

            <div className="sb-cell sb-cell--tight sb-cell--no-divider flex items-center justify-center">
                <button
                    ref={pinnedFilterBtnRef}
                    type="button"
                    onClick={() => openFilters(true)}
                    title="Filters"
                    className="w-8 h-8 shrink-0 aspect-square !rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center transition-all hover:border-primary relative z-20"
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
}
