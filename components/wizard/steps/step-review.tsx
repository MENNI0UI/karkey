"use client"

import React, { useState, useRef, useEffect } from "react"
import { useTranslation } from "@/lib/i18n-context"
import Image from "next/image"
import {
    MapPin,
    ChevronLeft,
    ChevronRight,
    PaintBucket,
    Car,
    Fuel,
    Settings2,
    ChevronUp,
    ChevronDown,
} from "lucide-react"
import { WizardCard } from "@/components/ui/wizard-card"
import PhotoViewer from "@/components/photo-viewer"
import type { TranslationKey } from "@/lib/locales"

type StepReviewProps = {
    data: any
    t: (key: string) => string
    errors?: Record<string, string>
}

export function StepReview({ data, t }: StepReviewProps) {
    const { t: translate, language } = useTranslation()
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

    // Ensure we have photos array even if empty or data.photos is undefined
    const rawPhotos = data.photos || []
    // Normalize photos for the viewer and display
    const photos = rawPhotos.map((p: any, idx: number) => ({
        id: p.id || idx,
        url: typeof p === 'string' ? p : (p.url || p.preview || "/placeholder-car.jpg")
    }))

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
            if (diff > 0) nextPhoto()
            else prevPhoto()
        }

        touchStartX.current = 0
        touchEndX.current = 0
    }

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
        }).format(numPrice) + " " + translate("common.mad")
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                        {translate("wizard.review.preview" as any) || "Preview your listing"}
                    </p>
                    <h2 className="text-2xl font-bold font-serif text-[#103090]">
                        {translate("wizard.review.title" as any) || "Review & Publish"}
                    </h2>
                </div>
            </div>

            {/* Main Content Area - Replicating UnifiedCarLayout Structure */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 lg:p-8 animate-fade-in-up delay-100">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                    {/* Left: Photos Area */}
                    <div className="space-y-4">
                        <div
                            className="relative aspect-square md:aspect-[16/10] bg-gray-100 rounded-2xl overflow-hidden shadow-sm touch-pan-y"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            {photos.length > 0 ? (
                                <>
                                    <div className="w-full h-full cursor-zoom-in" onClick={() => { setIsViewerOpen(true); setCurrentPhotoIndex(currentPhotoIndex) }}>
                                        <Image
                                            src={normalizePhotoUrl(photos[currentPhotoIndex]?.url)}
                                            alt={`${data.make} ${data.model}`}
                                            fill
                                            className="object-contain object-center bg-gray-100"
                                            sizes="(max-width: 768px) 100vw, 800px"
                                            unoptimized={true}
                                        />
                                    </div>
                                    {photos.length > 1 && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); prevPhoto() }}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-[#103090] shadow-lg hover:bg-white transition-all z-20 hidden md:flex"
                                            >
                                                <ChevronLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); nextPhoto() }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-[#103090] shadow-lg hover:bg-white transition-all z-20 hidden md:flex"
                                            >
                                                <ChevronRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                    <Car className="w-16 h-16 mb-4 opacity-20" />
                                    <p>{translate("wizard.review.no_photos" as any) || "No photos"}</p>
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
                                {photos.map((photo: any, idx: number) => (
                                    <button
                                        key={photo.id || idx}
                                        onClick={() => setCurrentPhotoIndex(idx)}
                                        className={`flex-shrink-0 w-20 h-14 relative rounded-lg overflow-hidden transition-all ${idx === currentPhotoIndex
                                            ? "ring-2 ring-[#B8071C] ring-offset-1 opacity-100 scale-105"
                                            : "opacity-60 hover:opacity-100 scale-100"
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

                        {/* DESKTOP ONLY: Description & Features */}
                        <div key="desktop-descriptive-sections" className="hidden lg:block animate-fade-in-up delay-200">
                            {/* Special Features */}
                            {data.special_features && (
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <h3 className="text-xl font-bold text-[#103090] mb-4 flex items-center gap-2 font-serif">
                                        <svg className="w-5 h-5 text-[#B8071C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                                        </svg>
                                        {translate("vehicle.special_features")}
                                    </h3>
                                    <div className="relative">
                                        <p className={`text-gray-600 leading-relaxed whitespace-pre-wrap text-[16px] font-sans ${!isSpecialFeaturesExpanded ? 'line-clamp-4' : ''}`}>
                                            {data.special_features}
                                        </p>
                                        {(data.special_features.length > 150 || (data.special_features.match(/\n/g) || []).length > 2) && (
                                            <button
                                                onClick={() => setIsSpecialFeaturesExpanded(!isSpecialFeaturesExpanded)}
                                                className="mt-2 text-[#B8071C] font-semibold flex items-center gap-1 hover:underline font-sans text-sm"
                                            >
                                                {isSpecialFeaturesExpanded ? (
                                                    <>
                                                        {translate("common.show_less")} <ChevronUp className="w-4 h-4" />
                                                    </>
                                                ) : (
                                                    <>
                                                        {translate("common.show_more")} <ChevronDown className="w-4 h-4" />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <h3 className="text-xl font-bold text-[#103090] mb-4 font-serif">{translate("vehicle.description")}</h3>
                                <div className="relative">
                                    <p className={`text-gray-600 leading-relaxed whitespace-pre-wrap text-[16px] font-sans ${!isDescriptionExpanded ? 'line-clamp-4' : ''}`}>
                                        {data.description}
                                    </p>
                                    {data.description && (data.description.length > 150 || (data.description.match(/\n/g) || []).length > 2) && (
                                        <button
                                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                            className="mt-2 text-[#B8071C] font-semibold flex items-center gap-1 hover:underline font-sans text-sm"
                                        >
                                            {isDescriptionExpanded ? (
                                                <>
                                                    {translate("common.show_less")} <ChevronUp className="w-4 h-4" />
                                                </>
                                            ) : (
                                                <>
                                                    {translate("common.show_more")} <ChevronDown className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Info Area */}
                    <div className="flex flex-col animate-fade-in-up delay-300">
                        <div className="flex-1">
                            <h1 className="text-3xl md:text-5xl font-bold font-serif text-[#103090] mb-2 leading-tight">
                                {data.make} {data.model}
                            </h1>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="bg-[#103090] text-white font-bold px-4 py-1 rounded-full text-sm">
                                    {data.year}
                                </span>
                                <div className="flex items-center gap-1.5 text-gray-500 font-medium text-sm">
                                    <MapPin className="w-4 h-4 text-[#B8071C]" />
                                    {translate(`location.city.${(data.location || "").toLowerCase().replace(/\s+/g, '')}` as any) || data.location}
                                </div>
                            </div>

                            {/* Price */}
                            {data.price && (
                                <div className="text-3xl md:text-4xl font-bold font-serif text-[#B8071C] mb-8">
                                    {formatPrice(data.price)}
                                </div>
                            )}

                            {/* Jewel-Case Specs Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="jewel-card p-4 rounded-xl flex flex-col justify-center group h-full">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{translate("vehicle.mileage")}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-4 h-4">
                                            <Image src="/icons/mileage.png" alt="" fill className="object-contain" style={{ filter: 'invert(16%) sepia(95%) saturate(3500%) hue-rotate(348deg) brightness(85%) contrast(95%)' }} />
                                        </div>
                                        <p className="text-lg font-bold text-[#103090] group-hover:text-[#B8071C] transition-colors">{Number(data.mileage || 0).toLocaleString()} <span className="text-sm font-normal text-gray-500">{translate("unit.km")}</span></p>
                                    </div>
                                </div>

                                <div className="jewel-card p-4 rounded-xl flex flex-col justify-center group h-full">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{translate("vehicle.transmission")}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-4 h-4">
                                            <Image src="/icons/transmission.png" alt="" fill className="object-contain" style={{ filter: 'invert(16%) sepia(95%) saturate(3500%) hue-rotate(348deg) brightness(85%) contrast(95%)' }} />
                                        </div>
                                        <p className="text-lg font-bold text-[#103090] capitalize group-hover:text-[#B8071C] transition-colors">
                                            {translate(`vehicle.transmission.${String(data.transmission).toLowerCase()}` as any) !== `vehicle.transmission.${String(data.transmission).toLowerCase()}` ? translate(`vehicle.transmission.${String(data.transmission).toLowerCase()}` as any) : data.transmission}
                                        </p>
                                    </div>
                                </div>

                                <div className="jewel-card p-4 rounded-xl flex flex-col justify-center group h-full">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{translate("vehicle.fuel")}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-4 h-4">
                                            <Image src="/icons/fuel.png" alt="" fill className="object-contain" style={{ filter: 'invert(16%) sepia(95%) saturate(3500%) hue-rotate(348deg) brightness(85%) contrast(95%)' }} />
                                        </div>
                                        <p className="text-lg font-bold text-[#103090] capitalize group-hover:text-[#B8071C] transition-colors">
                                            {translate(`vehicle.fuel.${String(data.fuel_type).toLowerCase()}` as any) !== `vehicle.fuel.${String(data.fuel_type).toLowerCase()}` ? translate(`vehicle.fuel.${String(data.fuel_type).toLowerCase()}` as any) : data.fuel_type}
                                        </p>
                                    </div>
                                </div>

                                <div className="jewel-card p-4 rounded-xl flex flex-col justify-center group h-full">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{translate("vehicle.condition")}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-4 h-4">
                                            <Image src="/icons/condition.png" alt="" fill className="object-contain" style={{ filter: 'invert(16%) sepia(95%) saturate(3500%) hue-rotate(348deg) brightness(85%) contrast(95%)' }} />
                                        </div>
                                        <p className="text-lg font-bold text-[#103090] capitalize group-hover:text-[#B8071C] transition-colors">
                                            {translate(`vehicle.condition.${String(data.condition).toLowerCase()}` as any) !== `vehicle.condition.${String(data.condition).toLowerCase()}` ? translate(`vehicle.condition.${String(data.condition).toLowerCase()}` as any) : data.condition}
                                        </p>
                                    </div>
                                </div>

                                {data.engine_size && (
                                    <div className="jewel-card p-4 rounded-xl flex flex-col justify-center group h-full">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{translate("vehicle.engine_size")}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-4 h-4">
                                                <Image src="/icons/engine.png" alt="" fill className="object-contain" style={{ filter: 'invert(16%) sepia(95%) saturate(3500%) hue-rotate(348deg) brightness(85%) contrast(95%)' }} />
                                            </div>
                                            <p className="text-lg font-bold text-[#103090] group-hover:text-[#B8071C] transition-colors">{data.engine_size} {translate("unit.liter")}</p>
                                        </div>
                                    </div>
                                )}

                                {data.doors && (
                                    <div className="jewel-card p-4 rounded-xl flex flex-col justify-center group h-full">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{translate("vehicle.doors")}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-4 h-4">
                                                <Image src="/icons/car-door.png" alt="" fill className="object-contain" style={{ filter: 'invert(16%) sepia(95%) saturate(3500%) hue-rotate(348deg) brightness(85%) contrast(95%)' }} />
                                            </div>
                                            <p className="text-lg font-bold text-[#103090] group-hover:text-[#B8071C] transition-colors">{data.doors}</p>
                                        </div>
                                    </div>
                                )}

                                {data.exterior_color && (
                                    <div className="jewel-card p-4 rounded-xl flex flex-col justify-center group h-full">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{translate("wizard.fields.exterior_color")}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm flex-shrink-0" style={{ backgroundColor: data.exterior_color.hex || data.exterior_color }} />
                                            <p className="text-lg font-bold text-[#103090] capitalize group-hover:text-[#B8071C] transition-colors">{translate(`colors.${data.exterior_color.value || data.exterior_color}` as any)}</p>
                                        </div>
                                    </div>
                                )}

                                {data.interior_color && (
                                    <div className="jewel-card p-4 rounded-xl flex flex-col justify-center group h-full">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{translate("wizard.fields.interior_color")}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm flex-shrink-0" style={{ backgroundColor: data.interior_color.hex || data.interior_color }} />
                                            <p className="text-lg font-bold text-[#103090] capitalize group-hover:text-[#B8071C] transition-colors">{translate(`colors.${data.interior_color.value || data.interior_color}` as any)}</p>
                                        </div>
                                    </div>
                                )}

                                {data.is_original_paint !== undefined && (
                                    <div className="jewel-card p-4 rounded-xl flex flex-col justify-center group h-full">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{translate("wizard.fields.original_paint" as any) || "Original Paint"}</p>
                                        <div className="flex items-center gap-2">
                                            <PaintBucket className="w-4 h-4 text-[#B8071C] flex-shrink-0" />
                                            <p className="text-lg font-bold text-[#103090] group-hover:text-[#B8071C] transition-colors">
                                                {data.is_original_paint ? translate("common.yes") : translate("common.no")}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* MOBILE ONLY: Features & Description */}
                            <div key="mobile-descriptive-sections" className="lg:hidden animate-fade-in-up delay-400">
                                {data.special_features && (
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <h3 className="text-lg font-bold text-[#103090] mb-2 flex items-center gap-2 font-serif">
                                            <svg className="w-4 h-4 text-[#B8071C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                                            </svg>
                                            {translate("vehicle.special_features")}
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm font-sans line-clamp-4">
                                            {data.special_features}
                                        </p>
                                    </div>
                                )}
                                {data.description && (
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <h3 className="text-lg font-bold text-[#103090] mb-2 font-serif">{translate("vehicle.description")}</h3>
                                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm font-sans line-clamp-4">
                                            {data.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PhotoViewer
                photos={photos}
                index={currentPhotoIndex}
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                onChangeIndex={(i) => setCurrentPhotoIndex(i)}
            />
        </div>
    )
}
