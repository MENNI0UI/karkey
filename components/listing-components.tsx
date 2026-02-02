"use client"

import React from "react"
import { Search, Loader2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"
import { LuxuryLoader } from "@/components/ui/luxury-loader"
import { motion } from "framer-motion"

interface EmptyListingStateProps {
    titleKey: string
    descKey?: string
    icon?: React.ReactNode
}

export function EmptyListingState({ titleKey, descKey, icon }: EmptyListingStateProps) {
    const { t } = useTranslation()

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center px-4"
        >
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-[#103090]/5 border border-gray-100 ring-4 ring-gray-50/50">
                {icon || <Search className="w-10 h-10 text-[#DEB735]" strokeWidth={1.5} />}
            </div>
            <h3 className="text-2xl font-bold text-[#103090] font-serif mb-3 tracking-tight">
                {t(titleKey as any)}
            </h3>
            {descKey && (
                <p className="text-gray-500 max-w-sm leading-relaxed text-sm">
                    {t(descKey as any)}
                </p>
            )}
        </motion.div>
    )
}

interface LoadMoreButtonProps {
    onLoadMore: () => void
    loading: boolean
    hasMore: boolean
    loadMoreKey: string
    endKey: string
}

export function LoadMoreButton({ onLoadMore, loading, hasMore, loadMoreKey, endKey }: LoadMoreButtonProps) {
    const { t } = useTranslation()

    if (!hasMore) {
        return <div className="text-sm text-[#717171] font-medium py-8 text-center">{t(endKey as any)}</div>
    }

    return (
        <div className="flex justify-center mt-12 mb-8">
            <button
                disabled={loading}
                className="group relative inline-flex items-center justify-center bg-white border-2 border-[#103090]/10 text-[#103090] hover:border-[#103090] hover:bg-white rounded-2xl px-8 py-3.5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                onClick={onLoadMore}
            >
                <div className="flex items-center gap-3 font-bold text-sm tracking-wide">
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[#DEB735]" />
                    ) : null}
                    <span>{loading ? t("common.loading") : t(loadMoreKey as any)}</span>
                </div>
            </button>
        </div>
    )
}
