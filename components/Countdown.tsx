"use client"
import React, { useEffect, useRef, useState } from "react"
import { useTranslation } from "@/lib/i18n-context"

type Props = {
  startDate?: string | null
  endDate?: string | null
  serverOffsetMs?: number | null
  className?: string
}

export default function Countdown({ startDate, endDate, serverOffsetMs = null, className = "" }: Props) {
  const { t, language } = useTranslation()
  const cssClass = `card-countdown-overlay ${className}`.trim()

  function formatDelta(ms: number) {
    if (ms <= 0) return "00:00:00"
    const totalSeconds = Math.floor(ms / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    // always include seconds; when days > 0 show "Xd HH:MM:SS"
    const hh = String(hours).padStart(2, "0")
    const mm = String(mins).padStart(2, "0")
    const ss = String(secs).padStart(2, "0")
    if (days > 0) {
      if (language === 'ar') {
        let dayStr = t("time.days")
        if (days === 1) dayStr = t("time.day_singular" as any)
        else if (days === 2) dayStr = t("time.day_dual" as any)
        else if (days >= 3 && days <= 10) dayStr = t("time.days_plural" as any)
        else if (days >= 11) dayStr = t("time.day_plural_gt10" as any)
        
        // For 2 days, we don't show the number
        if (days === 2) return `${dayStr} ${hh}:${mm}:${ss}`
        return `${days} ${dayStr} ${hh}:${mm}:${ss}`
      }
      return `${days}${t("time.days")} ${hh}:${mm}:${ss}`
    }
    return `${hh}:${mm}:${ss}`
  }

  // store current aligned now (ms) to drive UI
  const [nowMs, setNowMs] = useState<number>(() => {
    const offset = typeof serverOffsetMs === "number" ? serverOffsetMs : 0
    return Math.round(Date.now() - offset)
  })

  const lastUpdateRef = useRef<number>(0)

  // aligned time helper
  const alignedNow = () => {
    const offset = typeof serverOffsetMs === "number" ? serverOffsetMs : 0
    return Math.round(Date.now() - offset)
  }

  useEffect(() => {
    // Use shared clock to avoid one RAF per Countdown component
    let mounted = true
    // lazy import to avoid circular deps at module load
    const { subscribeClock } = require("@/lib/clock")
    const unsub = subscribeClock((t: number) => {
      if (!mounted) return
      const now = Math.round(t - (typeof serverOffsetMs === "number" ? serverOffsetMs : 0))
      if (now - lastUpdateRef.current >= 900) {
        lastUpdateRef.current = now
        setNowMs(now)
      }
    })
    return () => {
      mounted = false
      try { if (typeof unsub === "function") unsub() } catch {}
    }
  }, [serverOffsetMs])

  // Do not render if no dates provided
  if (!startDate && !endDate) return null

  const startTs = startDate ? Date.parse(startDate) : NaN
  const endTs = endDate ? Date.parse(endDate) : NaN

  let label = ""
  let remainingMs = 0
  if (!isNaN(startTs) && nowMs < startTs) {
    label = t("time.starts_in")
    remainingMs = startTs - nowMs
  } else if (!isNaN(endTs) && nowMs < endTs) {
    label = t("time.ends_in")
    remainingMs = endTs - nowMs
  } else {
    label = t("time.completed")
    remainingMs = 0
  }

  // Minimal debug attribute: data-now shows the current aligned time (inspect in Elements)
  return (
    <div className={cssClass} role="timer" aria-live="off" data-start={startDate} data-end={endDate} data-now={new Date(nowMs).toISOString()}>
      <div className="cd-label">{label}</div>
      <div className="cd-time">{remainingMs > 0 ? formatDelta(remainingMs) : t("time.completed")}</div>
    </div>
  )
}

// renamed helper to avoid duplicate symbol name collision with default export above
export function CountdownInline({ until }: { until?: string | null }) {
  return <span className="card-countdown">{until ? String(until) : "—"}</span>
}
