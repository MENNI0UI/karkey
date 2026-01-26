import React from "react"

export const SearchModeBadge = ({ mode, lang, onReset }: { mode: string | null, lang: string, onReset: () => void }) => {
    if (!mode) return null

    const isAuction = mode === 'auction'
    const label = lang === 'ar'
        ? (isAuction ? "مزاد" : "بيع")
        : (isAuction ? "Auction" : "Sale")

    return (
        <div className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${isAuction ? "bg-[#B8071C]/10 text-[#B8071C] border border-[#B8071C]/20" : "bg-emerald-100 text-emerald-700 border border-emerald-200"}`}>
            <span>/ {label}</span>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onReset();
                }}
                className="w-5 h-5 flex items-center justify-center -mr-1 hover:scale-110 active:scale-90 transition-all opacity-60 hover:opacity-100 rounded-full hover:bg-black/5"
                title="Reset mode"
            >
                <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="3" fill="none">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>
    )
}
