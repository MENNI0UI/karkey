"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useTranslation } from "@/lib/i18n-context"
import type { TranslationKey } from "@/lib/locales"
import {
    Car,
    MapPin,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    PaintBucket,
    Gauge,
    Settings2,
    Fuel,
    Info,
    DoorOpen,
} from "lucide-react"
import PhotoViewer from "@/components/photo-viewer"

export interface CarData {
    id: string | number
    make: string
    model: string
    year: number | string
    price?: number | string
    mileage: number | string
    transmission: string
    fuel_type: string
    condition: string
    location: string
    description: string
    engine_size?: string
    doors?: string
    exterior_color?: string
    interior_color?: string
    is_original_paint?: boolean
    special_features?: string
    photos: { id?: number | string; url: string }[]
}

export interface SellerData {
    name: string
    avatar: string
    id?: string | number
    joinDate?: string
}

interface UnifiedCarLayoutProps {
    car: CarData
    seller?: SellerData
    isLoading?: boolean
    action?: React.ReactNode
    imageOverlay?: React.ReactNode
    galleryFooter?: React.ReactNode
    badges?: React.ReactNode
    extraContent?: React.ReactNode
    backLink?: () => void
    children?: React.ReactNode
}

export default function UnifiedCarLayout({
    car,
    seller,
    isLoading,
    action,
    imageOverlay,
    galleryFooter,
    badges,
    extraContent,
    backLink,
    children
}: UnifiedCarLayoutProps) {
    const { t, language } = useTranslation()
    const router = useRouter()
    const isRTL = language === "ar"
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
    const [isViewerOpen, setIsViewerOpen] = useState(false)
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
    const [isSpecialFeaturesExpanded, setIsSpecialFeaturesExpanded] = useState(false)
    const thumbnailsRef = useRef<HTMLDivElement>(null)

    // Touch swipe state
    const touchStartX = useRef<number>(0)
    const touchEndX = useRef<number>(0)
    const isSwiping = useRef<boolean>(false)



    const photos = car?.photos || []

    // Auto-scroll thumbnails when main photo changes
    useEffect(() => {
        if (thumbnailsRef.current && photos.length > 0) {
            const container = thumbnailsRef.current
            const thumbnail = container.children[currentPhotoIndex] as HTMLElement
            if (thumbnail) {
                const containerWidth = container.offsetWidth
                const thumbnailLeft = thumbnail.offsetLeft
                const thumbnailWidth = thumbnail.offsetWidth
                const scrollPosition = thumbnailLeft - (containerWidth / 2) + (thumbnailWidth / 2)
                container.scrollTo({ left: scrollPosition, behavior: 'smooth' })
            }
        }
    }, [currentPhotoIndex, photos.length])

    const normalizePhotoUrl = (p: string | null | undefined) => {
        if (!p) return "/placeholder-car.jpg"
        const s = String(p).trim()
        if (s.startsWith("data:image/")) return s
        if (s.startsWith("blob:")) return s
        if (s.startsWith("http://") || s.startsWith("https://")) {
            try {
                const url = new URL(s)
                if (url.protocol === 'http:' || url.protocol === 'https:') return s
            } catch { return "/placeholder-car.jpg" }
        }
        const filename = s.includes("/") ? (s.split("/").pop() || s) : s
        return `https://img.karkey.space/vehicles/${filename}`
    }

    const formatPrice = (price: string | number | undefined) => {
        if (price === undefined || price === null || price === "") return null
        const numPrice = typeof price === "string" ? parseFloat(price) : price
        if (isNaN(numPrice)) return price
        return new Intl.NumberFormat(language === "ar" ? "ar-MA" : "fr-MA", {
            style: "decimal",
            maximumFractionDigits: 0,
        }).format(numPrice) + " " + t("common.mad")
    }

    const nextPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
    }

    const prevPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
    }

    // Touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
        isSwiping.current = true
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping.current) return
        touchEndX.current = e.touches[0].clientX
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!isSwiping.current) return
        isSwiping.current = false

        const diff = touchStartX.current - touchEndX.current
        const minSwipeDistance = 50

        if (Math.abs(diff) > minSwipeDistance) {
            if (diff > 0) {
                // Swiped left -> next
                nextPhoto()
            } else {
                // Swiped right -> prev
                prevPhoto()
            }
        }

        touchStartX.current = 0
        touchEndX.current = 0
    }



    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <div className="w-full max-w-4xl p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-72 bg-[#ececec] rounded-3xl" />
                        <div className="h-6 w-2/3 bg-[#ececec] rounded" />
                        <div className="h-4 w-1/3 bg-[#ececec] rounded" />
                    </div>
                </div>
            </div>
        )
    }

    if (!car) return null

    return (
        <div className="min-h-screen bg-white font-serif" dir={isRTL ? "rtl" : "ltr"}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">
                {/* Back Link */}
                <button
                    onClick={backLink || (() => router.back())}
                    className="flex items-center gap-2 text-gray-500 hover:text-[#B8071C] mb-4 transition-colors group"
                >
                    <ChevronLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''} group-hover:-translate-x-1 transition-transform`} />
                    <span className="font-medium">{t("common.back")}</span>
                </button>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-[55%_45%]">
                    {/* Left: Photos Area */}
                    <div className="space-y-4">
                        <div
                            className="relative aspect-square md:aspect-[16/10] bg-gray-100 rounded-3xl overflow-hidden shadow-2xl touch-pan-y"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            {photos.length > 0 ? (
                                <>
                                    <div
                                        className="w-full h-full cursor-zoom-in"
                                        onClick={() => { setIsViewerOpen(true); setCurrentPhotoIndex(currentPhotoIndex) }}
                                        style={{
                                            // 🏎️ 2026 View Transition: Match the card's image name for fluid morphing
                                            viewTransitionName: car?.id ? `car-card-${car.id}` : undefined
                                        } as any}
                                    >
                                        <Image
                                            src={normalizePhotoUrl(photos[currentPhotoIndex]?.url)}
                                            alt={`${car.make} ${car.model}`}
                                            fill
                                            className="object-contain object-center bg-gray-100"
                                            priority
                                            unoptimized={true}
                                            sizes="(max-width: 768px) 100vw, 800px"
                                        />
                                    </div>
                                    {imageOverlay && (
                                        <div className="absolute bottom-4 left-4 z-10 max-w-full overflow-hidden rounded-lg">
                                            {imageOverlay}
                                        </div>
                                    )}
                                    {photos.length > 1 && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); prevPhoto() }}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full items-center justify-center text-[#103090] shadow-lg hover:bg-white transition-all scale-90 hover:scale-100 z-20 hidden md:flex"
                                            >
                                                <ChevronLeft className={`w-6 h-6 ${isRTL ? 'rotate-180' : ''}`} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); nextPhoto() }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full items-center justify-center text-[#103090] shadow-lg hover:bg-white transition-all scale-90 hover:scale-100 z-20 hidden md:flex"
                                            >
                                                <ChevronRight className={`w-6 h-6 ${isRTL ? 'rotate-180' : ''}`} />
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                    <Car className="w-20 h-20 mb-4 opacity-20" />
                                    <p>No photos available</p>
                                </div>
                            )}
                        </div>

                        {/* Scrollable Thumbnails */}
                        {photos.length > 1 && (
                            <div
                                ref={thumbnailsRef}
                                className="flex gap-2 overflow-x-auto py-1 px-1 -mx-1"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {photos.map((photo, idx) => (
                                    <button
                                        key={photo.id || idx}
                                        onClick={() => setCurrentPhotoIndex(idx)}
                                        className={`flex-shrink-0 w-20 h-14 relative rounded-lg overflow-hidden transition-all ${idx === currentPhotoIndex
                                            ? "ring-2 ring-[#B8071C] ring-offset-1 opacity-100"
                                            : "opacity-60 hover:opacity-100"
                                            }`}
                                    >
                                        <Image
                                            src={normalizePhotoUrl(photo.url)}
                                            alt=""
                                            fill
                                            className="object-cover"
                                            sizes="80px"
                                            unoptimized={true}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {galleryFooter && (
                            <div className="mt-6">
                                {galleryFooter}
                            </div>
                        )}

                        {/* DESKTOP ONLY: Special Features & Description in Left column */}
                        <div key="desktop-descriptive-sections" className="hidden lg:block">
                            {/* Special Features */}
                            {car.special_features && (
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <h3 className="text-xl font-bold text-[#103090] mb-4 flex items-center gap-2 font-serif">
                                        <svg className="w-5 h-5 text-[#B8071C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                                        </svg>
                                        {t("vehicle.special_features")}
                                    </h3>
                                    <div className="relative">
                                        <p className={`text-gray-600 leading-relaxed whitespace-pre-wrap text-[17px] font-sans ${!isSpecialFeaturesExpanded ? 'line-clamp-4' : ''}`}>
                                            {car.special_features}
                                        </p>
                                        {(car.special_features.length > 150 || (car.special_features.match(/\n/g) || []).length > 2) && (
                                            <button
                                                onClick={() => setIsSpecialFeaturesExpanded(!isSpecialFeaturesExpanded)}
                                                className="mt-2 text-[#B8071C] font-semibold flex items-center gap-1 hover:underline font-sans"
                                            >
                                                {isSpecialFeaturesExpanded ? (
                                                    <>
                                                        {t("common.show_less")} <ChevronUp className="w-4 h-4" />
                                                    </>
                                                ) : (
                                                    <>
                                                        {t("common.show_more")} <ChevronDown className="w-4 h-4" />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <h3 className="text-xl font-bold text-[#103090] mb-4 font-serif">{t("vehicle.description")}</h3>
                                <div className="relative">
                                    <p className={`text-gray-600 leading-relaxed whitespace-pre-wrap text-[17px] font-sans ${!isDescriptionExpanded ? 'line-clamp-4' : ''}`}>
                                        {car.description}
                                    </p>
                                    {car.description && (car.description.length > 150 || (car.description.match(/\n/g) || []).length > 2) && (
                                        <button
                                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                            className="mt-2 text-[#B8071C] font-semibold flex items-center gap-1 hover:underline font-sans"
                                        >
                                            {isDescriptionExpanded ? (
                                                <>
                                                    {t("common.show_less")} <ChevronUp className="w-4 h-4" />
                                                </>
                                            ) : (
                                                <>
                                                    {t("common.show_more")} <ChevronDown className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Info Area */}
                    <div className="flex flex-col">
                        <div className="flex-1">
                            {/* Seller Info (if present) */}
                            {seller && (
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                                        {seller.avatar && seller.avatar !== "/placeholder.svg" ? (
                                            <Image
                                                src={seller.avatar}
                                                alt={seller.name}
                                                width={40}
                                                height={40}
                                                className="w-full h-full object-cover"
                                                priority
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#103090] to-[#B8071C] flex items-center justify-center text-white font-bold font-serif text-lg">
                                                {seller.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#103090]">{seller.name}</p>
                                    </div>
                                </div>
                            )}

                            <h1 className="text-2xl md:text-3xl font-bold font-serif text-[#103090] mb-1 leading-tight">
                                {car.make} {car.model}
                            </h1>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-[#B8071C] text-white font-bold px-4 py-1 rounded-full text-base">
                                    {car.year}
                                </span>
                                <div className="flex items-center gap-1.5 text-gray-500 font-medium text-base">
                                    <MapPin className="w-5 h-5 text-[#B8071C]" />
                                    {t(`location.city.${(car.location || "").toLowerCase().replace(/\s+/g, '')}` as any) || car.location}
                                </div>
                            </div>

                            {(() => {
                                const priceDisplay = formatPrice(car.price);
                                if (!priceDisplay) return null;
                                return (
                                    <div className="text-2xl md:text-3xl font-bold font-serif text-[#B8071C] mb-6">
                                        {priceDisplay}
                                    </div>
                                );
                            })()}

                            <div className="grid grid-cols-2 gap-6 p-7 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                                <div className="space-y-0.5">
                                    <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t("vehicle.mileage")}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-4 h-4">
                                            <Image src="/icons/mileage.png" alt="" fill className="object-contain" style={{ filter: 'invert(16%) sepia(95%) saturate(3500%) hue-rotate(348deg) brightness(85%) contrast(95%)' }} />
                                        </div>
                                        <p className="text-lg font-bold text-[#103090]">{Number(car.mileage).toLocaleString()} {t("unit.km")}</p>
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t("vehicle.transmission")}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-4 h-4">
                                            <Image src="/icons/transmission.png" alt="" fill className="object-contain" style={{ filter: 'invert(16%) sepia(95%) saturate(3500%) hue-rotate(348deg) brightness(85%) contrast(95%)' }} />
                                        </div>
                                        <p className="text-lg font-bold text-[#103090] capitalize">
                                            {/* @ts-expect-error dynamic key */}
                                            {t(`vehicle.transmission.${String(car.transmission).toLowerCase()}`) !== `vehicle.transmission.${String(car.transmission).toLowerCase()}` ? t(`vehicle.transmission.${String(car.transmission).toLowerCase()}`) : car.transmission}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t("vehicle.fuel")}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-4 h-4">
                                            <Image src="/icons/fuel.png" alt="" fill className="object-contain" style={{ filter: 'invert(16%) sepia(95%) saturate(3500%) hue-rotate(348deg) brightness(85%) contrast(95%)' }} />
                                        </div>
                                        <p className="text-lg font-bold text-[#103090] capitalize">
                                            {/* @ts-expect-error dynamic key */}
                                            {t(`vehicle.fuel.${String(car.fuel_type).toLowerCase()}`) !== `vehicle.fuel.${String(car.fuel_type).toLowerCase()}` ? t(`vehicle.fuel.${String(car.fuel_type).toLowerCase()}`) : car.fuel_type}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t("vehicle.condition")}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-4 h-4">
                                            <Image src="/icons/condition.png" alt="" fill className="object-contain" style={{ filter: 'invert(16%) sepia(95%) saturate(3500%) hue-rotate(348deg) brightness(85%) contrast(95%)' }} />
                                        </div>
                                        <p className="text-lg font-bold text-[#103090] capitalize">
                                            {/* @ts-expect-error dynamic key */}
                                            {t(`vehicle.condition.${String(car.condition).toLowerCase()}`) !== `vehicle.condition.${String(car.condition).toLowerCase()}` ? t(`vehicle.condition.${String(car.condition).toLowerCase()}`) : car.condition}
                                        </p>
                                    </div>
                                </div>
                                {car.engine_size && (
                                    <div className="space-y-0.5">
                                        <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t("vehicle.engine_size")}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-4 h-4">
                                                <Image src="/icons/engine.png" alt="" fill className="object-contain" style={{ filter: 'invert(16%) sepia(95%) saturate(3500%) hue-rotate(348deg) brightness(85%) contrast(95%)' }} />
                                            </div>
                                            <p className="text-lg font-bold text-[#103090]">{car.engine_size}</p>
                                        </div>
                                    </div>
                                )}
                                {car.doors && (
                                    <div className="space-y-0.5">
                                        <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t("vehicle.doors")}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-4 h-4">
                                                <Image src="/icons/car-door.png" alt="" fill className="object-contain" style={{ filter: 'invert(16%) sepia(95%) saturate(3500%) hue-rotate(348deg) brightness(85%) contrast(95%)' }} />
                                            </div>
                                            <p className="text-lg font-bold text-[#103090]">{car.doors}</p>
                                        </div>
                                    </div>
                                )}
                                {car.exterior_color && (
                                    <div className="space-y-0.5">
                                        <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t("wizard.fields.exterior_color")}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: car.exterior_color }} />
                                            <p className="text-lg font-bold text-[#103090] capitalize">{t(`colors.${car.exterior_color}` as TranslationKey)}</p>
                                        </div>
                                    </div>
                                )}
                                {car.interior_color && (
                                    <div className="space-y-0.5">
                                        <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t("wizard.fields.interior_color")}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: car.interior_color }} />
                                            <p className="text-lg font-bold text-[#103090] capitalize">{t(`colors.${car.interior_color}` as TranslationKey)}</p>
                                        </div>
                                    </div>
                                )}
                                {car.is_original_paint !== undefined && (
                                    <div className="space-y-0.5">
                                        <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t("wizard.fields.original_paint")}</p>
                                        <div className="flex items-center gap-2">
                                            <PaintBucket className="w-4 h-4 text-[#B8071C]" />
                                            <p className="text-lg font-bold text-[#103090]">
                                                {car.is_original_paint ? t("common.yes") : t("common.no")}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* MOBILE ONLY: Special Features & Description in Right column (above actions) */}
                            <div key="mobile-descriptive-sections" className="lg:hidden">
                                {/* Special Features */}
                                {car.special_features && (
                                    <div className="mt-8 pt-6 border-t border-gray-100">
                                        <h3 className="text-lg font-bold text-[#103090] mb-2 flex items-center gap-2 font-serif">
                                            <svg className="w-4 h-4 text-[#B8071C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                                            </svg>
                                            {t("vehicle.special_features")}
                                        </h3>
                                        <div className="relative">
                                            <p className={`text-gray-600 leading-relaxed whitespace-pre-wrap text-base font-sans ${!isSpecialFeaturesExpanded ? 'line-clamp-4' : ''}`}>
                                                {car.special_features}
                                            </p>
                                            {(car.special_features.length > 150 || (car.special_features.match(/\n/g) || []).length > 2) && (
                                                <button
                                                    onClick={() => setIsSpecialFeaturesExpanded(!isSpecialFeaturesExpanded)}
                                                    className="mt-1 text-[#B8071C] font-semibold flex items-center gap-1 hover:underline text-sm font-sans"
                                                >
                                                    {isSpecialFeaturesExpanded ? (
                                                        <>
                                                            {t("common.show_less")} <ChevronUp className="w-3 h-3" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            {t("common.show_more")} <ChevronDown className="w-3 h-3" />
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <h3 className="text-lg font-bold text-[#103090] mb-2 font-serif">{t("vehicle.description")}</h3>
                                    <div className="relative">
                                        <p className={`text-gray-600 leading-relaxed whitespace-pre-wrap text-base font-sans ${!isDescriptionExpanded ? 'line-clamp-4' : ''}`}>
                                            {car.description}
                                        </p>
                                        {car.description && (car.description.length > 150 || (car.description.match(/\n/g) || []).length > 2) && (
                                            <button
                                                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                                className="mt-1 text-[#B8071C] font-semibold flex items-center gap-1 hover:underline text-sm font-sans"
                                            >
                                                {isDescriptionExpanded ? (
                                                    <>
                                                        {t("common.show_less")} <ChevronUp className="w-3 h-3" />
                                                    </>
                                                ) : (
                                                    <>
                                                        {t("common.show_more")} <ChevronDown className="w-3 h-3" />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 space-y-3">
                                {action}
                                {badges && (
                                    <div className="flex items-center justify-center gap-2 mt-4 text-gray-400 text-sm font-medium">
                                        {badges}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div >


            {/* Suggestions or Extra Content */}
            {
                extraContent && (
                    <div className="w-full bg-[#f8fafc] py-12">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            {extraContent}
                        </div>
                    </div>
                )
            }

            <PhotoViewer
                photos={photos.map((p) => ({ id: Number(p.id) || 0, url: normalizePhotoUrl(p.url) }))}
                index={currentPhotoIndex}
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                onChangeIndex={(i) => setCurrentPhotoIndex(i)}
            />
            {children}
        </div >
    )
}
