"use client"

import React, { useState, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Camera } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"

interface CarCardImageSliderProps {
    photos: string[]
    alt: string
    href: string
    aspectRatioClass?: string
    priority?: boolean
    badges?: React.ReactNode
    overlay?: React.ReactNode
    showPhotoCount?: boolean
}

export function CarCardImageSlider({
    photos,
    alt,
    href,
    aspectRatioClass = "min-h-[22rem] md:min-h-[26rem]",
    priority = false,
    badges,
    overlay,
    showPhotoCount = true,
}: CarCardImageSliderProps) {
    const { t } = useTranslation()

    const [photoIndex, setPhotoIndex] = useState(0)

    // Touch/tap state
    const touchStartX = useRef<number>(0)
    const touchStartY = useRef<number>(0)
    const touchEndX = useRef<number>(0)
    const touchEndY = useRef<number>(0)
    const isSwiping = useRef<boolean>(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Normalize array if empty
    const displayPhotos = photos && photos.length > 0 ? photos : ["/placeholder.svg"]

    const handleNav = useCallback((dir: "prev" | "next", e?: React.MouseEvent | React.TouchEvent) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        if (displayPhotos.length <= 1) return
        setPhotoIndex((prev) =>
            dir === "next"
                ? (prev + 1) % displayPhotos.length
                : (prev - 1 + displayPhotos.length) % displayPhotos.length
        )
    }, [displayPhotos.length])

    // Touch handlers for swipe and tap navigation
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        // Ignore touches on interactive elements (buttons, links)
        const target = e.target as HTMLElement
        if (target.closest("button")) return

        touchStartX.current = e.touches[0].clientX
        touchStartY.current = e.touches[0].clientY
        touchEndX.current = e.touches[0].clientX
        touchEndY.current = e.touches[0].clientY
        isSwiping.current = true
    }, [])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isSwiping.current) return
        touchEndX.current = e.touches[0].clientX
        touchEndY.current = e.touches[0].clientY
    }, [])

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!isSwiping.current) return
        isSwiping.current = false

        const diffX = touchStartX.current - touchEndX.current
        const diffY = touchStartY.current - touchEndY.current
        const minSwipeDistance = 50 // Minimum swipe distance in pixels
        const maxTapDistance = 10 // Maximum movement for a tap

        // Check if this is a swipe or a tap
        const isSwipe = Math.abs(diffX) > minSwipeDistance || Math.abs(diffY) > minSwipeDistance
        const isTap = Math.abs(diffX) < maxTapDistance && Math.abs(diffY) < maxTapDistance

        if (isSwipe && Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (diffX > 0) {
                // Swiped left -> next image
                handleNav("next")
            } else {
                // Swiped right -> prev image
                handleNav("prev")
            }
            e.preventDefault()
        } else if (isTap && displayPhotos.length > 1 && containerRef.current) {
            // Tap navigation: left 50% = prev, right 50% = next
            const rect = containerRef.current.getBoundingClientRect()
            const tapX = touchStartX.current - rect.left
            const halfWidth = rect.width / 2

            if (tapX < halfWidth) {
                // Tapped on left side -> previous image
                handleNav("prev")
            } else {
                // Tapped on right side -> next image
                handleNav("next")
            }
            // Prevent link click
            e.preventDefault()
        }

        // Reset
        touchStartX.current = 0
        touchStartY.current = 0
        touchEndX.current = 0
        touchEndY.current = 0
    }, [handleNav, displayPhotos.length])

    const currentPhoto = displayPhotos[photoIndex]

    return (
        <div
            ref={containerRef}
            className={`relative bg-gray-100 overflow-hidden ${aspectRatioClass} group showroom-card-image`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ isolation: 'isolate', transform: 'translateZ(0)' }}
        >
            {/* Badges Area (Top Left) */}
            <div className="absolute top-3 left-3 z-40 flex items-center gap-2">
                {showPhotoCount && displayPhotos.length > 1 && (
                    <div
                        className="flex items-center gap-1 bg-white/90 rounded-full px-2 py-1 shadow-sm border border-gray-100/50 backdrop-blur-sm"
                        title={`${displayPhotos.length} photos`}
                    >
                        <Camera className="w-3.5 h-3.5 text-[#103090]" />
                        <span className="text-[11px] font-bold text-[#103090]">{displayPhotos.length}</span>
                    </div>
                )}
                {badges}
            </div>

            {/* Overlay (Top Right e.g. Hearts) */}
            {overlay && <div className="absolute top-3 right-3 z-40">{overlay}</div>}

            {/* Navigation Arrows - Hidden on touch devices, visible on hover for desktop */}
            {displayPhotos.length > 1 && (
                <>
                    <button
                        onClick={(e) => handleNav("prev", e)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-sm hover:bg-white hidden md:flex cursor-pointer hover:scale-110 active:scale-95 duration-200"
                        aria-label="Previous photo"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                        onClick={(e) => handleNav("next", e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-sm hover:bg-white hidden md:flex cursor-pointer hover:scale-110 active:scale-95 duration-200"
                        aria-label="Next photo"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                </>
            )}

            {/* Pagination Dots */}
            {displayPhotos.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex gap-1 pointer-events-none">
                    {displayPhotos.slice(0, 5).map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === photoIndex % 5 ? "bg-white w-3" : "bg-white/60"
                                }`}
                        />
                    ))}
                </div>
            )}

            {/* Main Image Link - Desktop: standard link behavior. Touch: default prevents link. */}
            <Link href={href} className="absolute inset-0 z-10 block" aria-label={alt}>
                <Image
                    src={currentPhoto || "/placeholder.svg"}
                    alt={alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, (max-width: 1536px) 25vw, 20vw"
                    priority={priority && photoIndex === 0}
                    loading={priority ? "eager" : "lazy"}
                    unoptimized
                />
            </Link>
        </div>
    )
}

