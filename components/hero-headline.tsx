"use client"

import React from "react"
import { m } from "framer-motion"
import { SplittingText, SlideUp } from "@/components/ui/motion-wrappers"

interface HeroHeadlineProps {
    titleStart: string
    titleEnd: string
    subtitle: string
}

export function HeroHeadline({ titleStart, titleEnd, subtitle }: HeroHeadlineProps) {
    return (
        <div className="text-center mb-4 lg:mb-6 py-4">
            <h1 className="text-4xl md:text-5xl font-serif mb-4 tracking-tight text-slate-900 leading-relaxed">
                <SplittingText
                    text={titleStart}
                    className="bg-gradient-to-br from-[#00A651] to-[#004D25] bg-clip-text text-transparent"
                    delay={0}
                />
                {' '}
                <span className="italic relative inline-block text-[#B8071C] ml-1">
                    <span className="text-shimmer-anim">
                        <SplittingText
                            text={titleEnd}
                            delay={0.3}
                        />
                    </span>
                    {/* Underline deco - CSS Animated */}
                    <span
                        className="animate-grow-x absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#B8071C]/80 to-transparent rounded-full origin-center"
                    />
                </span>
            </h1>
            <SlideUp delay={0.8}>
                <p className="text-lg text-slate-500 font-light max-w-2xl mx-auto">
                    {subtitle}
                </p>
            </SlideUp>
        </div>
    )
}
