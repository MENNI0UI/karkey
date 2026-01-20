"use client"

import React, { useEffect } from "react"
import Image from "next/image"
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

    // Touch swipe state
    const touchStartX = React.useRef<number>(0)
    const touchEndX = React.useRef<number>(0)
    const isSwiping = React.useRef<boolean>(false)

    useEffect(() => {
        if (!isOpen) return
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose()
            if (e.key === "ArrowLeft") onChangeIndex?.((index - 1 + photos.length) % photos.length)
            if (e.key === "ArrowRight") onChangeIndex?.((index + 1) % photos.length)
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [isOpen, index, photos.length, onClose, onChangeIndex])

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
                onChangeIndex?.((index + 1) % photos.length)
            } else {
                // Swiped right -> prev
                onChangeIndex?.((index - 1 + photos.length) % photos.length)
            }
        }

        touchStartX.current = 0
        touchEndX.current = 0
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <button
                aria-label="Close"
                onClick={onClose}
                className="absolute top-6 right-6 text-white bg-black/40 p-2 rounded-full hover:bg-black/60 z-50"
            >
                <X className="w-6 h-6" />
            </button>

            <button
                aria-label="Prev"
                onClick={() => onChangeIndex?.((index - 1 + photos.length) % photos.length)}
                className="absolute left-6 text-white bg-black/30 p-3 rounded-full hover:bg-black/50 hidden md:block z-50"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="relative w-[92vw] h-[88vh] max-w-5xl pointer-events-none md:pointer-events-auto">
                {current && (
                    <Image
                        src={current.url}
                        alt={`Photo ${index + 1}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 1024px) 92vw, 800px"
                        priority
                    />
                )}
            </div>

            <button
                aria-label="Next"
                onClick={() => onChangeIndex?.((index + 1) % photos.length)}
                className="absolute right-6 text-white bg-black/30 p-3 rounded-full hover:bg-black/50 hidden md:block z-50"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm">
                {index + 1} / {photos.length}
            </div>
        </div>
    )
}
