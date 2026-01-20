"use client"
import React from "react"

type NotificationActionButtonProps = {
  children: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  className?: string
}

export default function NotificationActionButton({ children, onClick, className }: NotificationActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] font-bold px-2 py-1 bg-white border border-[#B8071C]/30 rounded text-[#B8071C] hover:bg-[#B8071C]/5 transition-colors ${className ?? ""}`}
    >
      {children}
    </button>
  )
}
