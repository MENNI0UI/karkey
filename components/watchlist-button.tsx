"use client"
import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Heart } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"
import { useAuth } from "@/lib/auth-context"
import { emit } from "@/lib/events"
import logger from "@/lib/logger"

interface WatchlistButtonProps {
    id: number | string
    // determines which API to call. Currently both seem to use direct-sales-watchlist, 
    // but passing it allows future flexibility or correcting if one should be 'auction'
    type?: "direct-sale" | "auction"
    initialSaved?: boolean
    ownerUserId?: number | string | null
    vehicleLabel?: string
    variant?: "default" | "minimal" // 'minimal' could be just the heart without bubble logic if needed, but defaults to full
}

export function WatchlistButton({
    id,
    type = "direct-sale",
    initialSaved = false,
    ownerUserId,
    vehicleLabel = "vehicle"
}: WatchlistButtonProps) {
    const { t, language } = useTranslation()
    const { currentUserId, isLoaded: authLoaded } = useAuth()

    const auctionId = id // alias for consistency with legacy code vars

    // --- STATE ---
    // prefer server-provided initialSaved, fallback to local storage
    const cachedKey = id ? `watchlist_cached:${id}` : null
    const [saved, setSaved] = useState<boolean>(initialSaved)
    const [stableSaved, setStableSaved] = useState<boolean>(initialSaved)
    const [saving, setSaving] = useState<boolean>(false)

    // Bubble state
    const [bubbleOpen, setBubbleOpen] = useState<boolean>(false)
    const [bubbleType, setBubbleType] = useState<"signin" | "confirm" | "success" | "error" | null>(null)
    const [bubbleText, setBubbleText] = useState<string | null>(null)
    const [confirmIsRemove, setConfirmIsRemove] = useState<boolean>(false)

    // Refs
    const bubbleTimerRef = useRef<any>(null)
    const bubbleRef = useRef<HTMLDivElement | null>(null)
    const btnRef = useRef<HTMLButtonElement | null>(null)
    const bubbleAutoHideMsRef = useRef<number>(4000)
    const bubbleStartTimeRef = useRef<number>(0)
    const lastSavedToggleRef = useRef<number>(0)

    // Owner check
    const confirmedOwner = !!(authLoaded && currentUserId && ownerUserId && Number(currentUserId) === Number(ownerUserId))

    // Helper: update saved state with debounce to prevent flicker
    const safeSetSaved = (val: boolean) => {
        const now = Date.now()
        if (now - lastSavedToggleRef.current < 250) return
        lastSavedToggleRef.current = now
        setSaved(val)
    }

    // Effect: sync stableSaved with saved (deferred)
    useEffect(() => {
        const timer = setTimeout(() => setStableSaved(saved), 200)
        return () => clearTimeout(timer)
    }, [saved])

    // Effect: Initial fetch / Restore from cache
    useEffect(() => {
        // 1. Try cached UI
        if (cachedKey) {
            try {
                const cv = localStorage.getItem(cachedKey)
                if (cv === "1") { setSaved(true); setStableSaved(true) }
                else if (cv === "0") { setSaved(false); setStableSaved(false) }
            } catch { }
        }

        if (!authLoaded) return
        if (!currentUserId) {
            setSaved(false)
            if (cachedKey) localStorage.setItem(cachedKey, "0")
            return
        }

        let mounted = true
        // 2. Fetch from API
        const check = async () => {
            try {
                // Based on type, selecting endpoint. currently both use direct-sales-watchlist
                // If type is auction, one might expect /api/auctions-watchlist, but per existing code it uses direct-sales logic?
                // We keep using direct-sales-watchlist for now as observed in AuctionCard
                const endpoint = `/api/direct-sales-watchlist/check?direct_sale_id=${encodeURIComponent(String(id))}`

                const res = await fetch(endpoint, {
                    credentials: "include",
                    cache: "no-store"
                })
                if (res.ok && mounted) {
                    const data = await res.json().catch(() => null)
                    if (data && typeof data.saved === "boolean") {
                        safeSetSaved(data.saved)
                        if (cachedKey) localStorage.setItem(cachedKey, data.saved ? "1" : "0")
                    }
                }
            } catch { }
        }
        void check()

        return () => { mounted = false }
    }, [id, authLoaded, currentUserId, cachedKey, type])

    // Effect: Listen for events (storage, watchlist:changed)
    useEffect(() => {
        const onWatchlistChanged = (e: Event) => {
            const d = (e as CustomEvent)?.detail
            if (!d) return
            // checks...
            // "auctionId" or "direct_sale_id" or "id"
            const eventId = String(d.auctionId ?? d.direct_sale_id ?? d.id ?? "")
            if (String(id) !== eventId) return

            if (d.userId && currentUserId && Number(d.userId) !== Number(currentUserId)) return

            if (d.action === "add") {
                safeSetSaved(true)
                if (cachedKey) localStorage.setItem(cachedKey, "1")
            } else if (d.action === "remove") {
                safeSetSaved(false)
                if (cachedKey) localStorage.setItem(cachedKey, "0")
            }
        }

        const onBubbleOpened = (e: Event) => {
            const d = (e as CustomEvent)?.detail
            if (d && String(d.id) !== String(id)) hideBubble()
        }

        window.addEventListener("watchlist:changed", onWatchlistChanged)
        window.addEventListener("watchlist:bubble-opened", onBubbleOpened)
        return () => {
            window.removeEventListener("watchlist:changed", onWatchlistChanged)
            window.removeEventListener("watchlist:bubble-opened", onBubbleOpened)
        }
    }, [id, currentUserId, cachedKey])

    // --- ACTIONS ---

    const showBubble = (type: typeof bubbleType, text?: string, autoHideMs?: number) => {
        setBubbleType(type)
        setBubbleText(text ?? null)
        setBubbleOpen(true)
        window.dispatchEvent(new CustomEvent("watchlist:bubble-opened", { detail: { id } }))

        if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
        const ms = autoHideMs || 4000
        bubbleAutoHideMsRef.current = ms
        bubbleStartTimeRef.current = Date.now()

        bubbleTimerRef.current = setTimeout(() => hideBubble(), ms)
    }

    const hideBubble = () => {
        if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
        bubbleTimerRef.current = null
        setBubbleOpen(false)
        setBubbleType(null)
    }

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation()
        if (confirmedOwner) {
            showBubble("error", t("watchlist.own_listing"))
            return
        }
        if (saving) return

        if (!currentUserId) {
            // Check local auth token as fallback?
            // Simplified: just show signin
            showBubble("signin", t("watchlist.signin_required"))
            return
        }

        if (saved) {
            setConfirmIsRemove(true)
            showBubble("confirm", t("watchlist.remove_confirm"))
        } else {
            setConfirmIsRemove(false)
            showBubble("confirm", t("watchlist.add_confirm"))
        }
    }

    const confirmAction = async (isRemove: boolean) => {
        hideBubble()
        if (saving) return
        setSaving(true)

        const prevSaved = saved
        // Optimistic
        safeSetSaved(!isRemove)
        if (cachedKey) localStorage.setItem(cachedKey, !isRemove ? "1" : "0")

        try {
            const endpoint = isRemove ? "/api/direct-sales-watchlist/remove" : "/api/direct-sales-watchlist/add"
            const body = { direct_sale_id: Number(id) } // assuming API always expects direct_sale_id

            // Headers setup ...
            const headers: Record<string, string> = { "Content-Type": "application/json" }
            try {
                const localToken = localStorage.getItem("auth_token") ?? localStorage.getItem("auth:token");
                if (localToken && localStorage.getItem("auth:disabled") !== "1") {
                    headers["Authorization"] = `Bearer ${localToken}`;
                }
            } catch { }

            const res = await fetch(endpoint, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
                credentials: "include"
            })

            if (res.status === 401) {
                safeSetSaved(prevSaved) // rollback
                if (cachedKey) localStorage.setItem(cachedKey, prevSaved ? "1" : "0")
                showBubble("signin", t("watchlist.signin_required"))
                return
            }

            const json = await res.json().catch(() => ({}))

            if (res.ok && (json.success || json.alreadyExists || json.removed)) {
                const msg = !isRemove
                    ? t("watchlist.success_add").replace("{model}", vehicleLabel)
                    : t("watchlist.success_remove").replace("{model}", vehicleLabel)
                showBubble("success", msg, 2000)

                // emit events
                emit("watchlist:changed", { auctionId: Number(id), direct_sale_id: Number(id), userId: currentUserId, action: isRemove ? "remove" : "add" })
                // also direct sales specific event
                emit("watchlist:changed", { direct_sale_id: Number(id), userId: currentUserId, action: isRemove ? "remove" : "add" })
            } else {
                throw new Error(json.error || "Request failed")
            }

        } catch (err) {
            logger.error("Watchlist action failed", err)
            safeSetSaved(prevSaved)
            if (cachedKey) localStorage.setItem(cachedKey, prevSaved ? "1" : "0")
            showBubble("error", t("watchlist.error"))
        } finally {
            setSaving(false)
        }
    }

    // bubble hover logic
    const pauseTimer = () => {
        if (bubbleTimerRef.current) {
            clearTimeout(bubbleTimerRef.current)
            const elapsed = Date.now() - bubbleStartTimeRef.current
            bubbleAutoHideMsRef.current = Math.max(0, bubbleAutoHideMsRef.current - elapsed)
        }
    }
    const resumeTimer = () => {
        if (bubbleOpen) {
            bubbleStartTimeRef.current = Date.now()
            bubbleTimerRef.current = setTimeout(hideBubble, bubbleAutoHideMsRef.current || 4000)
        }
    }

    if (confirmedOwner) {
        // Option: return null or render disabled button?
        // Existing behavior: render button that errors on click.
    }

    return (
        <div className="flex flex-col items-end gap-2 relative">
            {bubbleOpen && (
                <div
                    ref={bubbleRef}
                    className={`watchlist-msg watchlist-msg--${bubbleType ?? "signin"} mb-2 z-50`}
                    role="status"
                    aria-live="polite"
                    onMouseEnter={pauseTimer}
                    onMouseLeave={resumeTimer}
                    onClick={(e) => e.stopPropagation()} // prevent card click
                >
                    <div className="watchlist-msg-text">{bubbleText}</div>
                    {bubbleType === "signin" && (
                        <div className="watchlist-msg-actions">
                            <Link href={`/${language}/auth/login`} className="watchlist-msg-link">{t("nav.signin")}</Link>
                        </div>
                    )}
                    {bubbleType === "confirm" && (
                        <div className="watchlist-msg-actions">
                            <button
                                onClick={(e) => { e.stopPropagation(); confirmAction(confirmIsRemove) }}
                                className="watchlist-msg-btn watchlist-msg-btn--confirm"
                            >
                                {confirmIsRemove ? t("common.remove") : t("common.add")}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); hideBubble() }} className="watchlist-msg-btn">
                                {t("common.cancel")}
                            </button>
                        </div>
                    )}
                </div>
            )}
            <button
                ref={btnRef}
                type="button"
                onClick={handleToggle}
                className={`watchlist-btn ${stableSaved ? "watchlist-btn--saved" : ""}`}
                aria-label={stableSaved ? "Remove from watchlist" : "Add to watchlist"}
                // Avoid bubbling to card link
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
            >
                <span className="heart-icon-wrap" aria-hidden>
                    <Heart className={`heart-icon heart-icon-outline ${stableSaved ? "opacity-0" : "opacity-100"}`} size={16} />
                    <Heart className={`heart-icon heart-icon-filled ${stableSaved ? "opacity-100 animate-heart-pop" : "opacity-0"}`} size={16} fill="currentColor" />
                </span>
            </button>
        </div>
    )
}
