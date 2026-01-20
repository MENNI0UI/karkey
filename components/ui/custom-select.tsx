"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"

type Option = {
  value: string
  label: string
}

type Props = {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  label?: string
  isAll?: boolean
}

export default function CustomSelect({ value, onChange, options, placeholder, className = "", label, isAll }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate dropdown position
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const isRtl = document.documentElement.dir === "rtl"

    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left: isRtl ? "auto" : rect.left,
      right: isRtl ? window.innerWidth - rect.right : "auto",
      minWidth: rect.width, // At least container width, but can grow if needed
      zIndex: 9999,
    })
  }, [])

  // Update position when open
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

  // Close on outside click
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

  // Get selected label
  const selectedOption = options.find(o => o.value === value)
  const displayLabel = selectedOption?.label || placeholder || value

  const dropdown = isOpen && mounted ? createPortal(
    <div
      ref={dropdownRef}
      className="custom-select-dropdown"
      style={dropdownStyle}
      role="listbox"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="option"
          aria-selected={option.value === value}
          className={`custom-select-option ${option.value === value ? "custom-select-option--selected" : ""}`}
          onClick={() => {
            onChange(option.value)
            setIsOpen(false)
          }}
        >
          {option.label}
        </button>
      ))}
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
        className={`custom-select-trigger ${isAll ? "custom-select-trigger--all" : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="custom-select-value font-medium">{displayLabel}</span>
        <ChevronDown className={`custom-select-arrow transition-transform duration-300 w-4 h-4 ${isOpen ? "rotate-180 text-[#00A651]" : "text-gray-400"}`} />
      </button>
      {dropdown}
    </div>
  )
}
