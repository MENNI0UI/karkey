"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Check, X } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"

type Option = {
    value: string
    label: string
}

type Props = {
    value: string[]
    onChange: (value: string[]) => void
    options: Option[]
    placeholder?: string
    className?: string
    label?: string
    isAll?: boolean
}

export default function CustomMultiSelect({ value, onChange, options, placeholder, className = "", label }: Props) {
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const updatePosition = useCallback(() => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const isRtl = document.documentElement.dir === "rtl"

        setDropdownStyle({
            position: "fixed",
            top: rect.bottom + 8,
            left: isRtl ? "auto" : rect.left,
            right: isRtl ? window.innerWidth - rect.right : "auto",
            minWidth: Math.max(rect.width, 200),
            zIndex: 99999,
        })
    }, [])

    useEffect(() => {
        if (isOpen) {
            updatePosition()
            window.addEventListener("scroll", updatePosition, true)
            window.addEventListener("resize", updatePosition)
        }
        return () => {
            window.removeEventListener("scroll", updatePosition, true)
            window.removeEventListener("resize", updatePosition)
        }
    }, [isOpen, updatePosition])

    useEffect(() => {
        if (!isOpen) return
        const handleClick = (e: MouseEvent) => {
            if (
                containerRef.current && !containerRef.current.contains(e.target as Node) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false)
            }
        }
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false)
        }
        document.addEventListener("mousedown", handleClick)
        document.addEventListener("keydown", handleEsc)
        return () => {
            document.removeEventListener("mousedown", handleClick)
            document.removeEventListener("keydown", handleEsc)
        }
    }, [isOpen])

    const toggleOption = (val: string) => {
        if (val === "All") {
            onChange([])
            return
        }
        const next = value.includes(val)
            ? value.filter(v => v !== val)
            : [...value, val]
        onChange(next)
    }

    const isSelected = (val: string) => value.includes(val)
    const isAllSelected = value.length === 0 || (value.length === 1 && value[0] === "All")

    const getDisplayLabel = () => {
        if (isAllSelected) return t("filters.all") || "All"
        if (value.length === 1) {
            const opt = options.find(o => o.value === value[0])
            return opt ? opt.label : value[0]
        }
        return `${value.length} ${t("filters.selected") || "Selected"}`
    }

    const dropdown = isOpen && mounted ? createPortal(
        <div
            ref={dropdownRef}
            className="custom-select-dropdown p-1"
            style={dropdownStyle}
            role="listbox"
        >
            <button
                type="button"
                role="option"
                aria-selected={isAllSelected}
                className={`custom-select-option flex items-center justify-between ${isAllSelected ? "custom-select-option--selected" : ""}`}
                onClick={() => {
                    onChange([])
                    setIsOpen(false)
                }}
            >
                <span>{t("filters.all") || "All"}</span>
                {isAllSelected && <Check className="w-4 h-4 text-[#00A651]" />}
            </button>

            <div className="border-t my-1 border-gray-100" />

            <div className="max-h-[240px] overflow-y-auto">
                {options.filter(o => o.value !== "All").map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected(option.value)}
                        className={`custom-select-option flex items-center justify-between ${isSelected(option.value) ? "custom-select-option--selected" : ""}`}
                        onClick={() => toggleOption(option.value)}
                    >
                        <span className="truncate mr-2">{option.label}</span>
                        <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${isSelected(option.value) ? "bg-[#00A651] border-[#00A651]" : "border-gray-300"}`}>
                            {isSelected(option.value) && <Check className="w-3 h-3 text-white" />}
                        </div>
                    </button>
                ))}
            </div>

            {value.length > 0 && (
                <>
                    <div className="border-t my-1 border-gray-100" />
                    <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-[#B8071C] hover:bg-red-50 transition-colors"
                        onClick={() => onChange([])}
                    >
                        {t("filters.clear_all") || "Clear All"}
                    </button>
                </>
            )}
        </div>,
        document.body
    ) : null

    return (
        <div ref={containerRef} className={`custom-select-container ${className}`}>
            {label && <label className="sb-label">{label}</label>}
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`custom-select-trigger ${isAllSelected ? "custom-select-trigger--all" : ""}`}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <span className="custom-select-value truncate font-medium">{getDisplayLabel()}</span>
                <div className="flex items-center gap-1">
                    {value.length > 0 && (
                        <div
                            onClick={(e) => { e.stopPropagation(); onChange([]); }}
                            className="hover:bg-gray-100 rounded-full p-0.5"
                        >
                            <X className="w-3 h-3 text-gray-400" />
                        </div>
                    )}
                    <ChevronDown className={`custom-select-arrow transition-transform duration-300 w-4 h-4 ${isOpen ? "rotate-180 text-[#00A651]" : "text-gray-400"}`} />
                </div>
            </button>
            {dropdown}
        </div>
    )
}
