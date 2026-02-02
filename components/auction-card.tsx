"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BoxedCountdown from "@/components/boxed-countdown";
import { useTranslation } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { MapPin, Zap } from "lucide-react";
import { CarCardImageSlider } from "@/components/ui/car-card/card-image-slider";
import { CarSpecsGrid } from "@/components/ui/car-card/card-specs";
import { WatchlistButton } from "@/components/watchlist-button";


function AuctionCard({ data, priority = false, initialIsWatched, viewMode = 'grid' }: { data: any, priority?: boolean, initialIsWatched?: boolean, viewMode?: 'grid' | 'list' }) {
  const { t, language } = useTranslation();
  const isList = viewMode === 'list';
  const {
    id,
    photos = [],
    make,
    model,
    year,
    location,
    starting_price,
    mileage,
    transmission,
    fuel_type,
    engine_size,
    doors,
    vehicle_condition,
    seller = {},
    end_date,
    auction_end_date,
    user_id,
  } = data;

  // prefer auction id (route target) when available
  const auctionId = (data as any).auction_id ?? (data as any).auctionId ?? id;
  // Get owner user_id from various possible locations in data
  const ownerUserId = user_id ?? (data as any).vehicle_user_id ?? (seller as any)?.id ?? (seller as any)?.user_id ?? null;

  // helper: normalize photo URLs
  const normalizePhotoUrl = (p: string | null | undefined) => {
    if (!p) return "/placeholder.svg";
    const s = String(p).trim();
    if (s.startsWith("data:image/")) return s;
    if (s.startsWith("blob:")) return s;
    if (s.startsWith("http://") || s.startsWith("https://")) {
      try {
        const url = new URL(s);
        if (url.protocol === 'http:' || url.protocol === 'https:') return s;
      } catch { return "/placeholder.svg"; }
    }
    const filename = s.includes("/") ? (s.split("/").pop() || s) : s;
    return `https://img.karkey.space/vehicles/${filename}`;
  };

  // Support multiple photo array formats
  const rawPhotos: any[] = Array.isArray(photos) ? photos : [];
  const normalizedPhotos = rawPhotos && rawPhotos.length > 0
    ? rawPhotos.map((p: any) => {
      if (!p) return "/placeholder.svg";
      if (typeof p === "string") return normalizePhotoUrl(p);
      const candidate = p.photo_url ?? p.url ?? p.path ?? p.filename ?? p.file ?? p.image ?? null;
      return normalizePhotoUrl(candidate);
    })
    : ["/placeholder.svg"];

  // عرض مُنسق للسيارة لرسائل واجهة المستخدم (Make + Model أو fallback إلى Model/Vehicle)
  const vehicleLabel = make ? `${String(make)}${model ? " " + String(model) : ""}` : (model ?? "vehicle");

  // pick the canonical end time (ISO) if present
  const endIso =
    end_date ??
    auction_end_date ??
    (data && (data.end_date ?? data.auction_end_date ?? data.auction?.end_date)) ??
    (data as any)?._raw?.auction_end_date ??
    (data as any)?._raw?.end_date ??
    null;

  // allow parent to override saved state (for home page hearts)
  // Prefer server-provided initialIsWatched, then fallback to localStorage for fast UI restore
  const initialSaved = (() => {
    // Server-provided state takes priority (eliminates flicker)
    if (typeof initialIsWatched === "boolean") return initialIsWatched;
    try {
      if (typeof window !== "undefined" && auctionId) {
        const ck = `watchlist_cached:${String(auctionId)}`;
        const cv = localStorage.getItem(ck);
        if (cv === "1") return true;
        if (cv === "0") return false;
      }
    } catch { }
    return typeof data.saved === "boolean" ? data.saved : (typeof data.is_watched === "boolean" ? data.is_watched : false);
  })();

  const { currentUserId, isLoaded: authLoaded } = useAuth();
  // Owner check - show buttons by default, hide only when CONFIRMED owner
  const confirmedOwner = !!(authLoaded && currentUserId && ownerUserId && Number(currentUserId) === Number(ownerUserId));

  // router for client navigation control (used to guarantee scroll behavior)
  const router = useRouter();

  const formattedPrice = useMemo(() => {
    const candidates = [starting_price, (data as any)?.startingPrice, (data as any)?.price, (data as any)?.vehicle?.starting_price, (data as any)?.vehicle?.price, (data as any)?.auction?.starting_price, (data as any)?.auction?.current_bid, (data as any)?.current_bid]
    let num: number | null = null
    for (const c of candidates) {
      if (c === undefined || c === null || c === "") continue
      if (typeof c === "number") { num = c; break }
      const parsed = Number(String(c).replace(/[^0-9.\-]/g, ""))
      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) { num = parsed; break }
    }
    if (num != null) return new Intl.NumberFormat(language === "ar" ? "ar-MA" : "fr-MA", { style: "decimal", maximumFractionDigits: 0 }).format(num) + " " + t('common.mad')
    return String((data as any)?.displayPrice ?? (data as any)?.display_price ?? "—")
  }, [starting_price, data, language, t]);

  return (
    <article
      className={`bg-white rounded-3xl shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-[#DEB735]/40 group flex ${isList ? 'flex-col md:flex-row' : 'flex-col'} h-full auction-card font-serif premium-card ${isList ? 'shine-sweep-slow' : 'shine-sweep'} hover:scale-[1.015] hover:shadow-xl animate-fade-in-up`}
      style={{
        perspective: "1000px",
        willChange: "transform, opacity, box-shadow",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Photo Section */}
      <div className={`relative ${isList ? 'md:w-80 lg:w-96 w-full h-64 md:h-auto' : 'w-full'}`}>
        <CarCardImageSlider
          photos={normalizedPhotos}
          alt={`${make} ${model}`}
          href={`/${language}/auctions/${auctionId}`}
          showPhotoCount={false}
          priority={priority}
          badges={
            make && (
              <div className="bg-[#B8071C] text-white text-[10px] font-medium font-serif px-3 py-1 rounded-full shadow-sm uppercase">
                {make}
              </div>
            )
          }
          overlay={
            !confirmedOwner && (
              <WatchlistButton
                id={auctionId}
                initialSaved={initialSaved}
                ownerUserId={ownerUserId}
                vehicleLabel={vehicleLabel}
              />
            )
          }
        />
      </div>

      {/* Content Section */}
      <div className={`p-4 flex flex-col flex-1 bg-white ${isList ? 'md:p-8' : ''}`}>
        <div className="flex-1 flex flex-col h-full">
          <Link href={`/${language}/auctions/${auctionId}`} className="flex flex-col flex-1">
            <div className={`flex flex-wrap items-center justify-between gap-4 mb-4 ${!isList ? 'mb-2' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-serif text-[#B8071C] bg-[#B8071C]/10 px-2 py-0.5 rounded">
                  {year}
                </span>
              </div>
              <div className={`flex items-center gap-2 ${!isList ? 'hidden' : ''}`}>
                <MapPin className="w-5 h-5 text-[#B8071C]" />
                <span className="text-sm md:text-base font-medium font-serif text-gray-500">
                  {t(`location.city.${(location || "").toLowerCase().replace(/\s+/g, '')}` as any) || location || t("common.unknown_location")}
                </span>
              </div>
            </div>

            {!isList && (
              <>
                <h3 className="text-xl font-bold font-serif text-[#103090] line-clamp-2 group-hover:text-[#B8071C] transition-colors mb-2">
                  {model}
                </h3>
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#B8071C]" />
                  <span className="text-sm md:text-base font-medium font-serif text-gray-500">
                    {t(`location.city.${(location || "").toLowerCase().replace(/\s+/g, '')}` as any) || location || t("common.unknown_location")}
                  </span>
                </div>
                <div className="mt-auto mb-4">
                  <div className="text-2xl font-bold font-serif text-[#B8071C]">
                    {formattedPrice}
                  </div>
                </div>
              </>
            )}

            {isList && (
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b border-[#DEB735]/15 pb-6">
                <h3 className="text-3xl lg:text-4xl font-bold font-serif text-[#103090] line-clamp-2 group-hover:text-[#B8071C] transition-colors">
                  {model}
                </h3>
                <div className="text-3xl lg:text-4xl font-bold font-serif text-[#B8071C] whitespace-nowrap">
                  {formattedPrice}
                </div>
              </div>
            )}

            <div className="flex-1">
              {isList && (
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 font-serif">
                  {t("common.specifications" as any)}
                </h4>
              )}
              {!isList && <div className="border-t border-[#DEB735]/25 my-4" />}
              <CarSpecsGrid
                iconSize={isList ? 6 : 4}
                gridCols={isList ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2'}
                specs={[
                  { iconUrl: "/icons/mileage.png", label: t("unit.km"), value: mileage ?? undefined },
                  { iconUrl: "/icons/transmission.png", label: "", value: transmission ? t(`vehicle.transmission.${transmission.toLowerCase()}` as any) : undefined },
                  {
                    iconUrl: (fuel_type || "").toLowerCase().includes("electric") ? "/icons/electric-fuel.png" : "/icons/fuel.png",
                    label: "",
                    value: fuel_type ? t(`vehicle.fuel.${fuel_type.toLowerCase()}` as any) : undefined,
                  },
                  { iconUrl: "/icons/car-door.png", label: t("vehicle.doors"), value: doors ?? undefined },
                  {
                    iconUrl: "/icons/condition.png",
                    label: "",
                    value: vehicle_condition ? t(`vehicle.condition.${vehicle_condition.toLowerCase()}` as any) : undefined,
                  },
                  { iconUrl: "/icons/engine.png", label: t("unit.liter"), value: engine_size ?? undefined }
                ]}
              />
            </div>
          </Link>

          <div className={`mt-6 flex ${isList ? 'flex-row items-center' : 'flex-col'} gap-4`}>
            <div className={`flex flex-col gap-2 ${isList ? 'flex-1 border-s-4 border-[#B8071C] ps-4 py-1' : 'border-t border-[#DEB735]/25 pt-4 pb-1'}`}>
              <span className="text-[10px] text-gray-400 font-bold font-serif uppercase tracking-widest">{t("auction.ends_in")}</span>
              <BoxedCountdown endDate={endIso} size="sm" fullWidth={true} />
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (!auctionId) return;
                router.push(`/${language}/auctions/${String(auctionId)}`);
              }}
              className={`${isList ? 'px-12 h-[52px]' : 'w-full py-2.5'} bg-[#B8071C] hover:bg-[#910515] hover:border hover:border-[#DEB735] text-white font-bold font-serif rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] uppercase tracking-widest text-sm`}
            >
              <Zap className="w-5 h-5" strokeWidth={2.5} />
              {t("auction.place_bid")}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default React.memo(AuctionCard)
