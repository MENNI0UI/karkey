"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MapPin, GitCompare } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"
import { useAuth } from "@/lib/auth-context"
import { CarCardImageSlider } from "@/components/ui/car-card/card-image-slider"
import { CarSpecsGrid } from "@/components/ui/car-card/card-specs"
import ContactUsModal from "@/components/contact-us-modal"
import { WatchlistButton } from "@/components/watchlist-button"
import { useCompare, toCompareVehicle } from "@/hooks/use-comparison";
import { cn } from "@/lib/utils";
import { normalizePhotoUrl } from "@/lib/image-utils";


export function DirectSaleCard({
    item,
    priority = false,
    linkPrefix = "/direct-sales",
    viewMode = 'grid'
}: {
    item: any
    priority?: boolean
    linkPrefix?: string
    viewMode?: 'grid' | 'list'
}) {
    const { t, language } = useTranslation()
    const router = useRouter()
    const isList = viewMode === 'list'
    const { addToCompare, isInCompare, removeFromCompare } = useCompare()
    const isCompared = isInCompare(item.id)

    const toggleCompare = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (isCompared) {
            removeFromCompare(item.id)
        } else {
            addToCompare(toCompareVehicle(item, "sale", language))
        }
    }

    const {
        id,
        make,
        model,
        year,
        location,
        price,
        mileage,
        transmission,
        fuel_type,
        engine_size,
        doors,
        vehicle_condition,
        photos = [],
        user_id
    } = item

    const vehicleLabel = make ? `${make} ${model}` : (model ?? "vehicle")


    const normalizedPhotos = Array.isArray(photos) && photos.length > 0
        ? photos.map((p: any) => ({
            url: normalizePhotoUrl(typeof p === "string" ? p : (p.photo_url || p.url || "/placeholder.svg")),
            blurhash: (typeof p === 'object' && p.blurhash) ? p.blurhash : null
        }))
        : [{ url: "/placeholder.svg" }]

    // Use Auth Context instead of fetching in each card
    const { currentUserId, isLoaded: authLoaded } = useAuth()
    const [showContactModal, setShowContactModal] = useState(false)

    // Owner check - show buttons by default, hide only when CONFIRMED owner
    const confirmedOwner = !!(authLoaded && currentUserId && user_id && Number(currentUserId) === Number(user_id))

    const formattedPrice = new Intl.NumberFormat(language === "ar" ? "ar-MA" : "fr-MA", {
        style: "decimal",
        maximumFractionDigits: 0
    }).format(Number(price)) + " " + t('common.mad')

    return (
        <article
            className={`relative group bg-white rounded-3xl border border-gray-100 shadow-sm transition-all duration-300 flex ${isList ? 'flex-col md:flex-row' : 'flex-col'} h-full premium-card ${isList ? 'shine-sweep-slow' : 'shine-sweep'} overflow-hidden hover:scale-[1.015] hover:shadow-xl animate-fade-in-up`}
            style={{
                perspective: "1000px",
                willChange: "transform, opacity, box-shadow",
                transformStyle: "preserve-3d",
            }}
        >
            {/* Contact Modal Overlay */}
            {showContactModal && (
                <div className="absolute inset-0 z-[100] bg-white rounded-3xl shadow-lg">
                    <ContactUsModal
                        open={showContactModal}
                        onClose={() => setShowContactModal(false)}
                        directSaleId={id}
                        listingTitle={`${make} ${model}`}
                        listingPrice={price}
                        inline={true}
                    />
                </div>
            )}

            <div
                className={`relative ${isList ? 'md:w-80 lg:w-96 w-full h-64 md:h-auto' : 'w-full'}`}
                onMouseEnter={() => {
                    // 🏎️ Prefetch detail page for 0ms feel
                    router.prefetch(`/${language}${linkPrefix}/${id}`);
                }}
            >
                <CarCardImageSlider
                    itemId={id}
                    photos={normalizedPhotos}
                    href={`/${language}${linkPrefix}/${id}`}
                    alt={vehicleLabel}
                    priority={priority}
                    overlay={
                        !confirmedOwner && (
                            <WatchlistButton
                                id={id}
                                ownerUserId={user_id}
                                vehicleLabel={vehicleLabel}
                            />
                        )
                    }
                />
            </div>

            <div className={`p-4 flex flex-col flex-1 ${isList ? 'md:p-8' : ''}`}>
                <div className="flex-1 flex flex-col h-full">
                    <Link href={`/${language}${linkPrefix}/${id}`} className="flex flex-col flex-1">
                        {/* Always use Header Row Structure */}
                        <div className={`flex flex-wrap items-center justify-between gap-4 mb-4 ${!isList ? 'mb-2' : ''} relative`}>
                            {/* Compare Button - Only for Grid View */}
                            {!isList && (
                                <button
                                    onClick={toggleCompare}
                                    aria-label={isCompared ? t("compare.remove") : t("compare.add")}
                                    className={cn(
                                        "absolute top-0 end-0 z-20 w-10 h-10 rounded-full shadow-lg transition-all duration-500 flex items-center justify-center backdrop-blur-md border",
                                        isCompared
                                            ? "bg-[#B8071C] text-white border-white/20 rotate-12"
                                            : "bg-white/40 text-gray-500 border-white/40 hover:bg-[#103090]/10 hover:text-[#103090] opacity-0 group-hover:opacity-100"
                                    )}
                                    title={isCompared ? t("compare.remove") : t("compare.add")}
                                >
                                    <GitCompare className={cn("w-5 h-5 transition-transform", isCompared && "scale-110")} />
                                </button>
                            )}

                            <div className="flex items-center gap-2">
                                {make && (
                                    <span className="text-[10px] font-medium font-serif text-white bg-[#B8071C] px-3 py-1 rounded-full shadow-sm uppercase">
                                        {make}
                                    </span>
                                )}
                                <span className="text-[10px] font-bold font-serif text-[#B8071C] bg-[#B8071C]/10 px-2 py-0.5 rounded">
                                    {year}
                                </span>
                            </div>
                            <div className={`flex items-center gap-2 ${!isList ? 'hidden' : ''}`}>
                                <MapPin className="w-5 h-5 text-[#B8071C]" />
                                <span className="text-sm md:text-base font-medium font-serif text-gray-500">
                                    {t(`location.city.${(location || "").toLowerCase().replace(/\s+/g, '')}` as any) || location || t("common.unknown_location")}
                                </span>
                            </div>
                        </div>

                        {/* Title & Price / Location and Price depending on mode */}
                        {!isList && (
                            <>
                                <h3 className="text-xl font-bold font-serif text-[#103090] line-clamp-2 group-hover:text-[#B8071C] transition-colors mb-2">
                                    {model || vehicleLabel}
                                </h3>
                                <div className="mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-[#B8071C]" />
                                    <span className="text-sm md:text-base font-medium font-serif text-gray-500">{t(`location.city.${(location || "").toLowerCase().replace(/\s+/g, '')}` as any) || location || t("common.unknown_location")}</span>
                                </div>
                                <div className="mt-auto mb-4">
                                    <div className="text-2xl font-bold font-serif text-[#B8071C]">
                                        {formattedPrice}
                                    </div>
                                </div>
                            </>
                        )}

                        {isList && (
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b border-[#DEB735]/15 pb-6">
                                <h3 className="text-3xl lg:text-4xl font-bold font-serif text-[#103090] line-clamp-2 group-hover:text-[#B8071C] transition-colors">
                                    {model || vehicleLabel}
                                </h3>
                                <div className="text-3xl lg:text-4xl font-bold font-serif text-[#B8071C] whitespace-nowrap">
                                    {formattedPrice}
                                </div>
                            </div>
                        )}

                        <div className="flex-1">
                            {!isList && <div className="border-t border-[#DEB735]/25 my-4" />}
                            {isList && (
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-serif">
                                        {t("common.specifications" as any)}
                                    </h4>

                                    {/* Compare Button - List View Position */}
                                    <button
                                        onClick={(e) => {
                                            toggleCompare(e);
                                        }}
                                        aria-label={isCompared ? t("compare.remove") : t("compare.add")}
                                        className={cn(
                                            "z-20 w-9 h-9 rounded-full shadow-md transition-all duration-500 flex items-center justify-center backdrop-blur-md border",
                                            isCompared
                                                ? "bg-[#B8071C] text-white border-white/20 rotate-12"
                                                : "bg-white/80 text-gray-500 border-gray-200 hover:bg-[#103090]/10 hover:text-[#103090] opacity-0 group-hover:opacity-100"
                                        )}
                                        title={isCompared ? t("compare.remove") : t("compare.add")}
                                    >
                                        <GitCompare className={cn("w-4 h-4 transition-transform", isCompared && "scale-110")} />
                                    </button>
                                </div>
                            )}
                            <CarSpecsGrid
                                iconSize={isList ? 6 : 4}
                                gridCols={isList ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2'}
                                specs={[
                                    { iconUrl: "/icons/mileage.png", label: t("unit.km"), value: mileage },
                                    { iconUrl: "/icons/transmission.png", label: "", value: transmission ? t(`vehicle.transmission.${transmission.toLowerCase()}` as any) : undefined },
                                    { iconUrl: (fuel_type || "").toLowerCase() === "electric" ? "/icons/electric-fuel.png" : "/icons/fuel.png", label: "", value: fuel_type ? t(`vehicle.fuel.${fuel_type.toLowerCase()}` as any) : undefined },
                                    { iconUrl: "/icons/car-door.png", label: t("vehicle.doors"), value: doors ?? undefined },
                                    {
                                        iconUrl: "/icons/condition.png",
                                        label: "",
                                        value: vehicle_condition ? t(`vehicle.condition.${vehicle_condition.toLowerCase()}` as any) : undefined,
                                        variant: (vehicle_condition || "").toLowerCase().includes("excellent") ? "green" : "default"
                                    },
                                    { iconUrl: "/icons/engine.png", label: t("unit.liter"), value: engine_size ?? undefined }
                                ]}
                            />
                        </div>
                    </Link>

                    <div className={`mt-6 flex ${isList ? 'flex-row' : 'flex-col'} gap-2`}>
                        <Link
                            href={`/${language}${linkPrefix}/${id}`}
                            className={`flex-1 bg-[#B8071C] hover:bg-[#910515] text-white font-bold font-serif ${isList ? 'py-3' : 'py-2.5'} rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] uppercase text-sm tracking-widest`}
                        >
                            {t("common.view")}
                        </Link>
                        {!confirmedOwner && (
                            <button
                                onClick={() => setShowContactModal(true)}
                                className={`flex-1 bg-[#B8071C] hover:bg-[#910515] hover:border hover:border-[#DEB735] text-white font-bold font-serif ${isList ? 'py-3' : 'py-2.5'} rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] uppercase text-sm tracking-widest`}
                            >
                                {t("common.contact_us")}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    )
}
