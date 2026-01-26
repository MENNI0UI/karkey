import React from "react"
import { useTranslation } from "@/lib/i18n-context"
import { WizardCard } from "@/components/ui/wizard-card"
import { MinimalTextInput } from "@/components/ui/minimal-input"

type StepProps = {
    data: any
    update: (patch: any) => void
    t: (key: string) => string
}

export function StepPricing({ data, update, t }: StepProps) {
    const { t: translate } = useTranslation()
    const priceTooLow = data.price && Number(data.price) < 10000
    const auctionConsent = data.auction_consent === true

    // Validate auction prices if consent is given
    const auctionStartingPriceError = auctionConsent && data.auction_starting_price && Number(data.auction_starting_price) < 5000
        ? translate("auction.consent.error.starting_min") || "Starting price must be at least 5,000 MAD"
        : undefined

    const auctionReservePriceError = auctionConsent && data.auction_reserve_price && data.auction_starting_price &&
        Number(data.auction_reserve_price) <= Number(data.auction_starting_price)
        ? translate("auction.consent.error.reserve_higher") || "Reserve price must be higher than starting price"
        : undefined

    return (
        <WizardCard
            title={translate("wizard.pricing.title") || "Sale Pricing"}
            stepIndicator={translate("wizard.progress.step_of", { current: 4, total: 5 }) || "Step 4 of 5"}
            subtitle={translate("wizard.pricing.subtitle") || "Set your asking price"}
        >
            <div className="space-y-8">
                {/* Direct Sale Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MinimalTextInput
                        label={t("askingPrice")}
                        required
                        type="number"
                        step={100}
                        value={data.price || ""}
                        onChange={(e) => update({ price: e.target.value })}
                        placeholder="e.g. 50000"
                        suffix={translate("common.mad")}
                        hint={translate("wizard.pricing.min_price") || "Minimum 10,000 MAD"}
                        error={priceTooLow ? translate("wizard.pricing.price_too_low") || "Price must be at least 10,000 MAD" : undefined}
                    />
                </div>

                {/* Auction Consent Section */}
                <div className="border-t border-gray-200 pt-6">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2 font-serif">
                                    {translate("auction.consent.title") || "Auction Option"}
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    {translate("auction.consent.description") || "If your car doesn't sell within 10 days through direct sale, would you like us to list it in our weekend auction? Auctions run every Saturday and Sunday."}
                                </p>

                                {/* Consent Toggle */}
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={auctionConsent}
                                            onChange={(e) => update({
                                                auction_consent: e.target.checked,
                                                // Clear auction prices if unchecked
                                                ...(!e.target.checked ? { auction_starting_price: undefined, auction_reserve_price: undefined } : {})
                                            })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                        {translate("auction.consent.agree") || "Yes, list in auction if not sold"}
                                    </span>
                                </label>

                                {/* Auction Prices - Only show if consent is given */}
                                {auctionConsent && (
                                    <div className="mt-6 p-4 bg-white rounded-lg border border-amber-100 space-y-4">
                                        <p className="text-sm text-gray-500 mb-4">
                                            {translate("auction.consent.set_prices") || "Please set your auction prices:"}
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <MinimalTextInput
                                                label={translate("auction.consent.starting_price") || "Starting Price"}
                                                required
                                                type="number"
                                                step={100}
                                                value={data.auction_starting_price || ""}
                                                onChange={(e) => update({ auction_starting_price: e.target.value })}
                                                placeholder="e.g. 30000"
                                                suffix={translate("common.mad")}
                                                hint={translate("auction.consent.starting_price_hint") || "Bidding starts at this price"}
                                                error={auctionStartingPriceError}
                                            />
                                            <MinimalTextInput
                                                label={translate("auction.consent.reserve_price") || "Reserve Price"}
                                                required
                                                type="number"
                                                step={100}
                                                value={data.auction_reserve_price || ""}
                                                onChange={(e) => update({ auction_reserve_price: e.target.value })}
                                                placeholder="e.g. 45000"
                                                suffix={translate("common.mad")}
                                                hint={translate("auction.consent.reserve_price_hint") || "Minimum price you'll accept"}
                                                error={auctionReservePriceError}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {translate("auction.consent.note") || "Note: If the car doesn't sell during the weekend auction, it will automatically return to direct sale."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </WizardCard>
    )
}
