"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { CAR_COLORS } from "@/lib/car-colors";
import { useTranslation } from "@/lib/i18n-context";

interface ColorDropdownProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minimal?: boolean;
}

export function ColorDropdown({ value, onChange, placeholder, className, minimal }: ColorDropdownProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedColor = CAR_COLORS.find(c => c.value === value);

    const buttonClasses = minimal
        ? "w-full bg-transparent border-0 px-0 py-1 text-base font-medium text-[#103090] placeholder-gray-400 focus:outline-none transition-colors flex items-center justify-between gap-2 font-serif"
        : "w-full bg-white border border-gray-300 px-3 py-2 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8071C] focus:border-transparent transition-all flex items-center justify-between gap-2";

    return (
        <div ref={dropdownRef} className={`relative ${className || ""}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={buttonClasses}
            >
                <div className="flex items-center gap-2">
                    {selectedColor ? (
                        <>
                            <span
                                className="w-5 h-5 rounded-md border border-gray-300 flex-shrink-0"
                                style={{
                                    background: selectedColor.hex.startsWith("linear") || selectedColor.hex.startsWith("conic")
                                        ? selectedColor.hex
                                        : selectedColor.hex
                                }}
                            />
                            <span>{t(`colors.${selectedColor.value}` as any)}</span>
                        </>
                    ) : (
                        <span className="text-gray-400">{placeholder || t('wizard.fields.select')}</span>
                    )}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Select option */}
                    <button
                        type="button"
                        onClick={() => {
                            onChange("");
                            setIsOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-50 flex items-center gap-2"
                    >
                        {placeholder || t('wizard.fields.select')}
                    </button>

                    {/* Color options */}
                    {CAR_COLORS.map((color) => {
                        const isSelected = value === color.value;
                        return (
                            <button
                                key={color.value}
                                type="button"
                                onClick={() => {
                                    onChange(color.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${isSelected
                                    ? "bg-[#B8071C]/10 text-[#B8071C]"
                                    : "hover:bg-gray-50 text-gray-700"
                                    }`}
                            >
                                <span
                                    className={`w-5 h-5 rounded-md flex-shrink-0 ${color.border ? "border border-gray-300" : ""}`}
                                    style={{
                                        background: color.hex.startsWith("linear") || color.hex.startsWith("conic")
                                            ? color.hex
                                            : color.hex
                                    }}
                                />
                                <span className="flex-grow">{t(`colors.${color.value}` as any)}</span>
                                {isSelected && <Check className="w-4 h-4 text-[#B8071C]" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
