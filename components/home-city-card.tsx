"use client"
import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n-context"

interface HomeCityCardProps {
    city: string
    image: string
    language: string
    priority?: boolean
}

export default function HomeCityCard({ city, image, language, priority = false }: HomeCityCardProps) {
    const { t } = useTranslation()
    const hasImage = Boolean(
        image &&
        image.trim().length > 0 &&
        !image.includes("default.webp") &&
        !image.includes("placeholder") &&
        !image.includes("No Image")
    )

    const categories = [
        { label: t("nav.auctions") || "Auctions", href: `/${language}/auctions?location=${encodeURIComponent(city)}` },
        { label: t("nav.direct_sales") || "Direct Sales", href: `/${language}/direct-sales?location=${encodeURIComponent(city)}` },
        { label: t("nav.karkey_cars") || "Karkey Cars", href: `/${language}/karkey-cars?location=${encodeURIComponent(city)}` },
    ]

    return (
        <div
            className="relative h-64 md:h-80 rounded-2xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 shine-sweep"
        >
            {hasImage ? (
                <>
                    <Image
                        src={image}
                        alt={city}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        unoptimized
                        priority={priority}
                    />
                    {/* Dark Overlay - lighter by default, stronger on hover */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/70 transition-colors duration-500" />
                </>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#B8071C] to-[#00A651] group-hover:scale-110 transition-transform duration-700">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-500" />
                </div>
            )}

            {/* Centered City Content - Animates Up on Hover */}
            <div className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 group-hover:-translate-y-16">
                <h3 className="text-white text-2xl md:text-4xl lg:text-5xl font-logo uppercase tracking-[0.1em] drop-shadow-2xl text-center px-4 mb-2">
                    {city}
                </h3>
                {/* Decorative White Underline */}
                <div className="w-24 md:w-32 h-[1px] bg-white/80 rounded-full transition-all duration-500 group-hover:w-40 shadow-sm" />
            </div>

            {/* Hover Options Grid */}
            <div className="absolute inset-0 flex items-center justify-center translate-y-full group-hover:translate-y-12 transition-transform duration-500 px-4">
                <div className="grid grid-cols-2 gap-2 w-full max-w-[280px]">
                    {categories.map((cat, index) => (
                        <Link
                            key={cat.href}
                            href={cat.href}
                            className={`bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 text-[10px] md:text-xs font-bold font-serif py-1.5 px-1 rounded-xl text-center backdrop-blur-md transition-all duration-300 uppercase tracking-wider ${index === 2 ? 'col-span-2' : ''}`}
                        >
                            {cat.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Subtle Inner Border */}
            <div className="absolute inset-4 border border-white/10 rounded-xl pointer-events-none group-hover:inset-3 group-hover:border-white/30 transition-all duration-500" />
        </div>
    )
}
