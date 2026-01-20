"use client"

import React, { useState, useEffect, useRef } from "react"

interface DraggableFilterButtonProps {
    label?: string // Keeping for backward compatibility but won't render text
    onClick: () => void
}

export const DraggableFilterButton: React.FC<DraggableFilterButtonProps> = ({ onClick }) => {
    // Initial position: bottom right
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [isSnapping, setIsSnapping] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [isMelting, setIsMelting] = useState(false)
    const [screenWidth, setScreenWidth] = useState(0)

    const buttonRef = useRef<HTMLButtonElement>(null)
    const dragStartPos = useRef({ x: 0, y: 0 })
    const lastTouchPos = useRef({ x: 0, y: 0 })
    const hasMoved = useRef(false)
    const meltTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Constants for positioning
    const BUTTON_SIZE = 48
    // Amount to show on each side (30px = ~62.5% of button)
    const VISIBLE_AMOUNT = 30

    // Use useEffect to center the button initially after mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const width = window.innerWidth
            setScreenWidth(width)
            
            // Clear old cache and force recalculation (version bump)
            const cacheVersion = "v7"
            const savedVersion = localStorage.getItem("filter_btn_version")
            
            if (savedVersion !== cacheVersion) {
                // Remove old position, use fresh calculation
                localStorage.removeItem("filter_btn_pos")
                localStorage.setItem("filter_btn_version", cacheVersion)
            }
            
            const savedPos = localStorage.getItem("filter_btn_pos")
            
            // Calculate symmetric edge positions:
            // Left edge: button starts at -(BUTTON_SIZE - VISIBLE_AMOUNT)
            //   so button spans from -24 to 24, showing 24px
            // Right edge: button starts at (width - VISIBLE_AMOUNT)
            //   so button spans from (width-24) to (width+24), showing 24px
            const leftEdgeX = -(BUTTON_SIZE - VISIBLE_AMOUNT) // -24
            const rightEdgeX = width - VISIBLE_AMOUNT // width - 24
            
            // Default: right edge
            let initialPos = { x: rightEdgeX, y: window.innerHeight / 2 - 24 }
            
            if (savedPos) {
                try {
                    const parsed = JSON.parse(savedPos)
                    // Determine which side and snap to correct position
                    if (parsed.x < width / 2) {
                        parsed.x = leftEdgeX
                    } else {
                        parsed.x = rightEdgeX
                    }
                    initialPos = parsed
                } catch {
                    // fallback already set
                }
            }
            
            setPosition(initialPos)
            localStorage.setItem("filter_btn_pos", JSON.stringify(initialPos))
            setIsMounted(true)
        }
    }, [])

    // Melt logic: wait 3 seconds at edge before melting
    useEffect(() => {
        if (meltTimeoutRef.current) clearTimeout(meltTimeoutRef.current)

        // Check if at snapped edge positions
        const leftEdgeX = -(BUTTON_SIZE - VISIBLE_AMOUNT) // -24
        const rightEdgeX = screenWidth - VISIBLE_AMOUNT // screenWidth - 24
        
        const isAtLeftEdge = position.x <= leftEdgeX + 5
        const isAtRightEdge = screenWidth > 0 && position.x >= rightEdgeX - 5

        if (!isDragging && !isSnapping && (isAtLeftEdge || isAtRightEdge)) {
            meltTimeoutRef.current = setTimeout(() => {
                setIsMelting(true)
            }, 3000)
        } else {
            setIsMelting(false)
        }

        return () => {
            if (meltTimeoutRef.current) clearTimeout(meltTimeoutRef.current)
        }
    }, [position, isDragging, isSnapping, screenWidth])

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0]
        dragStartPos.current = { x: touch.clientX - position.x, y: touch.clientY - position.y }
        lastTouchPos.current = { x: touch.clientX, y: touch.clientY }
        setIsDragging(true)
        setIsSnapping(false)
        setIsMelting(false) // Solidify instantly
        hasMoved.current = false
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return
        const touch = e.touches[0]

        // Check if moved enough to be a drag
        const dx = Math.abs(touch.clientX - lastTouchPos.current.x)
        const dy = Math.abs(touch.clientY - lastTouchPos.current.y)
        if (dx > 5 || dy > 5) {
            hasMoved.current = true
        }

        const newX = touch.clientX - dragStartPos.current.x
        const newY = touch.clientY - dragStartPos.current.y

        // Boundary constraints
        const buttonSize = 48
        const maxX = window.innerWidth - buttonSize
        const maxY = window.innerHeight - buttonSize - 16

        setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(70, Math.min(newY, maxY)) // avoid top header
        })
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        setIsDragging(false)

        if (!hasMoved.current) {
            // Prevent the "ghost click"
            if (e.cancelable) e.preventDefault()
            onClick()
            return
        }

        // Update screen width in case of orientation change
        const currentWidth = window.innerWidth
        setScreenWidth(currentWidth)

        // Snapping logic - snap to edge showing exactly half the button (24px)
        setIsSnapping(true)
        const midPoint = currentWidth / 2

        // Symmetric positions:
        // Left: x = -(BUTTON_SIZE - VISIBLE_AMOUNT) = -24, button spans -24 to 24, shows 24px
        // Right: x = currentWidth - VISIBLE_AMOUNT = currentWidth - 24, shows 24px
        const leftEdgeX = -(BUTTON_SIZE - VISIBLE_AMOUNT) // -24
        const rightEdgeX = currentWidth - VISIBLE_AMOUNT // currentWidth - 24
        
        const targetX = position.x + BUTTON_SIZE / 2 < midPoint 
            ? leftEdgeX
            : rightEdgeX

        const finalPos = { ...position, x: targetX }
        setPosition(finalPos)
        localStorage.setItem("filter_btn_pos", JSON.stringify(finalPos))

        // Ensure snapping transition completes before any auto-melt logic takes over
        setTimeout(() => setIsSnapping(false), 200)
    }

    if (!isMounted) return null

    return (
        <button
            ref={buttonRef}
            type="button"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => {
                if (!hasMoved.current) onClick()
            }}
            className="flex items-center justify-center rounded-full bg-[#B1060F] text-white shadow-2xl hover:bg-[#910515] active:scale-90 outline-none lg:hidden"
            style={{
                position: "fixed",
                left: 0,
                top: 0,
                width: `${BUTTON_SIZE}px`,
                height: `${BUTTON_SIZE}px`,
                transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${isMelting ? 0.85 : 1})`,
                zIndex: 40,
                touchAction: "none",
                // Transition logic:
                // Snapping/Dragging: Fast transform (0.2s)
                // Melting: Slow transform, opacity, and blur (10s)
                transition: isMelting
                    ? "transform 10s ease-out, opacity 10s ease-out, filter 10s ease-out"
                    : isSnapping
                        ? "transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.1s ease, filter 0.1s ease"
                        : "opacity 0.1s ease, filter 0.1s ease",

                // Melting visibility: 55% instead of 25%
                opacity: isMelting ? 0.55 : 1,
                // Realistic ice melt blur: slightly reduced for better visibility
                filter: isMelting ? "blur(2px)" : "none",
            }}
            aria-label="Filters"
        >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 5h18M7 12h10M10 19h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    )
}
