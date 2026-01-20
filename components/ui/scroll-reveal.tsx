"use client"

import React, { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    threshold?: number
    delay?: number
}

export function ScrollReveal({
    children,
    threshold = 0.1,
    delay = 0,
    className,
    ...props
}: ScrollRevealProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const hasAnimatedRef = useRef(false)

    useEffect(() => {
        // Mark as mounted after a tiny delay to ensure proper hydration
        const mountTimer = requestAnimationFrame(() => {
            setIsMounted(true)

            // Start animation with staggered delay
            const animateTimer = setTimeout(() => {
                if (!ref.current) {
                    setIsVisible(true)
                    return
                }

                const rect = ref.current.getBoundingClientRect()
                const isInViewport = rect.top < window.innerHeight + 100 && rect.bottom > -100

                if (isInViewport && !hasAnimatedRef.current) {
                    setIsVisible(true)
                    hasAnimatedRef.current = true
                } else if (!isInViewport) {
                    // Set up observer for elements not in viewport
                    const observer = new IntersectionObserver(
                        ([entry]) => {
                            if (entry.isIntersecting && !hasAnimatedRef.current) {
                                setTimeout(() => {
                                    setIsVisible(true)
                                    hasAnimatedRef.current = true
                                }, delay)
                                observer.disconnect()
                            }
                        },
                        { threshold, rootMargin: "50px 0px" }
                    )
                    observer.observe(ref.current)
                    return () => observer.disconnect()
                }
            }, 200 + delay) // Longer base delay for smoother cascade

            return () => clearTimeout(animateTimer)
        })

        return () => cancelAnimationFrame(mountTimer)
    }, [threshold, delay])

    return (
        <div
            ref={ref}
            className={cn(
                "transform transition-all ease-out",
                isMounted ? "duration-1000" : "duration-0",
                isMounted
                    ? (isVisible
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 translate-y-6 scale-[0.97]")
                    : "opacity-0", // Hidden during SSR
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

