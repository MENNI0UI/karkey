"use client"

import React from "react"
import { useTranslation } from "@/lib/i18n-context"

interface SpecItem {
    iconUrl?: string // path to png icon
    label: string
    value?: string | number
    IconComponent?: React.ElementType // fallback lucide icon
    variant?: "default" | "green"
}

interface CarSpecsGridProps {
    specs: SpecItem[]
    compact?: boolean
    iconSize?: number
    gridCols?: string
}

export function CarSpecsGrid({
    specs,
    compact = false,
    iconSize = 4,
    gridCols
}: Readonly<CarSpecsGridProps>) {
    const { language } = useTranslation()
    const validSpecs = specs.filter((s: SpecItem) => (s.value !== undefined && s.value !== null && s.value !== "—" && s.value !== ""))

    if (validSpecs.length === 0) return null

    const defaultGridCols = compact ? 'grid-cols-1' : 'grid-cols-2';

    return (
        <div className={`grid ${gridCols || defaultGridCols} gap-x-5 gap-y-2.5 text-sm text-gray-600 mb-4 font-serif`}>
            {validSpecs.map((spec: SpecItem) => {
                const specKey = `${spec.label}-${spec.value}`;

                return (
                    <div key={specKey} className="flex items-center gap-2.5">
                        {spec.iconUrl ? (
                            <div className="flex-shrink-0" style={{ width: `${iconSize * 0.25}rem`, height: `${iconSize * 0.25}rem` }}>
                                <img
                                    src={spec.iconUrl}
                                    alt=""
                                    className="object-contain w-full h-full"
                                    style={{
                                        filter: spec.variant === "green"
                                            ? 'invert(39%) sepia(87%) saturate(1354%) hue-rotate(133deg) brightness(94%) contrast(105%)'
                                            : 'invert(14%) sepia(87%) saturate(5425%) hue-rotate(348deg) brightness(86%) contrast(100%)'
                                    }}
                                />
                            </div>
                        ) : spec.IconComponent ? (
                            <spec.IconComponent
                                className="flex-shrink-0"
                                style={{
                                    width: `${iconSize * 0.25}rem`,
                                    height: `${iconSize * 0.25}rem`,
                                    color: spec.variant === "green" ? "#00A651" : "#B8071C"
                                }}
                            />
                        ) : null}
                        <span className="truncate flex items-baseline gap-1">
                            <span className={`text-base ${language === 'ar' ? 'font-bold' : 'font-medium'} ${spec.variant === "green" ? "text-[#00A651]" : "text-[#103090]"}`}>{spec.value}</span>
                            {spec.label ? <span className="text-gray-400 text-xs font-medium">{spec.label}</span> : ""}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}
