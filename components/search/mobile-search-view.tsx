"use client"
import React from "react"
import { SearchModeBadge } from "@/components/search/search-mode-badge"
import { SearchSuggestions } from "@/components/search/search-suggestions"

interface MobileSearchViewProps {
    t: (key: any, params?: any) => string
    searchMode: "auction" | "direct_sale" | null
    setSearchMode: (mode: "auction" | "direct_sale" | null) => void
    currentLang: string
    mobileQuery: string
    setMobileQuery: (q: string) => void
    isFocused: boolean
    setIsFocused: (focused: boolean) => void
    handleMobileSearch: () => void
    inlineSearchRef: React.Ref<HTMLInputElement>
    triggerSearch: (vals?: { query?: string }) => void
}

export function MobileSearchView({
    t,
    searchMode,
    setSearchMode,
    currentLang,
    mobileQuery,
    setMobileQuery,
    isFocused,
    setIsFocused,
    handleMobileSearch,
    inlineSearchRef
}: MobileSearchViewProps) {
    return (
        <div className="w-full max-w-md mx-auto px-4 pb-2">
            <div className="relative">
                <label
                    className="relative z-20 flex items-center flex-nowrap gap-2 rounded-full border border-gray-100/20 bg-white/95 backdrop-blur-md shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] px-4 py-3 transition-all focus-within:shadow-[0_15px_25px_-5px_rgba(0,166,81,0.2)] cursor-text min-h-[50px]"
                >
                    <SearchModeBadge mode={searchMode} lang={currentLang} onReset={() => setSearchMode(null)} />
                    <input
                        ref={inlineSearchRef}
                        type="text"
                        value={mobileQuery}
                        onChange={(e) => setMobileQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                handleMobileSearch()
                            }
                        }}
                        placeholder={searchMode ? "" : (t("nav.search_placeholder") || "Search...")}
                        className="flex-1 h-full bg-transparent text-base text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none"
                        aria-label={t("nav.search_placeholder")}
                    />
                    {mobileQuery && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setMobileQuery(""); }}
                            className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-[#475569] hover:bg-slate-100 relative z-30"
                        >
                            ✕
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleMobileSearch(); }}
                        className="w-10 h-10 flex-shrink-0 rounded-full bg-[#00A651] text-white flex items-center justify-center shadow-lg shadow-[#00A651]/20 hover:scale-105 active:scale-95 transition-all relative z-30"
                    >
                        <svg aria-hidden="true" focusable="false" className="search-icon-svg" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
                            <line x1="20.5" y1="20.5" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </label>
                {/* Smart Suggestions */}
                {(isFocused || mobileQuery.length > 0) && (
                    <SearchSuggestions
                        query={mobileQuery}
                        searchMode={searchMode}
                        onSetMode={setSearchMode}
                    />
                )}
            </div>
        </div>
    )
}
