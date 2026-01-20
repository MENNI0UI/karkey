"use client"

import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

type InfoTooltipProps = {
  content: string
  className?: string
}

export function InfoTooltip({ content, className }: InfoTooltipProps) {
  return (
    <span className={cn("relative inline-flex items-center group", className)}>
      <Info className="w-4 h-4 text-blue-500 cursor-help flex-shrink-0" />
      <span className="absolute left-6 top-1/2 -translate-y-1/2 invisible group-hover:visible bg-gray-900 text-white text-xs rounded px-2 py-1.5 whitespace-nowrap z-50 shadow-lg">
        {content}
      </span>
    </span>
  )
}

export default InfoTooltip
