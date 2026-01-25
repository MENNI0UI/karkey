import { CAR_COLORS } from "@/lib/car-colors"
import { useTranslation } from "@/lib/i18n-context"

interface FilterColorsProps {
    selected: string[]
    onToggle: (value: string) => void
    onClear: () => void
    anyLabel?: string
}

export function FilterColors({ selected, onToggle, onClear, anyLabel = "Any" }: FilterColorsProps) {
    const { t } = useTranslation()

    const isSelected = (val: string) => selected.includes(val.toLowerCase().trim())

    const chipClass = (active: boolean) =>
        `px-3 py-1.5 rounded-full border text-sm font-medium font-serif transition-colors touch-action-manipulation cursor-pointer ${active
            ? "bg-[#B8071C] text-white border-[#B8071C]"
            : "text-[#111827] border-[#d1d5db] lg:hover:border-[#B8071C]"
        }`

    return (
        <div className="flex flex-wrap gap-2">
            {CAR_COLORS.map(color => {
                const active = isSelected(color.value)

                return (
                    <button
                        key={color.value}
                        type="button"
                        className={`
              w-8 h-8 rounded-full border-2 transition-all 
              touch-action-manipulation cursor-pointer
              ${active
                                ? "ring-2 ring-[#B8071C] ring-offset-2"
                                : "lg:hover:scale-110" // Strict desktop-only hover
                            } 
              ${color.border ? "border-gray-300" : "border-transparent"}
            `}
                        style={{ background: color.hex }}
                        onClick={() => onToggle(color.value)}
                        title={t(`colors.${color.value}` as any) || color.value}
                    />
                )
            })}

            <button
                type="button"
                className={chipClass(selected.length === 0)}
                onClick={onClear}
            >
                {anyLabel}
            </button>
        </div>
    )
}
