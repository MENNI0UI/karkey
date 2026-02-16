"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n-context"
import { MapPin, MessageCircle, GitCompare } from "lucide-react"
import { CarCardImageSlider } from "@/components/ui/car-card/card-image-slider"
import { CarSpecsGrid } from "@/components/ui/car-card/card-specs"
import { ScaleButton } from "@/components/ui/motion-wrappers"
import dynamic from "next/dynamic"
import { useCompare, toCompareVehicle } from "@/hooks/use-comparison"
import { cn } from "@/lib/utils"

const KarkeyInquiryModal = dynamic(() => import("@/components/karkey-inquiry-modal"), { ssr: false })

interface KarkeyCarPhoto {
    id: number
    photo_url: string
    position_order: number
    blurhash?: string | null
}

interface KarkeyCar {
    id: number
    make: string
    model: string
    year: number
    mileage: number
    transmission: string
    fuel_type: string
    engine_size?: string | null
    doors?: string | null
    vehicle_condition: string
    location: string
    description: string
    price: string | number
    photos: KarkeyCarPhoto[]
}

interface KarkeyCarCardProps {
    car: KarkeyCar
    onContact?: (car: KarkeyCar) => void
    priority?: boolean
}

export default function KarkeyCarCard({ car, onContact, priority = false }: KarkeyCarCardProps) {
    const { t, language } = useTranslation()
    const [contactOpen, setContactOpen] = useState(false)
    const { addToCompare, isInCompare, removeFromCompare } = useCompare()

    const isCompared = isInCompare(car.id)

    const toggleCompare = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (isCompared) {
            removeFromCompare(car.id)
        } else {
            addToCompare(toCompareVehicle(car, "karkey", language))
        }
    }

    const handleContactClick = () => {
        if (onContact) {
            onContact(car)
        } else {
            setContactOpen(true)
        }
    }

    return (
        <div className="relative">
            {/* Contact Modal Overlay - Outside overflow-hidden container */}
            {contactOpen && (
                <div className="absolute inset-0 z-[100] bg-white rounded-3xl shadow-lg">
                    <KarkeyInquiryModal
                        car={car}
                        isOpen={contactOpen}
                        onClose={() => setContactOpen(false)}
                        inline={true}
                    />
                </div>
            )}
            <div className={`bg-white rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-[#DEB735] group karkey-card font-serif premium-card shine-sweep ${contactOpen ? 'invisible' : ''}`}>
                {/* Photo Section (taller) */}
                <CarCardImageSlider
                    photos={(car.photos || []).map(p => {
                        const s = String(p.photo_url || "").trim()
                        // If it's a data URI or external URL without blurhash support, return string
                        if (s.startsWith("data:") || s.startsWith("http://") || s.startsWith("https://")) return s

                        let filename = s
                        if (s.includes("/")) filename = s.split("/").pop() || s

                        return {
                            url: `https://img.karkey.space/vehicles/${filename}`,
                            blurhash: p.blurhash || null // Use the blurhash from the car object if available
                        }
                    })}
                    alt={`${car.make} ${car.model}`}
                    href={`/${language}/karkey-cars/${car.id}`}
                    showPhotoCount={false}
                    priority={priority}
                    badges={
                        <div className="bg-[#103090] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm border border-white/20">
                            Karkey
                        </div>
                    }
                />


                {/* Content Section */}
                <div className="p-4 flex flex-col flex-1 relative">
                    {/* Compare Button (Absolute Top Right of Content) */}
                    <button
                        onClick={toggleCompare}
                        className={cn(
                            "absolute top-4 end-4 z-20 w-10 h-10 rounded-full shadow-lg transition-all duration-500 flex items-center justify-center backdrop-blur-md border",
                            isCompared
                                ? "bg-[#B8071C] text-white border-white/20 rotate-12"
                                : "bg-white/40 text-gray-500 border-white/40 hover:bg-[#103090]/10 hover:text-[#103090] opacity-0 group-hover:opacity-100"
                        )}
                        title={isCompared ? t("compare.remove") : t("compare.add")}
                    >
                        <GitCompare className={cn("w-5 h-5 transition-transform", isCompared && "scale-110")} />
                    </button>

                    <Link href={`/${language}/karkey-cars/${car.id}`} className="flex-1">
                        {/* Title & Year */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className={`text-xl font-serif text-[#103090] line-clamp-1 group-hover:text-[#B8071C] transition-colors ${language === 'ar' ? 'font-bold' : 'font-medium'}`}>
                                {car.make} {car.model}
                            </h3>
                        </div>

                        {/* Year */}
                        <div className="mb-1">
                            <span className={`text-xs font-serif text-[#B8071C] bg-[#B8071C]/10 px-2 py-0.5 rounded ${language === 'ar' ? 'font-bold' : 'font-medium'}`}>
                                {car.year}
                            </span>
                        </div>

                        {/* Location */}
                        <div className="mb-3">
                            <span className="text-sm font-medium font-serif text-gray-500 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-[#B8071C]" />
                                {t(`location.city.${car.location.toLowerCase().replaceAll(/\s+/g, '')}` as any) || car.location}
                            </span>
                        </div>

                        {/* Price */}
                        <div className={`text-2xl font-serif text-[#B8071C] mb-4 ${language === 'ar' ? 'font-bold' : 'font-medium'}`}>
                            {new Intl.NumberFormat(language === "ar" ? "ar-MA" : "fr-MA", {
                                style: "decimal",
                                maximumFractionDigits: 0,
                            }).format(typeof car.price === "string" ? Number.parseFloat(car.price) : car.price) + " " + t('common.mad')}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-[#DEB735]/25 my-4" />

                        {/* Quick Specs Grid */}
                        <CarSpecsGrid
                            specs={[
                                { iconUrl: "/icons/mileage.png", label: "km", value: car.mileage.toLocaleString() },
                                { iconUrl: "/icons/transmission.png", label: "", value: t(`vehicle.transmission.${car.transmission}` as any) },
                                {
                                    iconUrl: (car.fuel_type || "").toLowerCase().includes("electric") ? "/icons/electric-fuel.png" : "/icons/fuel.png",
                                    label: "",
                                    value: t(`vehicle.fuel.${car.fuel_type}` as any),
                                    variant: (car.fuel_type || "").toLowerCase().includes("electric") || (car.fuel_type || "").toLowerCase().includes("hybrid") ? "green" : "default"
                                },
                                {
                                    iconUrl: "/icons/condition.png",
                                    label: "",
                                    value: t(`vehicle.condition.${car.vehicle_condition}` as any),
                                    variant: (car.vehicle_condition || "").toLowerCase().includes("excellent") ? "green" : "default"
                                },
                                { iconUrl: "/icons/engine.png", label: t("unit.liter"), value: car.engine_size ?? undefined },
                                { iconUrl: "/icons/car-door.png", label: t("vehicle.doors"), value: car.doors ?? undefined }
                            ]}
                        />
                    </Link>

                    {/* Divider */}
                    <div className="border-t border-[#DEB735]/25 mb-4 mt-2" />

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto">
                        <Link
                            href={`/${language}/karkey-cars/${car.id}`}
                            className={`flex-1 bg-[#B8071C] hover:bg-[#910515] text-white font-serif py-2 px-2 rounded-2xl flex items-center justify-center gap-1 transition-all text-sm whitespace-nowrap ${language === 'ar' ? 'font-bold' : 'font-medium'}`}
                        >
                            {t("common.view_details")}
                        </Link>
                        <ScaleButton
                            onClick={handleContactClick}
                            className="bg-[#B8071C] hover:bg-[#910515] text-white font-bold font-serif py-2 px-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
                            title={t("karkey_cars.contact")}
                        >
                            <MessageCircle className="w-5 h-5" />
                        </ScaleButton>
                    </div>
                </div>
            </div>
        </div>
    )
}
