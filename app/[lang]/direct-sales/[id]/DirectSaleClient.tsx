"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Phone } from "lucide-react"
import { DirectSaleCard } from "@/components/direct-sale-card"
import UnifiedCarLayout, { CarData, SellerData } from "@/components/unified-car-layout"
import ContactUsModal from "@/components/contact-us-modal"
import { useTranslation } from "@/lib/i18n-context"
import { normalizePhotoUrl } from "@/lib/image-utils"


export default function DirectSaleClient({ id, initialVehicle, language: langParam }: { id: string, initialVehicle: any, language: string }) {
    const { t, language } = useTranslation()
    const [vehicle, setVehicle] = useState<any>(initialVehicle)
    const [loading, setLoading] = useState(!initialVehicle)
    const [showContactModal, setShowContactModal] = useState(false)

    const vehicleId = id
    const cachedKey = vehicleId ? `watchlist_cached:${String(vehicleId)}` : null
    const [saved, setSaved] = useState<boolean>(false)

    useEffect(() => {
        try {
            if (cachedKey) {
                const cv = localStorage.getItem(cachedKey)
                if (cv === "1") setSaved(true)
            }
        } catch { }
    }, [cachedKey])

    const [stableSaved, setStableSaved] = useState<boolean>(saved)
    const [saving, setSaving] = useState<boolean>(false)
    const [currentUserId, setCurrentUserId] = useState<number | null>(null)
    const [transitionsDisabled, setTransitionsDisabled] = useState<boolean>(true)
    const lastSavedToggleRef = (globalThis as any).__lastSavedToggleRefForDetail ??= { value: 0 }

    const safeSetSaved = (val: boolean) => {
        try {
            const now = Date.now()
            if (now - lastSavedToggleRef.value < 250) return
            lastSavedToggleRef.value = now
            setSaved(val)
        } catch { try { setSaved(val) } catch { } }
    }

    useEffect(() => {
        let idt: any = null
        try { idt = setTimeout(() => setStableSaved(saved), 200) } catch { }
        return () => { try { if (idt) clearTimeout(idt) } catch { } }
    }, [saved])

    const [bubbleOpen, setBubbleOpen] = useState<boolean>(false)
    const [bubbleType, setBubbleType] = useState<"signin" | "confirm" | "success" | "error" | null>(null)
    const [bubbleText, setBubbleText] = useState<string | null>(null)
    const [confirmIsRemove, setConfirmIsRemove] = useState<boolean>(false)
    let bubbleTimer: any = null
    const bubbleRef = useRef<HTMLDivElement | null>(null)
    const watchlistBtnRef = useRef<HTMLButtonElement | null>(null)

    const showBubble = (type: typeof bubbleType, text?: string, autoHideMs?: number) => {
        setBubbleType(type)
        setBubbleText(text ?? null)
        setBubbleOpen(true)
        if (bubbleTimer) clearTimeout(bubbleTimer)
        const ms = typeof autoHideMs === "number" ? autoHideMs : (type === "signin" ? 5000 : undefined)
        if (ms && ms > 0) {
            bubbleTimer = setTimeout(() => { setBubbleOpen(false); setBubbleType(null); setBubbleText(null) }, ms)
        }
    }

    const hideBubble = () => {
        if (bubbleTimer) clearTimeout(bubbleTimer)
        setBubbleOpen(false)
        setBubbleType(null)
        setBubbleText(null)
    }

    useEffect(() => {
        if (!bubbleOpen) return
        function onDocClick(e: MouseEvent) {
            try {
                const target = e.target as Node | null
                if (!target) return
                if (bubbleRef.current && bubbleRef.current.contains(target)) return
                if (watchlistBtnRef.current && watchlistBtnRef.current.contains(target)) return
                hideBubble()
            } catch { }
        }
        function onKey(e: KeyboardEvent) {
            try { if (e.key === "Escape") hideBubble() } catch { }
        }
        document.addEventListener("click", onDocClick)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("click", onDocClick)
            document.removeEventListener("keydown", onKey)
        }
    }, [bubbleOpen])

    const isClientAuthenticated = (): boolean => {
        try {
            if (typeof window === "undefined") return false
            if (localStorage.getItem("auth:disabled") === "1" || Boolean((window as any).__preventAuthSync)) return false
            const token = localStorage.getItem("auth_token") ?? localStorage.getItem("auth:token")
            if (token) return true
            const ck = document.cookie || ""
            if (ck.includes("auth_token=") || ck.includes("auth:token=") || ck.includes("karkey_auth")) return true
        } catch { }
        return false
    }

    useEffect(() => {
        if (!vehicleId) return
        let mounted = true
            ; (async () => {
                try {
                    try {
                        if (cachedKey) {
                            const cv = localStorage.getItem(cachedKey)
                            if (cv === "1" || cv === "0") safeSetSaved(cv === "1")
                        }
                    } catch { }

                    const r = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" }).catch(() => null)
                    if (!mounted) return
                    if (!r || !r.ok) { setCurrentUserId(null); return }
                    const j = await r.json().catch(() => ({}))
                    const uid = (j?.user?.id ?? j?.user?.userId ?? j?.userId) ?? null
                    if (uid && Number(uid) > 0) {
                        setCurrentUserId(Number(uid))
                        try {
                            const check = await fetch(`/api/direct-sales-watchlist/check?direct_sale_id=${encodeURIComponent(String(vehicleId))}`, {
                                credentials: "include",
                                cache: "no-store"
                            })
                            if (check.ok) {
                                const cj = await check.json().catch(() => null)
                                if (cj && typeof cj.saved === "boolean") {
                                    safeSetSaved(Boolean(cj.saved))
                                    try { if (cachedKey) localStorage.setItem(cachedKey, cj.saved ? "1" : "0") } catch { }
                                }
                            }
                        } catch { }
                    } else {
                        setCurrentUserId(null)
                    }
                } catch { }
                try { setTransitionsDisabled(false) } catch { }
            })()
        return () => { mounted = false }
    }, [vehicleId])

    useEffect(() => {
        function onWatchlistChanged(e: Event) {
            try {
                const d = (e as CustomEvent)?.detail
                if (!d) return
                const payloadVehicleId = String(d.direct_sale_id ?? d.directSaleId ?? "")
                const payloadUserId = d.userId ?? null
                if (String(vehicleId) !== payloadVehicleId) return
                if (payloadUserId && currentUserId && Number(payloadUserId) !== Number(currentUserId)) return
                if (d.action === "add") {
                    safeSetSaved(true)
                    try { if (cachedKey) localStorage.setItem(cachedKey, "1") } catch { }
                } else if (d.action === "remove") {
                    safeSetSaved(false)
                    try { if (cachedKey) localStorage.setItem(cachedKey, "0") } catch { }
                }
            } catch { }
        }
        function onStorage(e: StorageEvent) {
            try {
                const key = e.key ?? ""
                if (cachedKey && key === cachedKey) { safeSetSaved(e.newValue === "1"); return }
                if (!key.startsWith("watchlist:")) return
                const parts = key.split(":")
                const storedUserId = parts[1] ? Number(parts[1]) : null
                const storedVehicleId = parts[2] ? String(parts[2]) : null
                if (!storedVehicleId || String(vehicleId) !== storedVehicleId) return
                if (storedUserId && currentUserId && Number(storedUserId) !== Number(currentUserId)) return
                const isSaved = e.newValue === "1"
                safeSetSaved(Boolean(isSaved))
                try { if (cachedKey) localStorage.setItem(cachedKey, isSaved ? "1" : "0") } catch { }
            } catch { }
        }
        window.addEventListener("watchlist:changed", onWatchlistChanged)
        window.addEventListener("storage", onStorage)
        return () => {
            window.removeEventListener("watchlist:changed", onWatchlistChanged)
            window.removeEventListener("storage", onStorage)
        }
    }, [vehicleId, currentUserId])

    const handleAddToWatchlist = async (e?: any) => {
        if (e) e.stopPropagation()
        if (!vehicleId) return
        if (saving) return
        if (saved) {
            setConfirmIsRemove(true)
            showBubble("confirm", t("watchlist.remove_confirm"))
            return
        }
        if (!currentUserId && !isClientAuthenticated()) {
            showBubble("signin", t("watchlist.signin_required"))
            return
        }
        setConfirmIsRemove(false)
        showBubble("confirm", t("watchlist.add_confirm"))
    }

    const confirmAdd = async () => {
        hideBubble()
        if (!vehicleId || saving) return
        setSaving(true)
        try {
            const res = await fetch("/api/direct-sales-watchlist/add", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ direct_sale_id: Number(vehicleId) })
            })
            if (res.status === 401) {
                showBubble("signin", t("watchlist.signin_required"))
                setSaving(false)
                return
            }
            const json = await res.json().catch(() => ({}))
            if (res.ok && (json.success || json.alreadyExists)) {
                safeSetSaved(true)
                showBubble("success", t("watchlist.success_add").replace("{model}", `${vehicle.make} ${vehicle.model}`), 1600)
            } else {
                showBubble("error", json.error ?? "Failed", 3000)
            }
        } catch (err) {
            showBubble("error", "Network error", 3000)
        } finally {
            setSaving(false)
        }
    }

    const confirmRemove = async () => {
        hideBubble()
        if (!vehicleId || saving) return
        setSaving(true)
        try {
            const res = await fetch("/api/direct-sales-watchlist/remove", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ direct_sale_id: Number(vehicleId) })
            })
            if (res.ok) {
                safeSetSaved(false)
                showBubble("success", t("watchlist.success_remove").replace("{model}", `${vehicle.make} ${vehicle.model}`), 1400)
            } else {
                showBubble("error", "Failed", 2600)
            }
        } catch (err) {
            showBubble("error", "Network error", 2600)
        } finally {
            setSaving(false)
        }
    }

    const cancelAdd = () => hideBubble()

    useEffect(() => {
        if (!id || initialVehicle) return
        const ac = new AbortController()
        setLoading(true)
            ; (async () => {
                try {
                    const res = await fetch(`/api/direct-sales/${id}`, { signal: ac.signal, cache: "no-store", credentials: "include" })
                    if (!res.ok) throw new Error("not-ok")
                    const data = await res.json().catch(() => null)
                    if (!data || !data.success || !data.direct_sale) throw new Error("no-data")
                    setVehicle({ ...data.direct_sale, seller: data.seller })
                } catch {
                    setVehicle(null)
                } finally {
                    if (!ac.signal.aborted) setLoading(false)
                }
            })()
        return () => ac.abort()
    }, [id, initialVehicle])

    const [allVehicles, setAllVehicles] = useState<any[]>([])
    useEffect(() => {
        if (!vehicle) return
        fetch("/api/direct-sales/approved", { cache: "no-store" })
            .then(r => r.json())
            .then(d => { if (Array.isArray(d?.vehicles)) setAllVehicles(d.vehicles) })
            .catch(() => { })
    }, [vehicle])

    const suggestions = (() => {
        if (!vehicle || !Array.isArray(allVehicles)) return []
        const normalize = (v: any) => String(v ?? "").trim().toLowerCase()
        const currentMake = normalize(vehicle.make ?? "")
        const currentModel = normalize(vehicle.model ?? "")
        const filtered = allVehicles.filter((v: any) => String(v.id) !== String(id))
        const sameMakeModel = filtered.filter((v: any) => normalize(v.make) === currentMake && normalize(v.model) === currentModel)
        if (sameMakeModel.length) return sameMakeModel.slice(0, 8)
        return filtered.filter((v: any) => normalize(v.make) === currentMake).slice(0, 8)
    })()

    const handleContactUs = () => setShowContactModal(true)

    if (loading) {
        return (
            <UnifiedCarLayout
                car={null as any}
                isLoading={true}
            />
        )
    }
    if (!vehicle) return <div className="p-20 text-center">Vehicle Not Found</div>

    const photos = (vehicle.photos ?? (vehicle.image ? [vehicle.image] : ["/placeholder.svg"])).map((url: string, i: number) => ({ id: i, url: normalizePhotoUrl(url) }))
    const seller = vehicle.seller ?? vehicle.owner ?? vehicle.user ?? {}
    const sellerData: SellerData = {
        name: seller?.name ?? "Seller",
        avatar: seller?.profile_picture ?? seller?.avatar ?? "/placeholder.svg",
        id: seller?.id
    }
    const carData: CarData = {
        id: vehicle.id, make: vehicle.make ?? "—", model: vehicle.model ?? "Vehicle", year: vehicle.year ?? "—",
        price: vehicle.price, mileage: vehicle.mileage ?? "—", transmission: vehicle.transmission ?? "—",
        fuel_type: vehicle.fuel_type ?? "—", condition: vehicle.vehicle_condition ?? "—", location: vehicle.location ?? "—",
        description: vehicle.description ?? "No description available.", photos,
        engine_size: vehicle.engine_size,
        doors: vehicle.doors,
        exterior_color: vehicle.exterior_color,
        interior_color: vehicle.interior_color,
        is_original_paint: vehicle.is_original_paint,
        special_features: vehicle.special_features
    }

    const isOwner = Boolean(currentUserId && vehicle?.user_id && Number(currentUserId) === Number(vehicle.user_id))

    const actionsContent = isOwner ? (
        <div className="w-full space-y-3">
            <div className="p-5 bg-gray-50 rounded-2xl text-center border border-gray-200">
                <p className="text-gray-900 font-medium mb-1 font-serif text-lg">{t("listings.your_listing")}</p>
                <Link href={`/${language}/profile?tab=listings`} className="inline-flex items-center justify-center w-full px-4 py-3 bg-white border border-gray-200 shadow-sm text-gray-700 font-bold rounded-xl hover:bg-gray-50">
                    {t("nav.my_listings")}
                </Link>
            </div>
        </div>
    ) : (
        <div className="space-y-3 relative">
            <div className="relative w-full">
                {bubbleOpen && (
                    <div ref={bubbleRef} className="absolute bottom-full left-0 right-0 mb-2 p-4 bg-white shadow-xl rounded-xl border border-gray-100 z-50 text-center">
                        <p className="text-base font-medium mb-3 text-gray-700">{bubbleText}</p>
                        {bubbleType === "signin" && <Link href={`/${language}/auth/login`} className="bg-[#B8071C] text-white px-4 py-2 rounded-lg">{t("auth.login.submit")}</Link>}
                        {bubbleType === "confirm" && (
                            <div className="flex gap-2 justify-center mt-2">
                                <button onClick={confirmIsRemove ? confirmRemove : confirmAdd} className="bg-[#B8071C] text-white px-4 py-2 rounded-lg">{confirmIsRemove ? t("common.remove") : t("common.add")}</button>
                                <button onClick={cancelAdd} className="bg-gray-100 px-4 py-2 rounded-lg">{t("common.cancel")}</button>
                            </div>
                        )}
                    </div>
                )}
                <Button onClick={handleAddToWatchlist} className={`w-full rounded-full font-medium py-4 text-base ${stableSaved ? "bg-emerald-600 text-white" : "bg-white border-2 border-emerald-600 text-emerald-600"}`}>
                    {stableSaved ? t("watchlist.saved") : t("watchlist.add")}
                </Button>
            </div>
            <Button className="w-full bg-[#B8071C] hover:bg-[#910515] text-white rounded-full font-medium py-4" onClick={handleContactUs}>
                <Phone className="w-5 h-5 mr-2" />
                {t("common.contact_us")}
            </Button>
        </div>
    )

    return (
        <>
            <UnifiedCarLayout car={carData} seller={sellerData} action={actionsContent} extraContent={
                suggestions.length > 0 ? (
                    <>
                        <h2 className="text-2xl font-bold text-[#103090] font-serif mb-6">{t("listings.similar_vehicles" as any)}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {suggestions.map((s: any) => <DirectSaleCard key={s.id} item={s} linkPrefix="/direct-sales" />)}
                        </div>
                    </>
                ) : null
            }>
                <script type="application/ld+json" dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org", "@type": "Car", "name": `${carData.make} ${carData.model}`,
                        "image": carData.photos[0]?.url, "description": carData.description, "brand": { "@type": "Brand", "name": carData.make },
                        "model": carData.model, "productionDate": carData.year, "offers": { "@type": "Offer", "price": carData.price, "priceCurrency": "MAD", "availability": "https://schema.org/InStock" }
                    })
                }} />
            </UnifiedCarLayout>
            <ContactUsModal open={showContactModal} onClose={() => setShowContactModal(false)} directSaleId={Number(id)} listingTitle={`${carData.make} ${carData.model}`} listingPrice={carData.price} />
        </>
    )
}
