import React from "react"
import CustomSelect from "@/components/ui/custom-select"
import CustomMultiSelect from "@/components/ui/custom-multi-select"

type MainPanelProps = {
    isOpen: boolean
    position: { top: number; left: number } | null
    condition: string[]
    minPrice: string
    maxPrice: string
    conditionsList: Array<{ value: string; label: string }>
    t: (key: any) => string
    setCondition: (val: string[]) => void
    setMinPrice: (val: string) => void
    setMaxPrice: (val: string) => void
    onClose: () => void
    onApply: () => void
}

export const MainFilterPanel = ({
    isOpen, position, condition, minPrice, maxPrice,
    conditionsList, t, setCondition, setMinPrice, setMaxPrice, onClose, onApply
}: MainPanelProps) => {
    if (!isOpen) return null

    return (
        <div
            id="karkey-filter-panel-main"
            role="dialog"
            aria-label="Advanced filters"
            className="custom-select-dropdown"
            style={{
                position: "fixed",
                zIndex: 60,
                top: position ? `${position.top}px` : `calc(var(--site-header-height) + 8px)`,
                left: position ? `${position.left}px` : "50%",
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
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-bold professional-font">{t('common.mad')}</span>
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
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 font-bold professional-font">{t('common.mad')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-100 px-1 pb-1">
                <button
                    onClick={onClose}
                    className="px-3 py-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 rounded-md transition-colors"
                >
                    Close
                </button>
                <button
                    onClick={onApply}
                    className="px-3 py-1.5 text-[11px] font-bold text-white bg-[#00A651] hover:bg-[#008f45] rounded-md shadow-sm shadow-[#00A651]/20 transition-all active:scale-[0.98]"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    )
}

type PinnedPanelProps = {
    isOpen: boolean
    position: { top: number; left: number } | null
    year: string
    fuel: string[]
    transmission: string
    condition: string[]
    minPrice: string
    maxPrice: string
    effectiveYearsList: Array<string | number>
    fuelsList: Array<{ value: string; label: string }>
    transList: Array<{ value: string; label: string }>
    conditionsList: Array<{ value: string; label: string }>
    setYear: (val: string) => void
    setFuel: (val: string[]) => void
    setTransmission: (val: string) => void
    setCondition: (val: string[]) => void
    setMinPrice: (val: string) => void
    setMaxPrice: (val: string) => void
    onClose: () => void
    onApply: () => void
}

export const PinnedFilterPanel = ({
    isOpen, position, year, fuel, transmission, condition, minPrice, maxPrice,
    effectiveYearsList, fuelsList, transList, conditionsList,
    setYear, setFuel, setTransmission, setCondition, setMinPrice, setMaxPrice,
    onClose, onApply
}: PinnedPanelProps) => {
    if (!isOpen) return null

    return (
        <div
            id="karkey-filter-panel-pinned"
            role="dialog"
            aria-label="Advanced filters (pinned)"
            className="custom-select-dropdown"
            style={{
                position: "fixed",
                zIndex: 60,
                top: position ? `${position.top}px` : `calc(var(--site-header-height) + 8px)`,
                left: position ? `${position.left}px` : "50%",
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
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-600 text-sm font-semibold transition-all hover:bg-gray-100"
                    >
                        Close
                    </button>
                    <button
                        onClick={onApply}
                        className="flex-[1.5] px-4 py-2.5 rounded-xl bg-[#00A651] text-white text-sm font-semibold shadow-lg shadow-[#00A651]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    )
}
