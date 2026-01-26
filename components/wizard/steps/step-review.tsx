import React, { useState } from "react"
import { useTranslation } from "@/lib/i18n-context"
import { CAR_COLORS } from "@/lib/car-colors"
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react"
import { PhotoItem } from "@/components/ui/photo-upload-grid"

type StepProps = {
    data: any
    t: (key: string) => string
}

export function StepReview({ data, t }: StepProps) {
    const { t: translate } = useTranslation()
    const [mainPhotoIndex, setMainPhotoIndex] = useState(0)
    const thumbnailsRef = React.useRef<HTMLDivElement>(null)

    const photos: PhotoItem[] = data.photos || []
    const mainPhoto = photos[mainPhotoIndex]

    // Auto-scroll thumbnails when main photo changes
    React.useEffect(() => {
        if (thumbnailsRef.current && photos.length > 0) {
            const container = thumbnailsRef.current
            const thumbnail = container.children[mainPhotoIndex] as HTMLElement
            if (thumbnail) {
                const containerWidth = container.offsetWidth
                const thumbnailLeft = thumbnail.offsetLeft
                const thumbnailWidth = thumbnail.offsetWidth
                const scrollPosition = thumbnailLeft - (containerWidth / 2) + (thumbnailWidth / 2)
                container.scrollTo({ left: scrollPosition, behavior: 'smooth' })
            }
        }
    }, [mainPhotoIndex, photos.length])

    const exteriorColor = CAR_COLORS.find(c => c.value === data.exterior_color)
    const interiorColor = CAR_COLORS.find(c => c.value === data.interior_color)

    // Icon helper
    const getIcon = (type: string) => {
        switch (type) {
            case "mileage": return "/icons/mileage.png"
            case "transmission": return "/icons/transmission.png"
            case "fuel": return data.fuel_type?.toLowerCase() === "electric" ? "/icons/electric-fuel.png" : "/icons/fuel.png"
            case "condition": return "/icons/condition.png"
            case "engine": return "/icons/engine.png"
            case "doors": return "/icons/car-door.png"
            default: return "/icons/condition.png"
        }
    }

    const goToPrev = () => setMainPhotoIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1))
    const goToNext = () => setMainPhotoIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1))

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-[#103090]">{t("previewTitle")}</h2>
                    <p className="text-sm text-gray-500">{t("previewSubtitle")}</p>
                </div>
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                    {translate("wizard.progress.step_of", { current: 5, total: 5 }) || "Step 5 of 5"}
                </span>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Photo Gallery */}
                    <div className="space-y-4">
                        {/* Main Photo with Navigation */}
                        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 relative group">
                            {mainPhoto ? (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={mainPhoto.url}
                                        alt="Main photo"
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Navigation Arrows */}
                                    {photos.length > 1 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={goToPrev}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#103090] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={goToNext}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#103090] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                    {/* Photo Counter */}
                                    <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                                        {mainPhotoIndex + 1} / {photos.length}
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    No photos
                                </div>
                            )}
                        </div>

                        {/* Scrollable Thumbnails */}
                        {photos.length > 1 && (
                            <div
                                ref={thumbnailsRef}
                                className="flex gap-2 overflow-x-auto py-1 px-1 -mx-1 scrollbar-hide"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {photos.map((photo: PhotoItem, i: number) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setMainPhotoIndex(i)}
                                        className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-gray-100 transition-all ${i === mainPhotoIndex
                                            ? "ring-2 ring-[#B8071C] ring-offset-1"
                                            : "opacity-70 hover:opacity-100"
                                            }`}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={photo.url}
                                            alt={`Thumbnail ${i + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Vehicle Info */}
                    <div className="space-y-6">
                        {/* Title & Price */}
                        <div>
                            <h1 className="text-2xl font-bold text-[#103090]">
                                {data.make} {data.model}
                            </h1>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="bg-[#103090] text-white text-xs font-semibold px-3 py-1 rounded-full">
                                    {data.year}
                                </span>
                                <span className="flex items-center gap-1 text-gray-500 text-sm">
                                    <MapPin className="w-4 h-4" />
                                    {data.location}
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-[#B8071C] mt-4">
                                {data.price ? `${Number(data.price).toLocaleString()} ${translate('common.mad')}` : "—"}
                            </p>
                            <p className="text-sm text-gray-500">{t("askingPrice")}</p>
                        </div>

                        {/* Specs Grid with Icons */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Mileage */}
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t("mileage")}</span>
                                    <div className="flex items-center gap-2">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={getIcon("mileage")} alt="" className="w-5 h-5 opacity-70" />
                                        <span className="font-semibold text-[#103090]">
                                            {data.mileage ? `${Number(data.mileage).toLocaleString()} ${translate("unit.km")}` : "—"}
                                        </span>
                                    </div>
                                </div>

                                {/* Transmission */}
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t("transmission")}</span>
                                    <div className="flex items-center gap-2">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={getIcon("transmission")} alt="" className="w-5 h-5 opacity-70" />
                                        <span className="font-semibold text-[#103090]">{data.transmission || "—"}</span>
                                    </div>
                                </div>

                                {/* Fuel */}
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t("fuelType")}</span>
                                    <div className="flex items-center gap-2">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={getIcon("fuel")} alt="" className="w-5 h-5 opacity-70" />
                                        <span className="font-semibold text-[#103090]">{data.fuel_type || "—"}</span>
                                    </div>
                                </div>

                                {/* Condition */}
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t("condition")}</span>
                                    <div className="flex items-center gap-2">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={getIcon("condition")} alt="" className="w-5 h-5 opacity-70" />
                                        <span className="font-semibold text-[#103090]">{data.condition || "—"}</span>
                                    </div>
                                </div>

                                {/* Engine */}
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t("engineSize")}</span>
                                    <div className="flex items-center gap-2">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={getIcon("engine")} alt="" className="w-5 h-5 opacity-70" />
                                        <span className="font-semibold text-[#103090]">{data.engine_size ? `${data.engine_size}` : "—"}</span>
                                    </div>
                                </div>

                                {/* Doors */}
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t("doors")}</span>
                                    <div className="flex items-center gap-2">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={getIcon("doors")} alt="" className="w-5 h-5 opacity-70" />
                                        <span className="font-semibold text-[#103090]">{data.doors || "—"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Special Features */}
                        {data.special_features && (
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 font-serif flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                                    </svg>
                                    {t("specialFeatures")}
                                </h3>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                                    {data.special_features}
                                </p>
                            </div>
                        )}

                        {/* Appearance */}
                        <div className="bg-gray-50 rounded-xl p-6">
                            {exteriorColor && (
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`w-5 h-5 rounded-full ${exteriorColor.border ? "border border-gray-300" : ""}`}
                                        style={{ background: exteriorColor.hex }}
                                    />
                                    <span className="text-sm text-gray-600">
                                        {translate(`colors.${exteriorColor.value}` as any)} {t("exterior")}
                                    </span>
                                </div>
                            )}
                            {interiorColor && (
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`w-5 h-5 rounded-full ${interiorColor.border ? "border border-gray-300" : ""}`}
                                        style={{ background: interiorColor.hex }}
                                    />
                                    <span className="text-sm text-gray-600">
                                        {translate(`colors.${interiorColor.value}` as any)} {t("interior")}
                                    </span>
                                </div>
                            )}
                            {data.is_original_paint && (
                                <span className="text-sm text-green-600 font-medium">✓ {t("originalPaint")}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Description */}
                {data.description && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <h3 className="text-lg font-semibold text-[#103090] mb-3">{t("description")}</h3>
                        <div className="max-h-48 overflow-y-auto">
                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{data.description}</p>
                        </div>
                        {data.description.length > 500 && (
                            <p className="text-xs text-gray-400 mt-2">{t("scrollMore")}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
