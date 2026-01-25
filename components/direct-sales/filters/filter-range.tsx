interface FilterRangeProps {
    min: string
    max: string
    onChangeMin: (val: string) => void
    onChangeMax: (val: string) => void
    minPlaceholder?: string
    maxPlaceholder?: string
    labelMin?: string
    labelMax?: string
    step?: string
}

export function FilterRange({
    min, max, onChangeMin, onChangeMax,
    minPlaceholder = "Min", maxPlaceholder = "Max",
    labelMin, labelMax, step = "1"
}: FilterRangeProps) {

    const fieldClass = "w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] bg-white font-serif touch-action-manipulation"

    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
                {labelMin && <label className="text-xs font-medium text-[#6b7280] font-serif">{labelMin}</label>}
                <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={step}
                    value={min}
                    onChange={e => onChangeMin(e.target.value)}
                    placeholder={minPlaceholder}
                    className={fieldClass}
                />
            </div>
            <div className="flex flex-col gap-1.5">
                {labelMax && <label className="text-xs font-medium text-[#6b7280] font-serif">{labelMax}</label>}
                <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={step}
                    value={max}
                    onChange={e => onChangeMax(e.target.value)}
                    placeholder={maxPlaceholder}
                    className={fieldClass}
                />
            </div>
        </div>
    )
}
