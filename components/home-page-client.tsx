"use client"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n-context"
import KarkeyCarCard from "@/components/karkey-car-card"
import HomeCityCard from "@/components/home-city-card"
import { useParams } from "next/navigation"
import { StaggerContainer, StaggerItem, FadeIn, Reveal } from "@/components/ui/motion-wrappers"
import { CarGridSkeleton } from "@/components/ui/car-card-skeleton"
import { LuxuryLoader } from "@/components/ui/luxury-loader"
import dynamic from "next/dynamic"

const ParticlesCursor = dynamic(() => import("@/components/ui/particles-cursor"), {
	ssr: false,
})

function chooseFuelIcon(fuel: string | null | undefined) {
	const fk = String(fuel ?? "").toLowerCase()
	if (fk.includes("electric")) return "/icons/electric-fuel.png"
	return "/icons/fuel.png"
}

// helper: single-letter avatar when no image is available
function getInitial(name?: string | null) {
	try {
		const s = String(name ?? "").trim()
		if (!s) return "U"
		return s.charAt(0).toUpperCase()
	} catch {
		return "U"
	}
}

// add helper near the top (below getInitial)
function getFirstNameFrom(value?: any) {
	try {
		if (!value) return null
		const s = String(value).trim()
		if (!s) return null
		// prefer first_name-like values passed directly
		return s.split(/\s+/)[0]
	} catch {
		return null
	}
}

type Props = {
	initialVehicles?: any[]
	initialKarkeyCars?: any[]
	initialServerTime?: string | null
	initialCities?: any[]
}

