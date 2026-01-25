import { ReactNode, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface FilterSectionProps {
    title: string
    children: ReactNode
    defaultExpanded?: boolean
    className?: string
}

export function FilterSection({ title, children, defaultExpanded = true, className = "" }: FilterSectionProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)

    return (
        <div className={`border-b border-gray-100 py-4 ${className}`}>
            <button
                type="button"
                className="flex items-center justify-between w-full mb-3 group touch-action-manipulation cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="font-serif font-medium text-[15px] text-[#111827] group-hover:text-[#B8071C] transition-colors flex-1 text-start">
                    {title}
                </h3>
                <span className="text-gray-400 group-hover:text-[#B8071C] transition-colors p-1">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
            </button>

            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                {children}
            </div>
        </div>
    )
}
