"use client"
import React, { useEffect, useState, useRef, memo } from "react"
import { useTranslation } from "@/lib/i18n-context"

interface BoxedCountdownProps {
    endDate: string | null
    className?: string
    size?: "sm" | "lg"
    fullWidth?: boolean
}

interface TimeUnitProps {
    value: number
    label: string
    isSeconds?: boolean
    fullWidth?: boolean
    size?: "sm" | "lg"
}

// Memoized TimeUnit to prevent re-renders unless values actually change
const TimeUnit = memo(({ value, label, isSeconds = false, fullWidth = false, size = "lg" }: TimeUnitProps) => {
    // Calculate negative delay to sync infinite animation with the actual start of a system second
    const [syncDelay, setSyncDelay] = useState("0ms");

    useEffect(() => {
        if (isSeconds) {
            const ms = Date.now() % 1000;
            // Negative delay "jumps" the animation to that point in its timeline
            setSyncDelay(`-${ms}ms`);
        }
    }, [isSeconds]);

    return (
        <div
            className={`flex flex-col items-center justify-center bg-white border border-gray-100 rounded-xl shadow-sm transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:border-[#DEB735]/60 hover:shadow-md cursor-default group/box transform-gpu backface-hidden ${isSeconds ? 'hover:animate-timerPulse' : ''} ${fullWidth ? 'flex-1' : ''
                } ${size === 'sm'
                    ? `${fullWidth ? 'py-2 px-1' : 'min-w-[45px] py-1.5 px-1'}`
                    : `${fullWidth ? 'py-4 px-2' : 'min-w-[72px] py-3 px-2'} rounded-2xl`
                }`}
            style={isSeconds ? { animationDelay: syncDelay } : undefined}
        >
            <span className={`font-bold text-gray-400 uppercase tracking-widest transition-colors duration-300 group-hover/box:text-gray-500 ${size === 'sm' ? 'text-[8px] mb-0.5' : 'text-[13px] mb-1'}`}>{label}</span>
            <span className={`font-black text-[#103090] leading-none transition-colors duration-300 group-hover/box:text-[#B8071C] tabular-nums ${size === 'sm' ? 'text-lg' : 'text-3xl'}`}>{String(value).padStart(2, '0')}</span>
        </div>
    );
});

TimeUnit.displayName = "TimeUnit";

export default function BoxedCountdown({ endDate, className, size = "lg", fullWidth = false }: BoxedCountdownProps) {
    const { t } = useTranslation()

    const [nowMs, setNowMs] = useState<number>(Date.now())
    const lastUpdateRef = useRef<number>(0)

    useEffect(() => {
        let mounted = true
        const { subscribeClock } = require("@/lib/clock")
        const unsub = subscribeClock((t: number) => {
            if (!mounted) return
            const now = Math.round(t)
            if (now - lastUpdateRef.current >= 900) {
                lastUpdateRef.current = now
                setNowMs(now)
            }
        })
        return () => {
            mounted = false
            try { if (typeof unsub === "function") unsub() } catch { }
        }
    }, [])

    if (!endDate) return null
    const endTs = Date.parse(endDate)
    const remainingMs = Math.max(0, endTs - nowMs)

    if (remainingMs <= 0) return null

    const totalSeconds = Math.floor(remainingMs / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    return (
        <div className={`flex ${fullWidth ? 'w-full' : ''} ${size === 'sm' ? 'gap-1.5' : 'gap-3'} ${className}`}>
            <TimeUnit value={days} label={t("time.short_days") || "Days"} size={size} fullWidth={fullWidth} />
            <TimeUnit value={hours} label={t("time.short_hours") || "Hrs"} size={size} fullWidth={fullWidth} />
            <TimeUnit value={mins} label={t("time.short_minutes") || "Min"} size={size} fullWidth={fullWidth} />
            <TimeUnit value={secs} label={t("time.short_seconds") || "Sec"} size={size} fullWidth={fullWidth} isSeconds={true} />
        </div>
    )
}
