"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
import { useTranslation } from "@/lib/i18n-context"
import KarkeyCarCard from "@/components/karkey-car-card"
import { LuxuryLoader } from "@/components/ui/luxury-loader"
import { CarCardSkeleton, CarGridSkeleton } from "@/components/ui/car-card-skeleton"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import logger from "@/lib/logger"

interface KarkeyCarPhoto {
    id: number
    photo_url: string
    position_order: number
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

export default function KarkeyCarsPageClient({ initialCars = [] }: { initialCars?: KarkeyCar[] }) {
    const { t, language } = useTranslation()
    const isRTL = language === "ar"

    const [cars, setCars] = useState<KarkeyCar[]>(initialCars)
    const [loading, setLoading] = useState(initialCars.length === 0)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const skipInitialRef = useRef(initialCars.length > 0)
    const isInitialMountRef = useRef(true)

    const fetchCars = useCallback(async (pageNum: number, append: boolean = false) => {
        try {
            if (append) {
                setLoadingMore(true)
            } else {
                setLoading(true)
            }

            const response = await fetch(`/api/karkey-cars?page=${pageNum}&limit=12`)
            const data = await response.json()

            if (response.ok) {
                const newCars = data.cars || []
                if (append) {
                    setCars((prev) => [...prev, ...newCars])
                } else {
                    setCars(newCars)
                }
                setHasMore(pageNum < data.pagination?.totalPages)
            } else {
                throw new Error(data.error || "Failed to fetch cars")
            }
        } catch (err) {
            logger.error("Error fetching Karkey cars:", err)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [t])

    useEffect(() => {
        // Skip the initial render if we have SSR data
        if (isInitialMountRef.current) {
            isInitialMountRef.current = false
            if (initialCars.length > 0) {
                setLoading(false)
                return
            }
        }
        if (skipInitialRef.current) {
            skipInitialRef.current = false
            return
        }
        fetchCars(1)
    }, [fetchCars, initialCars.length])

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1
            setPage(nextPage)
            fetchCars(nextPage, true)
        }
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
            {/* Main Content - Centered container since no filters */}
            <div className="w-full max-w-screen-2xl mx-auto px-4 lg:px-6 xl:px-8 pt-4 flex-1">
                {loading ? (
                    /* Loading State - Skeleton */
                    <div className="w-full py-4">
                        <CarGridSkeleton count={12} type="karkey" />
                    </div>
                ) : cars.length === 0 ? (
                    /* Empty State - Same as other pages */
                    <div className="text-center py-20 text-[#103090] font-serif font-bold text-lg">{t("karkey_cars.no_cars")}</div>
                ) : (
                    <>
                        {/* Cars Grid - 4 columns max for better card sizes */}
                        <div className="w-full">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                                {cars.map((car, index) => (
                                    <ScrollReveal key={car.id} delay={index * 60}>
                                        <KarkeyCarCard
                                            car={car}
                                            priority={index < 4}
                                        />
                                    </ScrollReveal>
                                ))}
                            </div>

                            {/* Load More */}
                            <div className="flex justify-center mt-6">
                                {hasMore ? (
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        className="inline-flex items-center justify-center bg-white border border-gray-200 text-[#103090] hover:bg-gray-50 rounded-md px-4 py-2 shadow-sm text-sm font-semibold"
                                    >
                                        {loadingMore ? (
                                            <>
                                                <LuxuryLoader size="sm" className="mr-2" />
                                                {t("common.loading")}
                                            </>
                                        ) : (
                                            t("common.load_more")
                                        )}
                                    </button>
                                ) : cars.length > 0 ? (
                                    <div className="text-sm text-[#717171]">{t("common.end_of_results")}</div>
                                ) : null}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
