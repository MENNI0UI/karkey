"use client";

import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface MinimalInputProps {
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    tooltip?: string;
    children: React.ReactNode;
}

export function MinimalInputWrapper({
    label,
    required,
    error,
    hint,
    tooltip,
    children,
}: MinimalInputProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1.5">
                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.15em] font-serif">
                    {label}
                    {required && <span className="text-[#B8071C] ms-1">*</span>}
                </label>
                {tooltip && (
                    <div className="group relative">
                        <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center text-[12px] font-black text-gray-500 cursor-help hover:border-[#103090] hover:text-[#103090] transition-colors bg-white/50">
                            !
                        </div>
                        <div className="absolute bottom-full left-0 mb-4 w-80 p-5 bg-gray-900/95 backdrop-blur-md text-white text-[13px] font-medium leading-[1.7] rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] pointer-events-none border border-white/20">
                            {tooltip}
                            <div className="absolute top-full left-2.5 border-[7px] border-transparent border-t-gray-900/95" />
                        </div>
                    </div>
                )}
            </div>
            <div className={`luxury-input-container ${error ? "!border-red-300 !bg-red-50/30" : ""}`}>
                {children}
            </div>
            {hint && !error && (
                <p className="text-[10px] text-gray-400 font-sans ps-1">{hint}</p>
            )}
            {error && (
                <p className="text-xs text-red-500 font-medium font-sans ps-1">{error}</p>
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
                    className={`w-full bg-transparent border-0 px-0 py-1 text-base font-medium text-[#103090] placeholder-gray-400 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-serif ${isNumber && suffix ? "ltr:pr-16 rtl:pl-16" : suffix ? "ltr:pr-8 rtl:pl-8" : ""} ${className}`}
                    step={step}
                    {...props}
                />

                {/* Number Controls + Suffix Container */}
                <div className="absolute ltr:right-0 rtl:left-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
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
                        <span className="text-xs font-medium text-gray-400 ltr:pl-1 rtl:pr-1">
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
                className={`w-full bg-transparent border-0 px-0 py-1 text-base font-medium text-[#103090] focus:outline-none transition-colors cursor-pointer font-serif ${!props.value ? "text-gray-400" : ""} ${className}`}
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
                    <div className="absolute bottom-3 ltr:right-3 rtl:left-3 text-xs text-gray-400 pointer-events-none">
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
