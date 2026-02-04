"use client"

import dynamic from "next/dynamic"

// Dynamic imports for heavy components to reduce initial bundle size (~250KB savings)
const ParticlesBackgroundComponent = dynamic(
    () => import("@/components/particles-background").then(mod => mod.ParticlesBackground),
    { ssr: false, loading: () => <div className="absolute inset-0 bg-white" /> }
)

import { HeroHeadline } from "@/components/hero-headline"

interface Props {
    titleStart: string
    titleEnd: string
    subtitle: string
    children?: React.ReactNode
}

export default function HeroSection({ titleStart, titleEnd, subtitle, children }: Props) {
    return (
        <>
            {/* Instant CSS-only Background (Zero-JS) */}
            <div className="absolute inset-0 z-0 h-[600px] pointer-events-none overflow-hidden bg-white">
                {/* Instant Gradient Fallback - GPU Accelerated Class */}
                <div className="absolute inset-0 opacity-20 pointer-events-none hero-static-bg" />

                {/* Particles container with smooth secondary appearance */}
                <div className="absolute inset-0 z-0 hidden lg:block">
                    {/* ⚡ Mobile optimization: Hide particles on small screens entirely */}
                    <ParticlesBackgroundComponent />
                </div>

                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white z-10" />
            </div>

            {/* Global Background Elements for "Unified" feel */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-[#00A651]/5 rounded-full blur-3xl opacity-30" />
            </div>

            {/* Hero Content Section */}
            <section className="relative pt-12 pb-4 lg:pb-10 z-10">
                <div className="max-w-[1700px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-col-reverse">
                    {/* Search Bar Area (passed as children) */}
                    {children}

                    {/* Editorial Headline */}
                    <HeroHeadline
                        titleStart={titleStart}
                        titleEnd={titleEnd}
                        subtitle={subtitle}
                    />
                </div>
            </section>
        </>
    )
}
