"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { CAR_COLORS } from "@/lib/car-colors";
import { useTranslation } from "@/lib/i18n-context";

interface ColorSelectorGridProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    required?: boolean;
}

export function ColorSelectorGrid({
    value,
    onChange,
    label,
    required,
}: ColorSelectorGridProps) {
    const { t } = useTranslation();
    const [hoveredColor, setHoveredColor] = useState<string | null>(null);

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    {label}
                    {required && <span className="text-[#B8071C] ml-0.5">*</span>}
                </label>
            )}

            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
                {CAR_COLORS.map((color) => {
                    const isSelected = value === color.value;
                    const isHovered = hoveredColor === color.value;

                    return (
                        <button
                            key={color.value}
                            type="button"
                            onClick={() => onChange(color.value)}
                            onMouseEnter={() => setHoveredColor(color.value)}
                            onMouseLeave={() => setHoveredColor(null)}
                            className={`group relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${isSelected
                                ? "bg-[#B8071C]/10 ring-2 ring-[#B8071C]"
                                : "hover:bg-gray-50"
                                }`}
                            title={t(`colors.${color.value}` as any)}
                        >
                            {/* Color Circle */}
                            <div
                                className={`w-8 h-8 rounded-full transition-transform ${isSelected || isHovered ? "scale-110" : ""
                                    } ${color.border ? "border border-gray-300" : ""}`}
                                style={{
                                    background: color.hex,
                                }}
                            >
                                {isSelected && (
                                    <div className="w-full h-full rounded-full flex items-center justify-center bg-black/20">
                                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                                    </div>
                                )}
                            </div>

                            {/* Color Name */}
                            <span
                                className={`text-[10px] text-center truncate w-full ${isSelected ? "text-[#B8071C] font-medium" : "text-gray-500"
                                    }`}
                            >
                                {t(`colors.${color.value}` as any)}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Selected Color Display */}
            {value && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-lg">
                    <div
                        className={`w-5 h-5 rounded-full ${CAR_COLORS.find((c) => c.value === value)?.border
                            ? "border border-gray-300"
                            : ""
                            }`}
                        style={{
                            background: CAR_COLORS.find((c) => c.value === value)?.hex,
                        }}
                    />
                    <span className="text-sm text-[#103090] font-medium">
                        {t(`colors.${value}` as any)}
                    </span>
                </div>
            )}
        </div>
    );
}
