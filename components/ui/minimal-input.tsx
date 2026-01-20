"use client";

import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface MinimalInputProps {
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    children: React.ReactNode;
}

export function MinimalInputWrapper({
    label,
    required,
    error,
    hint,
    children,
}: MinimalInputProps) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[13px] font-bold text-gray-600 uppercase tracking-wider font-serif">
                {label}
                {required && <span className="text-[#B8071C] ml-1">*</span>}
            </label>
            {children}
            {hint && !error && (
                <p className="text-sm text-gray-400">{hint}</p>
            )}
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    );
}

interface MinimalTextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    suffix?: string;
    step?: number | string;
    decimals?: number;
}

export function MinimalTextInput({
    label,
    required,
    error,
    hint,
    suffix,
    type,
    step = 1,
    decimals,
    className = "",
    value,
    onChange,
    ...props
}: MinimalTextInputProps) {
    const isNumber = type === "number";
    const numericStep = Number(step) || 1;
    const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const valueRef = React.useRef(value);

    // Keep valueRef up to date
    React.useEffect(() => {
        valueRef.current = value;
    }, [value]);

    const formatValue = (num: number): string => {
        if (decimals !== undefined) {
            return num.toFixed(decimals);
        }
        // Auto-detect: if step has decimals, use that precision
        const stepStr = String(numericStep);
        if (stepStr.includes('.')) {
            const decimalPlaces = stepStr.split('.')[1]?.length || 0;
            return num.toFixed(decimalPlaces);
        }
        return String(Math.round(num));
    };

    const doIncrement = React.useCallback(() => {
        if (!onChange) return;
        const currentValue = Number(valueRef.current) || 0;
        const newValue = currentValue + numericStep;
        const formatted = formatValue(newValue);
        valueRef.current = formatted;
        const event = { target: { value: formatted } } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
    }, [onChange, numericStep, decimals]);

    const doDecrement = React.useCallback(() => {
        if (!onChange) return;
        const currentValue = Number(valueRef.current) || 0;
        const newValue = Math.max(0, currentValue - numericStep);
        const formatted = formatValue(newValue);
        valueRef.current = formatted;
        const event = { target: { value: formatted } } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
    }, [onChange, numericStep, decimals]);

    const stopAction = React.useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const startIncrement = React.useCallback(() => {
        doIncrement();
        timeoutRef.current = setTimeout(() => {
            intervalRef.current = setInterval(doIncrement, 50);
        }, 150);
    }, [doIncrement]);

    const startDecrement = React.useCallback(() => {
        doDecrement();
        timeoutRef.current = setTimeout(() => {
            intervalRef.current = setInterval(doDecrement, 50);
        }, 150);
    }, [doDecrement]);

    React.useEffect(() => {
        return () => stopAction();
    }, [stopAction]);

    return (
        <MinimalInputWrapper label={label} required={required} error={error} hint={hint}>
            <div className="relative flex items-center">
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    className={`w-full bg-transparent border-0 border-b-2 border-gray-200 px-0 py-3 text-base font-medium text-[#103090] placeholder-gray-400 focus:outline-none focus:border-[#B8071C] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-serif ${error ? "border-red-500" : ""
                        } ${isNumber && suffix ? "pr-16" : suffix ? "pr-8" : ""} ${className}`}
                    step={step}
                    {...props}
                />

                {/* Number Controls + Suffix Container */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {/* Increment/Decrement Buttons for Number Inputs */}
                    {isNumber && (
                        <div className="flex flex-col -space-y-0.5">
                            <button
                                type="button"
                                onMouseDown={startIncrement}
                                onMouseUp={stopAction}
                                onMouseLeave={stopAction}
                                onTouchStart={startIncrement}
                                onTouchEnd={stopAction}
                                className="h-3 w-4 flex items-center justify-center text-gray-400 hover:text-[#B8071C] transition-colors select-none"
                            >
                                <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                                type="button"
                                onMouseDown={startDecrement}
                                onMouseUp={stopAction}
                                onMouseLeave={stopAction}
                                onTouchStart={startDecrement}
                                onTouchEnd={stopAction}
                                className="h-3 w-4 flex items-center justify-center text-gray-400 hover:text-[#B8071C] transition-colors select-none"
                            >
                                <ChevronDown className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    {/* Suffix */}
                    {suffix && (
                        <span className="text-xs font-medium text-gray-400 pl-1">
                            {suffix}
                        </span>
                    )}
                </div>
            </div>
        </MinimalInputWrapper>
    );
}

interface MinimalSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    options: Array<{ value: string; label: string }>;
    placeholder?: string;
}

export function MinimalSelect({
    label,
    required,
    error,
    hint,
    options,
    placeholder = "Select",
    className = "",
    ...props
}: MinimalSelectProps) {
    return (
        <MinimalInputWrapper label={label} required={required} error={error} hint={hint}>
            <select
                className={`w-full bg-transparent border-0 border-b-2 border-gray-200 px-0 py-3 text-base font-medium text-[#103090] focus:outline-none focus:border-[#B8071C] transition-colors cursor-pointer font-serif ${error ? "border-red-500" : ""
                    } ${!props.value ? "text-gray-400" : ""} ${className}`}
                {...props}
            >
                <option value="" className="text-gray-400">{placeholder}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="text-[#103090]">
                        {opt.label}
                    </option>
                ))}
            </select>
        </MinimalInputWrapper>
    );
}

interface MinimalTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    charCount?: number;
    minChars?: number;
}

export function MinimalTextarea({
    label,
    required,
    error,
    hint,
    charCount,
    minChars,
    className = "",
    value,
    onChange,
    id,
    ...props
}: MinimalTextareaProps) {
    const textareaId = id || `textarea-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <MinimalInputWrapper label={label} required={required} error={error} hint={hint}>
            <div className="relative">
                <textarea
                    id={textareaId}
                    value={value}
                    onChange={onChange}
                    className={`w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-6 py-4 text-base font-medium text-[#103090] placeholder-gray-400 focus:outline-none focus:border-[#B8071C] focus:bg-white transition-all resize-none font-serif ${error ? "border-red-500" : ""
                        } ${className}`}
                    {...props}
                />
                {charCount !== undefined && (
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400 pointer-events-none">
                        <span className={charCount < (minChars || 0) ? "text-red-500" : ""}>
                            {charCount}
                        </span>
                        {minChars && <span>/{minChars} min</span>}
                    </div>
                )}
            </div>
        </MinimalInputWrapper>
    );
}
