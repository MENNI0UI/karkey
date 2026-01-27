"use client"

import React, { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { MapPin, Heart } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"
import { useAuth } from "@/lib/auth-context"
import { CarCardImageSlider } from "@/components/ui/car-card/card-image-slider"
import { CarSpecsGrid } from "@/components/ui/car-card/card-specs"
import { emit } from "@/lib/events"
import ContactUsModal from "@/components/contact-us-modal"

export function DirectSaleCard({
    item,
    priority = false,
    linkPrefix = "/direct-sales"
}: {
    item: any
    priority?: boolean
    linkPrefix?: string
}) {
    const { t, language } = useTranslation()
    const {
        id,
        make,
        model,
        year,
        location,
        price,
        mileage,
        transmission,
        fuel_type,
        engine_size,
        doors,
        vehicle_condition,
        photos = [],
        user_id
    } = item

    const vehicleLabel = make ? `${make} ${model}` : (model ?? "vehicle")
    const isRTL = language === "ar"

    const normalizePhotoUrl = (p: any): { url: string; blurhash?: string | null } => {
        if (!p) return { url: "/placeholder.svg" }
        const s = typeof p === "string" ? p.trim() : (p.photo_url || p.url || "/placeholder.svg")
        let finalUrl = s
        // Normalize logic
        if (!s.startsWith("data:") && !s.startsWith("http://") && !s.startsWith("https://")) {
            if (s.startsWith("/api/uploads/")) finalUrl = s
            else if (s.startsWith("/uploads/")) finalUrl = `/api${s}`
            else finalUrl = `/api/uploads/vehicles/${s}`
        }

        return {
            url: finalUrl,
            blurhash: (typeof p === 'object' && p.blurhash) ? p.blurhash : null
        }
    }

    const normalizedPhotos = Array.isArray(photos) && photos.length > 0
        ? photos.map(normalizePhotoUrl)
        : [{ url: "/placeholder.svg" }]

    // Use Auth Context instead of fetching in each card
    const { currentUserId, isLoaded: authLoaded } = useAuth()

    // Watchlist State
    const [saved, setSaved] = useState(false)
    const [stableSaved, setStableSaved] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showContactModal, setShowContactModal] = useState(false)

    // Owner check - show buttons by default, hide only when CONFIRMED owner
    // This prevents delay for non-owners while still hiding for owners
    const confirmedOwner = !!(authLoaded && currentUserId && user_id && Number(currentUserId) === Number(user_id))

    // Bubble State
    const [bubbleOpen, setBubbleOpen] = useState(false)
    const [bubbleType, setBubbleType] = useState<"signin" | "confirm" | "success" | "error" | null>(null)
    const [bubbleText, setBubbleText] = useState<string | null>(null)
    const [confirmIsRemove, setConfirmIsRemove] = useState(false)

    const bubbleTimerRef = useRef<any>(null)
    const bubbleRef = useRef<HTMLDivElement>(null)
    const watchlistBtnRef = useRef<HTMLButtonElement>(null)
    const bubbleAutoHideMsRef = useRef<number>(4000)
    const bubbleStartTimeRef = useRef<number>(0)

    const cachedKey = id ? `watchlist_cached:direct:${id}` : null

    const showBubble = (type: typeof bubbleType, text?: string, autoHideMs?: number) => {
        setBubbleType(type)
        setBubbleText(text ?? null)
        setBubbleOpen(true)
        window.dispatchEvent(new CustomEvent("watchlist:bubble-opened", { detail: { id: `direct-${id}` } }))
        if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
        const ms = typeof autoHideMs === "number" ? autoHideMs : 4000
        bubbleAutoHideMsRef.current = ms
        bubbleStartTimeRef.current = Date.now()
        if (ms && ms > 0) {
            bubbleTimerRef.current = setTimeout(() => {
                setBubbleOpen(false)
                setBubbleType(null)
                setBubbleText(null)
                bubbleTimerRef.current = null
            }, ms)
        }
    }

    const pauseBubbleTimer = () => {
        if (bubbleTimerRef.current) {
            clearTimeout(bubbleTimerRef.current)
            bubbleTimerRef.current = null
            const elapsed = Date.now() - bubbleStartTimeRef.current
            bubbleAutoHideMsRef.current = Math.max(0, bubbleAutoHideMsRef.current - elapsed)
        }
    }

    const resumeBubbleTimer = () => {
        if (bubbleOpen) {
            bubbleStartTimeRef.current = Date.now()
            bubbleTimerRef.current = setTimeout(() => {
                setBubbleOpen(false)
                setBubbleType(null)
                setBubbleText(null)
                bubbleTimerRef.current = null
            }, 4000)
        }
    }

    const hideBubble = () => {
        if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
        bubbleTimerRef.current = null
        setBubbleOpen(false)
        setBubbleType(null)
        setBubbleText(null)
    }

    // Fetch watchlist state only when auth is loaded and user is authenticated
    useEffect(() => {
        if (!authLoaded) return

        const resolveWatchlist = async () => {
            try {
                // Try cached UI first for instant feedback
                if (cachedKey) {
                    const cv = localStorage.getItem(cachedKey)
                    if (cv === "1") {
                        setSaved(true)
                        setStableSaved(true)
                    }
                }

                if (currentUserId) {
                    // Only fetch watchlist if user is authenticated
                    const checkRes = await fetch(`/api/direct-sales-watchlist/check?direct_sale_id=${id}`)
                    const checkData = await checkRes.json()
                    const isSaved = !!checkData.saved
                    setSaved(isSaved)
                    setStableSaved(isSaved)
                    if (cachedKey) localStorage.setItem(cachedKey, isSaved ? "1" : "0")
                } else {
                    setSaved(false)
                    setStableSaved(false)
                    if (cachedKey) localStorage.setItem(cachedKey, "0")
                }
            } catch { }
        }
        resolveWatchlist()

        const onBubbleOpened = (e: Event) => {
            const detail = (e as CustomEvent).detail
            if (detail && detail.id !== `direct-${id}`) hideBubble()
        }
        const onWatchlistChanged = (e: Event) => {
            const d = (e as CustomEvent).detail
            if (d && d.direct_sale_id === id) {
                const isSaved = d.action === "add"
                setSaved(isSaved)
                setStableSaved(isSaved)
                if (cachedKey) localStorage.setItem(cachedKey, isSaved ? "1" : "0")
            }
        }

        window.addEventListener("watchlist:bubble-opened", onBubbleOpened)
        window.addEventListener("watchlist:changed", onWatchlistChanged)

        return () => {
            window.removeEventListener("watchlist:bubble-opened", onBubbleOpened)
            window.removeEventListener("watchlist:changed", onWatchlistChanged)
        }
    }, [id, cachedKey, authLoaded, currentUserId])

    useEffect(() => {
        if (!bubbleOpen) return
        const onDocClick = (e: MouseEvent) => {
            const t = e.target as Node
            if (bubbleRef.current?.contains(t) || watchlistBtnRef.current?.contains(t)) return
            hideBubble()
        }
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") hideBubble() }
        document.addEventListener("click", onDocClick)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("click", onDocClick)
            document.removeEventListener("keydown", onKey)
        }
    }, [bubbleOpen])

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (confirmedOwner) return
        if (saving) return

        if (!currentUserId) {
            showBubble("signin", t("watchlist.signin_required" as any), 5000)
            return
        }

        if (saved) {
            setConfirmIsRemove(true)
            showBubble("confirm", t("watchlist.remove_confirm" as any))
        } else {
            setConfirmIsRemove(false)
            showBubble("confirm", t("watchlist.add_confirm" as any))
        }
    }

    const confirmAdd = async () => {
        hideBubble()
        if (saving) return
        setSaving(true)

        // Optimistic
        setSaved(true)
        setStableSaved(true)
        if (cachedKey) localStorage.setItem(cachedKey, "1")

        try {
            const res = await fetch("/api/direct-sales-watchlist/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ direct_sale_id: id }),
            })

            if (!res.ok) {
                setSaved(false)
                setStableSaved(false)
                if (cachedKey) localStorage.setItem(cachedKey, "0")
                showBubble("signin", t("watchlist.signin_required" as any), 5000)
                return
            }

            emit("watchlist:changed", { direct_sale_id: id, userId: currentUserId, action: "add" })
            showBubble("success", t("watchlist.added_success" as any), 2000)
        } catch (error) {
            console.error("Error adding to watchlist:", error)
            setSaved(false)
            setStableSaved(false)
            if (cachedKey) localStorage.setItem(cachedKey, "0")
            showBubble("error", t("common.error"), 3000)
        } finally {
            setSaving(false)
        }
    }

    const confirmRemove = async () => {
        hideBubble()
        if (saving) return
        setSaving(true)

        // Optimistic
        setSaved(false)
        setStableSaved(false)
        if (cachedKey) localStorage.setItem(cachedKey, "0")

        try {
            const res = await fetch("/api/direct-sales-watchlist/remove", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ direct_sale_id: id }),
            })

            if (!res.ok) {
                setSaved(true)
                setStableSaved(true)
                if (cachedKey) localStorage.setItem(cachedKey, "1")
                showBubble("error", t("common.error"), 3000)
                return
            }

            emit("watchlist:changed", { direct_sale_id: id, userId: currentUserId, action: "remove" })
            showBubble("success", t("watchlist.removed_success" as any), 2000)
        } catch (error) {
            console.error("Error removing from watchlist:", error)
            setSaved(true)
            setStableSaved(true)
            if (cachedKey) localStorage.setItem(cachedKey, "1")
            showBubble("error", t("common.error"), 3000)
        } finally {
            setSaving(false)
        }
    }

    return (
        <article className="relative group bg-white rounded-3xl border border-gray-100 shadow-sm transition-all duration-500 flex flex-col h-full premium-card shine-sweep">
            {/* Contact Modal Overlay */}
            {showContactModal && (
                <div className="absolute inset-0 z-[100] bg-white rounded-3xl shadow-lg">
                    <ContactUsModal
                        open={showContactModal}
                        onClose={() => setShowContactModal(false)}
                        directSaleId={id}
                        listingTitle={`${make} ${model}`}
                        listingPrice={price}
                        inline={true}
                    />
                </div>
            )}

            <CarCardImageSlider
                photos={normalizedPhotos}
                href={`/${language}${linkPrefix}/${id}`}
                alt={vehicleLabel}
                priority={priority}
                overlay={
                    !confirmedOwner && <div className="flex flex-col items-end">
                        {bubbleOpen && (
                            <div
                                ref={bubbleRef}
                                className={`watchlist-msg watchlist-msg--${bubbleType ?? "signin"} mb-2`}
                                role="status"
                                aria-live="polite"
                                onMouseEnter={pauseBubbleTimer}
                                onMouseLeave={resumeBubbleTimer}
                            >
                                <div className="watchlist-msg-text">{bubbleText}</div>
                                {bubbleType === "signin" && (
                                    <div className="watchlist-msg-actions">
                                        <Link href={`/${language}/auth/login`} className="watchlist-msg-link">{t("nav.signin" as any)}</Link>
                                    </div>
                                )}
                                {bubbleType === "confirm" && (
                                    <div className="watchlist-msg-actions">
                                        <button
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); confirmIsRemove ? confirmRemove() : confirmAdd(); }}
                                            className="watchlist-msg-btn watchlist-msg-btn--confirm"
                                        >
                                            {confirmIsRemove ? t("common.remove") : t("common.add")}
                                        </button>
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); hideBubble(); }} className="watchlist-msg-btn">{t("common.cancel")}</button>
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            ref={watchlistBtnRef}
                            onClick={handleToggleFavorite}
                            className={`watchlist-btn ${stableSaved ? "watchlist-btn--saved" : ""}`}
                            aria-label={stableSaved ? "Remove from watchlist" : "Add to watchlist"}
                        >
                            <span className="heart-icon-wrap">
                                <Heart className={`heart-icon heart-icon-outline ${stableSaved ? "opacity-0" : "opacity-100"}`} size={16} />
                                <Heart className={`heart-icon heart-icon-filled ${stableSaved ? "opacity-100 animate-heart-pop" : "opacity-0"}`} size={16} fill="currentColor" />
                            </span>
                        </button>
                    </div>
                }
            />


            <div className="p-4 flex flex-col flex-1 flex">
                <Link href={`/${language}${linkPrefix}/${id}`} className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                        {make && (
                            <span className="text-[10px] font-medium font-serif text-white bg-[#B8071C] px-3 py-1 rounded-full shadow-sm uppercase">
                                {make}
                            </span>
                        )}
                        <span className="text-[10px] font-bold font-serif text-[#B8071C] bg-[#B8071C]/10 px-2 py-0.5 rounded">
                            {year}
                        </span>
                    </div>

                    <h3 className="text-xl font-bold font-serif text-[#103090] line-clamp-1 group-hover:text-[#B8071C] transition-colors mb-1">
                        {model || vehicleLabel}
                    </h3>

                    <div className="mb-3 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#B8071C]" />
                        <span className="text-sm font-medium font-serif text-gray-500">{t(`location.city.${(location || "").toLowerCase().replace(/\s+/g, '')}` as any) || location || t("common.unknown_location")}</span>
                    </div>

                    <div className="mb-4">
                        <div className="text-2xl font-bold font-serif text-[#B8071C]">
                            {new Intl.NumberFormat(language === "ar" ? "ar-MA" : "fr-MA", {
                                style: "decimal",
                                maximumFractionDigits: 0
                            }).format(Number(price)) + " " + t('common.mad')}
                        </div>
                    </div>

                    <div className="border-t border-[#DEB735]/25 mb-4" />

                    <CarSpecsGrid
                        specs={[
                            { iconUrl: "/icons/mileage.png", label: t("unit.km"), value: mileage },
                            { iconUrl: "/icons/transmission.png", label: "", value: transmission ? t(`vehicle.transmission.${transmission.toLowerCase()}` as any) : undefined },
                            { iconUrl: (fuel_type || "").toLowerCase() === "electric" ? "/icons/electric-fuel.png" : "/icons/fuel.png", label: "", value: fuel_type ? t(`vehicle.fuel.${fuel_type.toLowerCase()}` as any) : undefined },
                            { iconUrl: "/icons/car-door.png", label: t("vehicle.doors"), value: doors ?? undefined },
                            {
                                iconUrl: "/icons/condition.png",
                                label: "",
                                value: vehicle_condition ? t(`vehicle.condition.${vehicle_condition.toLowerCase()}` as any) : undefined,
                                variant: (vehicle_condition || "").toLowerCase().includes("excellent") ? "green" : "default"
                            },
                            { iconUrl: "/icons/engine.png", label: t("unit.liter"), value: engine_size ?? undefined }
                        ]}
                    />
                </Link>

                <div className="mt-4 space-y-2">
                    <Link
                        href={`/${language}${linkPrefix}/${id}`}
                        className="w-full bg-[#B8071C] hover:bg-[#910515] hover:border hover:border-[#DEB735] text-white font-medium font-serif py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md group-hover:shadow-lg active:scale-[0.98] whitespace-nowrap uppercase text-sm"
                    >
                        {t("common.view")}
                    </Link>
                    {!confirmedOwner && (
                        <button
                            onClick={() => setShowContactModal(true)}
                            className="w-full bg-[#B8071C] hover:bg-[#910515] hover:border hover:border-[#DEB735] text-white font-medium font-serif py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md group-hover:shadow-lg active:scale-[0.98] whitespace-nowrap uppercase text-sm"
                        >
                            {t("common.contact_us")}
                        </button>
                    )}
                </div>
            </div>
        </article>
    )
}
