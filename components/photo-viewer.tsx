"use client"

import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { createPortal } from "react-dom"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface Photo {
    id?: number
    url: string
}

interface Props {
    photos: Photo[]
    index: number
    isOpen: boolean
    onClose: () => void
    onChangeIndex?: (i: number) => void
}

export default function PhotoViewer({ photos, index, isOpen, onClose, onChangeIndex }: Props) {
    const current = photos[index]
    const [mounted, setMounted] = useState(false)

    // Touch swipe state
    const touchStartX = useRef<number | null>(null)
    const touchEndX = useRef<number | null>(null)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    useEffect(() => {
        if (!isOpen) {
            document.body.style.overflow = ''
            return
        }

        document.body.style.overflow = 'hidden'

        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose()
            if (e.key === "ArrowLeft") onChangeIndex?.((index - 1 + photos.length) % photos.length)
            if (e.key === "ArrowRight") onChangeIndex?.((index + 1) % photos.length)
        }
        window.addEventListener("keydown", onKey)
        return () => {
            window.removeEventListener("keydown", onKey)
            document.body.style.overflow = ''
        }
    }, [isOpen, index, photos.length, onClose, onChangeIndex])

    const handleTouchStart = (e: React.TouchEvent) => {
        touchEndX.current = null
        touchStartX.current = e.targetTouches[0].clientX
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX
    }

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return

        const distance = touchStartX.current - touchEndX.current
        const isLeftSwipe = distance > 50
        const isRightSwipe = distance < -50

        if (isLeftSwipe) {
            onChangeIndex?.((index + 1) % photos.length)
        } else if (isRightSwipe) {
            onChangeIndex?.((index - 1 + photos.length) % photos.length)
        }
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    // Preload next and previous images logic
    const nextIndex = (index + 1) % photos.length
    const prevIndex = (index - 1 + photos.length) % photos.length
    const nextPhoto = photos[nextIndex]
    const prevPhoto = photos[prevIndex]

    if (!isOpen || !mounted) return null

    // Render directly into document.body to avoid stacking context issues
    return createPortal(
        <div
            className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center touch-none animate-in fade-in duration-200"
            onClick={handleBackdropClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <button
                aria-label="Close"
                onClick={onClose}
                className="absolute top-6 right-6 bg-black/50 text-white p-3 rounded-full hover:bg-black/80 transition-all z-[2000] backdrop-blur-md shadow-lg border border-white/20"
            >
                <X className="w-8 h-8 drop-shadow-md" />
            </button>

            <button
                aria-label="Prev"
                onClick={(e) => {
                    e.stopPropagation()
                    onChangeIndex?.((index - 1 + photos.length) % photos.length)
                }}
                className="absolute left-2 md:left-6 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-[1010]"
            >
                <ChevronLeft className="w-10 h-10 md:w-12 md:h-12 drop-shadow-md" />
            </button>

            <div
                className="relative w-full h-full max-w-7xl max-h-[85vh] flex items-center justify-center p-2 md:p-4 select-none"
                onClick={(e) => e.stopPropagation()}
            >
                {current && (
                    <Image
                        src={current.url}
                        alt={`Photo ${index + 1}`}
                        fill
                        className="object-contain"
                        sizes="100vw"
                        priority
                        unoptimized
                        draggable={false}
                    />
                )}
            </div>

            <button
                aria-label="Next"
                onClick={(e) => {
                    e.stopPropagation()
                    onChangeIndex?.((index + 1) % photos.length)
                }}
                className="absolute right-2 md:right-6 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-[1010]"
            >
                <ChevronRight className="w-10 h-10 md:w-12 md:h-12 drop-shadow-md" />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none">
                {index + 1} / {photos.length}
            </div>

            {/* Hidden Preloaders for Speed */}
            <div className="hidden">
                {nextPhoto && (
                    <Image
                        src={nextPhoto.url}
                        alt="preload next"
                        width={10}
                        height={10}
                        priority
                        unoptimized
                    />
                )}
                {prevPhoto && (
                    <Image
                        src={prevPhoto.url}
                        alt="preload prev"
                        width={10}
                        height={10}
                        priority
                        unoptimized
                    />
                )}
            </div>
        </div>,
        document.body
    )
}
