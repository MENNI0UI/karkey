"use client"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n-context"
import KarkeyCarCard from "@/components/karkey-car-card"
import HomeCityCard from "@/components/home-city-card"
import { useParams } from "next/navigation"
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/ui/motion-wrappers"
import { CarGridSkeleton } from "@/components/ui/car-card-skeleton"
import { LuxuryLoader } from "@/components/ui/luxury-loader"

import logger from "@/lib/logger"
import dynamic from "next/dynamic"

const ParticlesCursor = dynamic(() => import("@/components/ui/particles-cursor"), {
	ssr: false,
})
// Dynamic import for CircularGalleryHtml
const CircularGalleryHtml = dynamic(() => import("@/components/ui/circular-gallery/CircularGalleryHtml"), {
	loading: () => <div className="h-[600px] flex items-center justify-center"><LuxuryLoader size="lg" /></div>
})

type Props = {
	initialKarkeyCars?: any[]
	initialCities?: any[]
}

export default function HomePageClient({
	initialKarkeyCars = [],
	initialCities = [],
}: Props) {
	const { t } = useTranslation()
	const { lang } = useParams()
	const language = String(lang || "en")

	// Local state
	const [karkeyItems, setKarkeyItems] = useState<any[]>(initialKarkeyCars || [])
	const [loading, setLoading] = useState(false)

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
					setKarkeyItems(data.vehicles);
				} else {
					setKarkeyItems([]);
				}
			} catch (err) {
				logger.error("[HomePageClient] search error:", err);
				setKarkeyItems([]);
			} finally {
				setLoading(false);
			}
		};

		// handler for direct results emitted by the SearchBar (fast path)
		const onSearchResults = (e: Event) => {
			try {
				const data = (e as CustomEvent)?.detail ?? null
				if (data?.success && Array.isArray(data.vehicles)) {
					setKarkeyItems(data.vehicles)
				} else if (data && data.success === false) {
					setKarkeyItems([])
				}
			} catch {
				// ignore
			}
		}

		const onReset = () => {
			// restore initial vehicles when reset is emitted
			setKarkeyItems(initialKarkeyCars || []);
		};

		window.addEventListener("karkey:search", onSearch as EventListener);
		window.addEventListener("karkey:search:results", onSearchResults as EventListener);
		window.addEventListener("karkey:search:reset", onReset);
		return () => {
			window.removeEventListener("karkey:search", onSearch as EventListener);
			window.removeEventListener("karkey:search:results", onSearchResults as EventListener);
			window.removeEventListener("karkey:search:reset", onReset);
		};
	}, [initialKarkeyCars])

	// Shared logic removed (moved to components)

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
		if (!userId || !Array.isArray(karkeyItems)) return;
		const map: Record<string, boolean> = {};
		karkeyItems.forEach((it) => {
			const auctionId = it.auction_id ?? it.auctionId ?? it.id;
			if (!auctionId) return;
			try {
				const v = localStorage.getItem(`watchlist:${userId}:${auctionId}`);
				map[String(auctionId)] = v === "1";
			} catch { }
		});
		setSavedMap(map);
	}, [userId, karkeyItems]);

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

	// Logic descent enabled: KarkeyCarCard manages its own state
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

			{/* Section 1: Karkey Cars (Circular Gallery) */}
			{karkeyItems.length > 0 && (
				<section className="w-full py-8 mt-4">
					<div className="max-w-[3000px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-20 2xl:px-32">
						<div className="flex items-center justify-between mb-4">
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
					</div>

					<div style={{ height: '750px', position: 'relative' }}>
						<CircularGalleryHtml
							items={karkeyItems.map((car: any, index: number) => {
								// Center cards (middle ±1) get priority loading
								const middleIndex = Math.floor(karkeyItems.length / 2);
								const isPriority = Math.abs(index - middleIndex) <= 2;
								return (
									<div key={car.id} className="w-[320px]" style={{ transform: 'scale(1)' }}>
										<KarkeyCarCard car={car} priority={isPriority} />
									</div>
								);
							})}
						/>
					</div>
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
						{initialCities.map((cityObj: any, idx: number) => (
							<StaggerItem key={cityObj.city}>
								<HomeCityCard
									city={cityObj.city}
									image={cityObj.image}
									language={language}
									priority={idx < 4}
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
