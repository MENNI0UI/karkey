"use client"

import React from "react"
import { useTranslation } from "@/lib/i18n-context"
import { MinimalInputWrapper } from "@/components/ui/minimal-input"
import { DollarSign, Gavel, Tag, TrendingUp, Zap, BarChart, Info, ShieldCheck, Sparkles } from "lucide-react"
import { WizardCard } from "@/components/ui/wizard-card"

type StepPricingProps = {
    data: any
    update: (patch: any) => void
    t: (key: string) => string
    errors?: Record<string, string>
}

export function StepPricing({ data, update, t, errors = {} }: StepPricingProps) {
    const { t: translate } = useTranslation()

    return (
        <div className="space-y-12 pb-10">
            {/* 1. Base Valuation Section */}
            <WizardCard
                title={translate("wizard.pricing.title") || "Sale Pricing"}
                subtitle={translate("wizard.pricing.subtitle") || "Set your asking price"}
                stepIndicator={translate("wizard.progress.step_of", { current: 4, total: 5 })}
                className="overflow-visible"
            >
                <div className="max-w-2xl space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <MinimalInputWrapper
                            label={translate("wizard.pricing.asking_price") || "Asking Price (MAD)"}
                            error={errors.price}
                            hint={translate("wizard.pricing.hint") || "Set a competitive price based on market value"}
                            tooltip={translate("wizard.pricing.asking_price_tooltip")}
                        >
                            <div className="relative group">
                                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none transition-colors group-focus-within:text-[#103090]">
                                    <Tag className="w-5 h-5 text-gray-300" />
                                </div>
                                <input
                                    type="number"
                                    step="5000"
                                    min="0"
                                    value={data.price || ""}
                                    onChange={(e) => update({ price: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-transparent border-0 px-0 py-2 text-2xl font-black text-[#103090] placeholder-gray-200 focus:outline-none transition-all font-serif ps-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="absolute ltr:right-4 rtl:left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest pointer-events-none">
                                    {translate("common.mad")}
                                </span>
                            </div>
                        </MinimalInputWrapper>

                        {/* Price Visualizer Card */}
                        <div className={`relative overflow-hidden rounded-[32px] p-8 border transition-all duration-700 ${data.price && Number(data.price) > 0
                            ? "bg-gradient-to-br from-[#103090] to-[#081b50] text-white border-transparent shadow-2xl scale-100"
                            : "bg-gray-50/50 border-gray-100 text-gray-400 scale-[0.98]"
                            }`}>
                            <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12">
                                <DollarSign className="w-24 h-24" />
                            </div>
                            <div className="relative z-10 space-y-2">
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${data.price ? "text-blue-200/60" : "text-gray-400"}`}>
                                    {translate("wizard.pricing.your_price") || "Your Asking Price"}
                                </p>
                                {data.price && Number(data.price) > 0 ? (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black font-serif tracking-tight">
                                            {Number(data.price).toLocaleString()}
                                        </span>
                                        <span className="text-sm font-bold opacity-60 uppercase">{translate("common.mad")}</span>
                                    </div>
                                ) : (
                                    <p className="text-sm font-medium italic opacity-50">Awaiting valuation...</p>
                                )}
                            </div>
                            {data.price && (
                                <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                                    <span className="text-[9px] font-black text-blue-100 uppercase tracking-widest">Pricing Strategy Active</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </WizardCard>

            {/* 2. Sales Strategy Section */}
            <div className="space-y-8 pb-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-[#DEB735]" />
                            <h3 className="text-[10px] font-black text-[#103090]/60 uppercase tracking-[0.3em] font-serif">
                                {translate("wizard.pricing.strategy_title")}
                            </h3>
                        </div>
                        <h2 className="text-2xl font-bold text-[#103090] font-serif tracking-tight">
                            {translate("wizard.pricing.strategy_subtitle")}
                        </h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    {/* The Liquidity Booster Extension Card */}
                    <div className="md:col-span-12 lg:col-span-8">
                        <div
                            onClick={() => update({ auction_consent: !data.auction_consent })}
                            className={`group relative overflow-hidden rounded-[40px] border-2 transition-all duration-700 cursor-pointer p-1 ${data.auction_consent
                                ? "bg-gradient-to-br from-indigo-50/50 to-white border-indigo-200 shadow-[0_30px_60px_rgba(79,70,229,0.08)]"
                                : "bg-white border-gray-100 hover:border-indigo-100 hover:shadow-xl"
                                }`}>
                            <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start">
                                {/* Visual Badge Left */}
                                <div className={`hidden md:flex w-24 h-24 rounded-[32px] items-center justify-center shrink-0 transition-all duration-700 ${data.auction_consent ? "bg-indigo-600 text-white rotate-6 scale-110" : "bg-gray-50 text-gray-300 group-hover:bg-indigo-50 group-hover:text-indigo-300"
                                    }`}>
                                    <Zap className="w-10 h-10 fill-current" />
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <TrendingUp className={`w-4 h-4 ${data.auction_consent ? "text-indigo-600" : "text-gray-400"}`} />
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{translate("wizard.pricing.marketing_extension")}</span>
                                            </div>
                                            <h3 className="text-2xl font-bold text-[#103090] font-serif">{translate("wizard.pricing.liquidity_booster")}</h3>
                                        </div>
                                        <div className={`px-4 py-2 rounded-2xl border flex items-center gap-3 transition-all duration-500 ${data.auction_consent ? "bg-indigo-600 border-transparent text-white shadow-lg" : "bg-white border-gray-100 text-[#103090]"
                                            }`}>
                                            <div className={`w-2 h-2 rounded-full animate-pulse ${data.auction_consent ? "bg-white" : "bg-indigo-400"}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                {data.auction_consent ? translate("wizard.pricing.enabled") : translate("wizard.pricing.upgrade_listing")}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-gray-500 text-base leading-relaxed max-w-2xl font-medium">
                                        {translate("wizard.pricing.auction_extension_desc")}
                                    </p>

                                    <div className="flex flex-wrap gap-4 pt-4">
                                        <div className="flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-full text-indigo-600">
                                            <BarChart className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-tight">{translate("wizard.pricing.visibility_boost")}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-full text-indigo-600">
                                            <Gavel className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-tight">{translate("wizard.pricing.bidding_hub")}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Conditional Auction Prices - Refined Grid */}
                        {data.auction_consent && (
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 p-10 bg-indigo-50/20 rounded-[40px] border border-indigo-100/50 animate-in fade-in slide-in-from-top-6 duration-700">
                                <MinimalInputWrapper
                                    label={translate("auction.consent.starting_price") || "Auction Starting Price"}
                                    error={errors.auction_starting_price}
                                    hint={translate("auction.consent.starting_price_hint")}
                                    tooltip={translate("wizard.pricing.auction_starting_price_tooltip")}
                                >
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none group-focus-within:text-indigo-600 transition-colors">
                                            <Gavel className="w-5 h-5 text-gray-300" />
                                        </div>
                                        <input
                                            type="number"
                                            step="5000"
                                            min="0"
                                            value={data.auction_starting_price || ""}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const patch: any = { auction_starting_price: val };
                                                if (val && (!data.auction_reserve_price || Number(data.auction_reserve_price) < Number(val))) {
                                                    patch.auction_reserve_price = val;
                                                }
                                                update(patch);
                                            }}
                                            placeholder="0"
                                            className="w-full bg-transparent border-0 px-0 py-2 text-xl font-black text-[#103090] placeholder-gray-200 focus:outline-none transition-all ps-12 font-serif"
                                        />
                                        <span className="absolute ltr:right-4 rtl:left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">
                                            {translate("common.mad")}
                                        </span>
                                    </div>
                                </MinimalInputWrapper>

                                <MinimalInputWrapper
                                    label={translate("auction.consent.reserve_price") || "Reserve Price"}
                                    error={errors.auction_reserve_price}
                                    hint={translate("auction.consent.reserve_price_hint")}
                                    tooltip={translate("wizard.pricing.auction_reserve_price_tooltip")}
                                >
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none group-focus-within:text-indigo-600 transition-colors">
                                            <ShieldCheck className="w-5 h-5 text-gray-300" />
                                        </div>
                                        <input
                                            type="number"
                                            step="5000"
                                            value={data.auction_reserve_price || ""}
                                            min={data.auction_starting_price || 0}
                                            onChange={(e) => update({ auction_reserve_price: e.target.value })}
                                            placeholder="0"
                                            className="w-full bg-transparent border-0 px-0 py-2 text-xl font-black text-[#103090] placeholder-gray-200 focus:outline-none transition-all ps-12 font-serif"
                                        />
                                        <span className="absolute ltr:right-4 rtl:left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">
                                            {translate("common.mad")}
                                        </span>
                                    </div>
                                </MinimalInputWrapper>

                                <div className="md:col-span-2 flex items-start gap-4 p-5 bg-white/60 backdrop-blur-sm rounded-2xl border border-indigo-100/30">
                                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                                        <Info className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm text-indigo-900/70 leading-relaxed font-medium">
                                        {translate("auction.consent.note")}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
