"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Car, Gavel } from "lucide-react"
import Image from "next/image"
import { useTranslation } from "@/lib/i18n-context"
import logger from "@/lib/logger"

interface SearchResult {
    id: number;
    title?: string;
    make?: string;
    model?: string;
    year?: number;
    image?: string;
    price?: number;
    current_bid?: number;
    starting_price?: number;
    type?: "auction" | "direct_sale";
}

interface SearchSuggestionsProps {
    query: string;
    onClose?: () => void;
    className?: string;
    searchMode?: "auction" | "direct_sale" | null;
    onSetMode?: (mode: "auction" | "direct_sale" | null) => void;
}

export function SearchSuggestions({ query, onClose, className, searchMode, onSetMode }: SearchSuggestionsProps) {
    const [results, setResults] = React.useState<SearchResult[]>([])
    const [loading, setLoading] = React.useState(false)
    const router = useRouter()
    const { language, t } = useTranslation()

    // Use a local setter that calls the prop if provided
    const setSearchMode = (val: "auction" | "direct_sale" | null) => {
        if (onSetMode) onSetMode(val)
    }

    React.useEffect(() => {
        if (!query || query.length < 1 || !searchMode) {
            setResults([])
            return
        }

        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                // Pass the mandatory searchMode as 'type'
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${searchMode}&limit=5`)
                if (res.ok) {
                    const data = await res.json()
                    const list = data.results || data.vehicles || data.auctions || []
                    setResults(list)
                }
            } catch (err) {
                logger.error("[SearchSuggestions] Fetch failed", err)
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query, searchMode])

    const handleSelect = (item: SearchResult) => {
        if (onClose) onClose()

        const isAuction = item.type === 'auction'
        const route = isAuction ? `/${language}/auctions/${item.id}` : `/${language}/direct-sales/${item.id}`
        router.push(route)
    }

    // --- 1. Mode Selection (When no mode chosen yet) ---
    if (!searchMode) {
        return (
            <div className={`absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[1000] ${className}`}>
                <div className="p-4 space-y-3">
                    <div className="px-1 text-[10px] uppercase font-bold text-gray-400 tracking-widest text-center">
                        {language === 'ar' ? "كيف تريد البحث؟" : "How would you like to search?"}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setSearchMode("auction")}
                            className="flex-1 flex flex-col items-center gap-2 px-3 py-4 bg-gray-50/50 hover:bg-[#B8071C]/5 rounded-2xl transition-all border border-gray-100 hover:border-[#B8071C]/20 group"
                        >
                            <div className="w-10 h-10 bg-[#B8071C]/10 rounded-full flex items-center justify-center text-[#B8071C] group-hover:bg-[#B8071C] group-hover:text-white transition-all shadow-sm">
                                <Gavel size={18} />
                            </div>
                            <span className="text-xs font-bold text-gray-700">{language === 'ar' ? "المزادات" : "Auctions"}</span>
                        </button>

                        <button
                            onClick={() => setSearchMode("direct_sale")}
                            className="flex-1 flex flex-col items-center gap-2 px-3 py-4 bg-gray-50/50 hover:bg-emerald-50 rounded-2xl transition-all border border-gray-100 hover:border-emerald-200 group"
                        >
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                <Car size={18} />
                            </div>
                            <span className="text-xs font-bold text-gray-700">{language === 'ar' ? "البيع المباشر" : "Direct Sales"}</span>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // --- 2. While Mode is set but no results yet (Show typing prompt) ---
    if (!query || query.trim().length === 0) {
        return (
            <div className={`absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[1000] ${className}`}>
                <div className="p-10 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 opacity-50">
                        <Loader2 className="animate-pulse" size={24} />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                        {language === 'ar' ? "ابدأ بكتابة اسم السيارة..." : "Start typing to search..."}
                    </p>
                </div>
            </div>
        )
    }

    if (!loading && results.length === 0) return null;

    return (
        <div className={`absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[1000] ${className}`}>
            {loading && (
                <div className="p-4 flex items-center justify-center text-[#B8071C]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                </div>
            )}

            {!loading && results.length > 0 && (
                <div className="max-h-[300px] overflow-y-auto scrollbar-hide py-2">
                    {/* Optional: Add header "Suggestions" */}
                    <div className="px-4 py-2 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        {t('nav.suggested_results')}
                    </div>
                    {results.map((item) => {
                        const isAuction = item.type === 'auction'
                        const typeLabel = isAuction
                            ? (language === 'ar' ? "مزاد" : "Auction")
                            : (language === 'ar' ? "للبيع" : "Direct Sale")
                        const badgeClasses = isAuction
                            ? "bg-[#B8071C]/10 text-[#B8071C]"
                            : "bg-emerald-100 text-emerald-700"

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors text-left border-b border-gray-50 last:border-0 group"
                            >
                                {/* Thumbnail */}
                                <div className="w-12 h-10 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0">
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.title || "Vehicle"}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full grid place-items-center text-gray-400">
                                            <Car size={16} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-sm font-bold text-gray-900 truncate flex-1">
                                            {item.title || `${item.make} ${item.model} ${item.year}`}
                                        </h4>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase flex-shrink-0 ${badgeClasses}`}>
                                            {typeLabel}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        {item.current_bid ? (
                                            <span className="text-[#B8071C] font-semibold flex items-center gap-1">
                                                <Gavel size={10} />
                                                {item.current_bid} {t('common.mad')}
                                            </span>
                                        ) : (
                                            <span className="text-emerald-600 font-semibold">
                                                {item.price ? `${item.price} ${t('common.mad')}` : t('common.view')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    )
}
