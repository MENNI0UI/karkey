import { cn } from "@/lib/utils"

interface ChipOption {
    value: string
    label: string
}

interface FilterChipsProps {
    options: ChipOption[]
    selected: string[]
    onToggle: (value: string) => void
    onClear?: () => void
    anyLabel?: string
    colorTheme?: "primary" | "green" // Red or Green active state
}

export function FilterChips({
    options,
    selected,
    onToggle,
    onClear,
    anyLabel = "Any",
    colorTheme = "primary"
}: FilterChipsProps) {

    // Normalize checking
    const isSelected = (val: string) => selected.includes(val.toLowerCase().trim())

    const baseClasses = "px-3 py-1.5 rounded-full border text-sm font-medium font-serif transition-colors touch-action-manipulation cursor-pointer select-none"

    // Theme logic
    const getClasses = (active: boolean) => {
        if (active) {
            if (colorTheme === 'green') return `${baseClasses} bg-[#00A651] text-white border-[#00A651]`
            return `${baseClasses} bg-[#B8071C] text-white border-[#B8071C]`
        }
        // Inactive logic (Desktop hover only)
        if (colorTheme === 'green') return `${baseClasses} text-[#00A651] border-[#00A651] bg-white lg:hover:bg-[#00A651] lg:hover:text-white`
        return `${baseClasses} text-[#111827] border-[#d1d5db] bg-white lg:hover:border-[#B8071C]`
    }

    return (
        <div className="flex flex-wrap gap-2">
            {/* Options */}
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onToggle(opt.value)}
                    className={getClasses(isSelected(opt.value))}
                >
                    {opt.label}
                </button>
            ))}

            {/* Any Button (Clear) */}
            {onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    className={getClasses(selected.length === 0)}
                >
                    {anyLabel}
                </button>
            )}
        </div>
    )
}