export default function HomePageClient({
	initialVehicles = [],
	initialKarkeyCars = [],
	initialServerTime = null,
	initialCities = [],
}: Props) {
	const { t } = useTranslation()
	const { lang } = useParams()
	const language = String(lang || "en")

	// Local state
	// Auctions
	const [auctionItems, setAuctionItems] = useState<any[]>(initialVehicles || [])
	// Karkey Cars
	const [karkeyItems, setKarkeyItems] = useState<any[]>(initialKarkeyCars || [])

	const [loading, setLoading] = useState(false)

	// track currently displayed image index per vehicle (reactive so UI updates)
	const [imgIndexMap, setImgIndexMap] = useState<Record<string, number>>({})

	// init/reset indexes when items change
	React.useEffect(() => {
		// ensure items is an array before iterating (defensive)
		const list = Array.isArray(auctionItems) ? auctionItems : []
		const map: Record<string, number> = {}
		list.forEach((it: any) => {
			// prefer auction id (if present) as the unique key; fallback to vehicle id or a JSON key
			const rawKey = it?.auction_id ?? it?.auctionId ?? it?.id ?? JSON.stringify(it ?? {})
			const idKey = String(rawKey)
			map[idKey] = 0
		})
		setImgIndexMap(map)
	}, [auctionItems])

	// Listen for Search events emitted by SearchBar
	useEffect(() => {
		const onSearch = async (e: Event) => {
			try {
				const detail = (e as CustomEvent)?.detail ?? {};
				setLoading(true);
				const res = await fetch("/api/search", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(detail),
				});
				const data = await res.json().catch(() => null);
				if (data?.success && Array.isArray(data.vehicles)) {
					setAuctionItems(data.vehicles);
				} else {
					setAuctionItems([]);
				}
			} catch (err) {
				console.error("[HomePageClient] search error:", err);
				setAuctionItems([]);
			} finally {
				setLoading(false);
			}
		};

		// handler for direct results emitted by the SearchBar (fast path)
		const onSearchResults = (e: Event) => {
			try {
				const data = (e as CustomEvent)?.detail ?? null
				if (data?.success && Array.isArray(data.vehicles)) {
					setAuctionItems(data.vehicles)
				} else if (data && data.success === false) {
					setAuctionItems([])
				}
			} catch {
				// ignore
			}
		}

		const onReset = () => {
			// restore initial vehicles when reset is emitted
			setAuctionItems(initialVehicles || []);
		};

		window.addEventListener("karkey:search", onSearch as EventListener);
		window.addEventListener("karkey:search:results", onSearchResults as EventListener);
		window.addEventListener("karkey:search:reset", onReset);
		return () => {
			window.removeEventListener("karkey:search", onSearch as EventListener);
			window.removeEventListener("karkey:search:results", onSearchResults as EventListener);
			window.removeEventListener("karkey:search:reset", onReset);
		};
	}, [initialVehicles])

	// helper that returns index for a vehicle id
	const getIndex = (id: string | number) => {
		const key = String(id)
		return imgIndexMap[key] ?? 0
	}

	// add helper near component top
	const formatPrice = (p: any) => {
		// accept number or numeric string
		if (p === null || p === undefined || p === "") return null
		const n = Number(p)
		if (!Number.isFinite(n) || n <= 0) return null
		return new Intl.NumberFormat("en-US").format(n) + " MAD"
	}

	// advance to next image for a vehicle
	const nextImage = (id: string | number, photos: string[] = []) => {
		const key = String(id)
		const idx = getIndex(id)
		const next = photos.length ? (idx + 1) % photos.length : 0
		setImgIndexMap((prev) => ({ ...prev, [key]: next }))
	}
	const prevImage = (id: string | number, photos: string[] = []) => {
		const key = String(id)
		setImgIndexMap((prev) => {
			const cur = Number(prev[key] ?? 0)
			const len = (photos?.length) || 1
			const prevIdx = (cur - 1 + len) % Math.max(len, 1)
			return { ...prev, [key]: prevIdx }
		})
	}
	const setImageIndex = (id: string | number, idx: number) => {
		const key = String(id)
		setImgIndexMap((prev) => ({ ...prev, [key]: idx }))
	}

	// compute a conservative initial offset from server_time if provided
	const initialOffsetMs = typeof initialServerTime === "string" ? (Date.now() - Date.parse(initialServerTime)) : null
	// state holds the best offset measured (clientNow - serverNow)
	const [serverOffsetMs, setServerOffsetMs] = useState<number | null>(initialOffsetMs)

	// RTT-based sync effect (keeps setServerOffsetMs from earlier)
	useEffect(() => {
		let mounted = true
		let periodicId: ReturnType<typeof setInterval> | null = null

		const syncWithServer = async (attempts = 5, url = "/api/time") => {
			try {
				const samples: Array<{ rtt: number; offset: number }> = []
				for (let i = 0; i < attempts; i++) {
					const t0 = Date.now()
					const res = await fetch(url, { cache: "no-store" })
					const t1 = Date.now()
					if (!res.ok) continue
					const data = await res.json().catch(() => null)
					if (!data || !data.server_time) continue
					const serverTs = Date.parse(data.server_time)
					if (Number.isNaN(serverTs)) continue
					const rtt = t1 - t0
					const midClient = Math.round((t0 + t1) / 2)
					const offset = midClient - serverTs
					samples.push({ rtt, offset })
					// small delay between pings
					await new Promise((r) => setTimeout(r, 120))
				}
				if (!mounted || samples.length === 0) return
				samples.sort((a, b) => a.rtt - b.rtt)
				const best = samples[0]
				setServerOffsetMs((prev) => {
					if (prev == null) return best.offset
					const diff = Math.abs(best.offset - prev)
					if (diff > 3000) return best.offset
					return Math.round(prev * 0.7 + best.offset * 0.3)
				})
			} catch {
				// keep existing offset
			}
		}

		// initial sync
		void syncWithServer(5, "/api/time")

		// periodic resync every 10 minutes
		periodicId = setInterval(() => void syncWithServer(3, "/api/time"), 10 * 60 * 1000)

		// resync on visibility/focus
		const onVis = () => {
			if (document.visibilityState === "visible") void syncWithServer(3, "/api/time")
		}
		const onFocus = () => void syncWithServer(2, "/api/time")

		document.addEventListener("visibilitychange", onVis)
		window.addEventListener("focus", onFocus)

		return () => {
			mounted = false
			if (periodicId) clearInterval(periodicId)
			document.removeEventListener("visibilitychange", onVis)
			window.removeEventListener("focus", onFocus)
		}
	}, [])

	// DIAG: show serverOffsetMs at mount / when it changes
	useEffect(() => {

	}, [serverOffsetMs, initialServerTime])

	// NEW: userId state for watchlist hearts
	const [userId, setUserId] = useState<number | null>(null);
	useEffect(() => {
		let uid = null;
		try { uid = localStorage.getItem("auth_profile_userid"); } catch { }
		if (uid) { setUserId(Number(uid)); return; }
		// fallback: fetch from /api/auth/me if not present
		fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
			.then((res) => res.ok ? res.json() : null)
			.then((data) => {
				if (data?.user?.id) setUserId(Number(data.user.id));
			});
	}, []);

	// NEW: track saved state for each auction (watchlist heart)
	const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
	useEffect(() => {
		if (!userId || !Array.isArray(auctionItems)) return;
		const map: Record<string, boolean> = {};
		auctionItems.forEach((it) => {
			const auctionId = it.auction_id ?? it.auctionId ?? it.id;
			if (!auctionId) return;
			try {
				const v = localStorage.getItem(`watchlist:${userId}:${auctionId}`);
				map[String(auctionId)] = v === "1";
			} catch { }
		});
		setSavedMap(map);
	}, [userId, auctionItems]);

	// Listen for watchlist:changed and storage events to update hearts live
	useEffect(() => {
		function onWatchlistChanged(e: any) {
			const d = e.detail;
			if (!d || !userId) return;
			const auctionId = String(d.auctionId ?? d.auction_id ?? "");
			if (!auctionId) return;
			if (d.userId && Number(d.userId) !== Number(userId)) return;
			setSavedMap((prev) => ({ ...prev, [auctionId]: d.action === "add" }));
		}
		function onStorage(e: StorageEvent) {
			if (!userId || !e.key?.startsWith("watchlist:")) return;
			const parts = e.key.split(":");
			const storedUserId = parts[1] ? Number(parts[1]) : null;
			const storedAuctionId = parts[2] ? String(parts[2]) : null;
			if (!storedAuctionId || storedUserId !== userId) return;
			setSavedMap((prev) => ({ ...prev, [storedAuctionId]: e.newValue === "1" }));
		}
		window.addEventListener("watchlist:changed", onWatchlistChanged);
		window.addEventListener("storage", onStorage);
		return () => {
			window.removeEventListener("watchlist:changed", onWatchlistChanged);
			window.removeEventListener("storage", onStorage);
		};
	}, [userId]);

	// helper: normalize a variety of API item shapes into the shape expected by AuctionCard
	function normalize(item: any) {
		// be defensive: support multiple possible field names
		const id = item?.id ?? item?.auction_id ?? item?.vehicle_id ?? item?.vehicle?.id ?? null
		const photos = Array.isArray(item?.photos)
			? item.photos
			: Array.isArray(item?.images)
				? item.images
				: item?.image
					? [item.image]
					: item?.photos_urls
						? item.photos_urls
						: []

		const make = item?.make ?? item?.manufacturer ?? item?.brand ?? ""
		const model = item?.model ?? item?.title ?? ""
		const year = item?.year ?? item?.manufacture_year ?? null
		const location = item?.location ?? item?.city ?? "—"
		const mileage = item?.mileage ?? item?.mileage_km ?? "—"
		const transmission = item?.transmission ?? item?.trans ?? "—"
		const fuel_type = item?.fuel_type ?? item?.fuelType ?? item?.fuel ?? "—"
		const vehicle_condition = item?.vehicle_condition ?? item?.condition ?? null
		const engine_size = item?.engine_size ?? item?.engineSize ?? item?.engine ?? null
		const doors = item?.doors ?? item?.num_doors ?? item?.number_of_doors ?? null
		const starting_price = item?.starting_price ?? item?.startingPrice ?? item?.price ?? null

		return {
			id,
			auction_id: item?.auction_id ?? null,
			auction_start_date: item?.auction_start_date ?? item?.auction?.start_date ?? null,
			auction_end_date: item?.auction_end_date ?? item?.auction?.end_date ?? null,
			photos,
			image: photos.length ? photos[0] : null,
			make,
			model,
			year,
			location,
			mileage,
			transmission,
			fuel_type,
			vehicle_condition,
			engine_size,
			doors,
			starting_price,
			displayPrice: item?.displayPrice ?? (starting_price != null ? String(starting_price) : null),
			// keep original payload for any future needs
			_raw: item,
		}
	}
	if (loading) {
		return (
			<div className="text-center py-20 flex flex-col items-center justify-center gap-6">
				<LuxuryLoader size="lg" />
				<div className="max-w-[3000px] w-full mx-auto px-8 sm:px-12 lg:px-24">
					<CarGridSkeleton count={8} />
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-transparent">
			<ParticlesCursor />
			{/* Section 1: Auctions (Moved to top as per requirement to have Karkey Cars as "last cards"?) 
			    Wait, user said "make them 5 cards in the line (last cards)". "Last cards" implies this section is AFTER the other section.
			    Currently Auctions is Section 2 in previous code.
			    I Will Make Auctions Section 1. 
			    And Karkey Cars Section 2 (Last).
			*/}

			{/* Section 1: Karkey Cars (First as requested) */}
			{karkeyItems.length > 0 && (
				<section className="max-w-[3000px] mx-auto px-1 sm:px-2 lg:px-2 xl:px-20 2xl:px-32 py-8 mt-4">
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-3xl md:text-4xl font-serif font-bold text-[#103090] tracking-tight">
							<span className="bg-gradient-to-br from-[#00A651] to-[#004D25] bg-clip-text text-transparent">
								{t("karkey_cars.title") || "Karkey Cars"}
							</span>
						</h2>
						<Link href={`/${language}/karkey-cars`} className="group flex items-center gap-1 text-sm font-semibold text-[#B8071C] hover:text-[#D32F2F] transition-colors">
							{t("common.see_all") || "See all"}
							<span className="block transition-transform group-hover:translate-x-1">→</span>
						</Link>
					</div>

					{/* 4 to 5 Cards per row */}
					<StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
						{karkeyItems.map((car: any, idx: number) => (
							<StaggerItem key={car.id} skipAnimation={idx < 4}>
								<KarkeyCarCard car={car} priority={idx < 4} />
							</StaggerItem>
						))}
					</StaggerContainer>
				</section>
			)}

			{/* Section 2: Browse by Cities */}
			{initialCities?.length > 0 && (
				<section className="max-w-[3000px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-20 3xl:px-24 tv:px-32 py-12">
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-3xl md:text-4xl font-bold text-[#103090] font-serif tracking-tight">
							<span className="bg-gradient-to-br from-[#103090] to-[#0D47A1] bg-clip-text text-transparent">
								{t("home.browse_by_cities") || "Browse by Cities"}
							</span>
						</h2>
					</div>

					{/* 4x2 Premium Grid with Staggered Scroll Reveal */}
					<StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
						{initialCities.map((cityObj: any) => (
							<StaggerItem key={cityObj.city}>
								<HomeCityCard
									city={cityObj.city}
									image={cityObj.image}
									language={language}
								/>
							</StaggerItem>
						))}
					</StaggerContainer>
				</section>
			)}

			{!loading && karkeyItems.length === 0 && (
				<FadeIn className="text-center py-20 text-[#103090] font-serif font-bold text-lg">
					{t("common.no_results") || "No vehicles found"}
				</FadeIn>
			)}
		</div>
	)
}
