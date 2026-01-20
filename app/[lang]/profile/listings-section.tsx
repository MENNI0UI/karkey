"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n-context";

type Listing = {
  id: number;
  title: string;
  description?: string;
  starting_price: number | null;
  current_price?: number | null;
  image_url?: string;
  status: string;
  end_date?: string;
  type?: "auction" | "direct_sale";
  created_at?: string;
};

type Props = {
  auctions: Listing[] | undefined;
  mode?: "listings" | "watchlist"; // render behavior for watchlist vs my listings
  initialSubTab?: "all" | "auction" | "direct_sale";
};

import { useState, useMemo, useEffect } from "react";

export default function ListingsSection({ auctions, mode = "listings", initialSubTab = "all" }: Props) {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<"all" | "auction" | "direct_sale">(initialSubTab);

  // Sync state if prop changes (e.g. from nav redirect)
  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  const filteredList = useMemo(() => {
    if (!auctions) return [];
    if (activeSubTab === "all") return auctions;
    return auctions.filter(item => item.type === activeSubTab);
  }, [auctions, activeSubTab]);

  if (auctions === undefined) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-gray-100 h-36 border border-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  const list = filteredList;

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase().trim();
    switch (s) {
      case "active":
      case "available":
        return { label: t("profile.status.active"), className: "bg-emerald-100 text-emerald-800" };
      case "completed":
      case "ended":
      case "sold":
        return { label: t("profile.status.ended"), className: "bg-gray-100 text-gray-800" };
      case "approved":
        return { label: t("profile.status.approved"), className: "bg-emerald-100 text-emerald-800" };
      case "cancelled":
      case "rejected":
        return { label: t("profile.status.cancelled"), className: "bg-red-100 text-red-800" };
      case "pending":
      default:
        return { label: t("profile.status.pending"), className: "bg-yellow-100 text-yellow-800" };
    }
  };

  if (auctions.length === 0) {
    if (mode === "watchlist") {
      return (
        <div className="p-10 text-center border border-[#d1f2e1] bg-gradient-to-br from-[#f2faf5] via-[#ffffff] to-[#f2faf5] rounded-2xl shadow-lg max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-[#008E46] mb-3 font-serif">{t("nav.my_favorites")}</h3>
          <p className="text-gray-600 mb-6 font-serif text-lg">{t("profile.no_watchlist_desc")}</p>
          <Link
            href="/auctions"
            className="inline-flex items-center justify-center rounded-full bg-[#B8071C] px-8 py-3 text-white font-medium shadow-lg hover:bg-[#910515] transition font-serif hover:scale-105"
          >
            {t("profile.browse_auctions")}
          </Link>
        </div>
      );
    }
    return (
      <div className="p-10 text-center border border-[#d1f2e1] bg-gradient-to-br from-[#f2faf5] via-[#ffffff] to-[#f2faf5] rounded-2xl shadow-lg max-w-2xl mx-auto">
        <h3 className="text-2xl font-bold text-[#008E46] mb-3 font-serif">{t("profile.no_listings")}</h3>
        <p className="text-gray-600 mb-6 font-serif text-lg">{t("profile.no_listings_desc")}</p>
        <Link
          href="/sell"
          className="inline-flex items-center justify-center rounded-full bg-[#B8071C] px-8 py-3 text-white font-medium shadow-lg hover:bg-[#910515] transition font-serif hover:scale-105"
        >
          {t("profile.create_first_listing")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {auctions.length > 0 && (
        <div className="sticky top-0 z-20 py-4 mb-6 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {(["all", "auction", "direct_sale"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-serif transition-all duration-300 flex items-center gap-2 ${activeSubTab === tab
                  ? "bg-[#008E46] text-white font-bold shadow-md transform scale-105"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 font-medium hover:text-[#008E46]"
                  }`}
              >
                {/* Optional Dots/Icons */}
                {tab === "auction" && <span className={`w-1.5 h-1.5 rounded-full ${activeSubTab === tab ? "bg-white" : "bg-[#008E46]"}`} />}
                {tab === "direct_sale" && <span className={`w-1.5 h-1.5 rounded-full ${activeSubTab === tab ? "bg-white" : "bg-[#B8071C]"}`} />}

                {tab === "all" ? t("filters.all") :
                  tab === "auction" ? t("sell_guide.auction.subtitle") :
                    t("sell_guide.direct_sale.subtitle")}
              </button>
            ))}
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500 italic">{t("auctions.no_results")}</p>
        </div>
      ) : (
        <>
          {/* Large screens: horizontal cards */}
          <div className="hidden lg:block space-y-6">
            {list.map((item) => {
              const badge = getStatusBadge(item.status);
              const link = item.type === "direct_sale"
                ? `/direct-sales/${item.id}`
                : `/auctions/${item.id}`;

              return (
                <article
                  key={`${item.type}-${item.id}`}
                  className="group flex gap-6 items-stretch rounded-3xl bg-white/80 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden font-serif hover:-translate-y-1"
                >
                  {/* Image with overlay gradient */}
                  <div className="w-56 h-44 relative flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
                    {item.image_url ? (
                      <>
                        <Image src={item.image_url} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <span className="text-sm">{t("profile.no_image")}</span>
                      </div>
                    )}
                    {/* Type badge on image */}
                    <span className={`absolute top-3 left-3 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider text-white shadow-lg ${item.type === "direct_sale" ? "bg-[#B8071C]" : "bg-[#008E46]"}`}>
                      {item.type === "direct_sale" ? t("sell_guide.direct_sale.subtitle") : t("sell_guide.auction.subtitle")}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 py-5 pr-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold font-serif text-2xl text-[#008E46] line-clamp-1 group-hover:text-[#B8071C] transition-colors">{item.title}</h3>
                        <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${badge.className}`}>{badge.label}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-auto border-t border-slate-100">
                      <div className="text-xl font-bold font-serif text-[#B8071C]">
                        {item.starting_price
                          ? new Intl.NumberFormat("fr-MA", {
                            style: "currency",
                            currency: "MAD",
                            maximumFractionDigits: 0,
                          }).format(item.starting_price)
                          : "—"}
                      </div>
                      <div className="flex items-center gap-4">
                        {item.end_date && (
                          <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                            {t("profile.ends")}: {new Date(item.end_date).toLocaleDateString()}
                          </span>
                        )}
                        <Link href={link} className="inline-flex items-center justify-center bg-[#008E46] text-white rounded-full px-6 py-2 text-sm font-bold font-serif hover:bg-[#B8071C] transition-all transform hover:scale-105 active:scale-95 shadow-md">
                          {t("profile.view")} →
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Small screens: grid cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:hidden">
            {list.map((item) => {
              const badge = getStatusBadge(item.status);
              const link = item.type === "direct_sale"
                ? `/direct-sales/${item.id}`
                : `/auctions/${item.id}`;

              return (
                <article
                  key={`${item.type}-${item.id}`}
                  className="group relative rounded-3xl bg-white/90 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] transition-all duration-300 active:scale-[0.98] font-serif"
                >
                  {/* Image Container */}
                  <div className="h-52 w-full relative bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
                    {item.image_url ? (
                      <>
                        <Image src={item.image_url} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-300">{t("profile.no_image")}</div>
                    )}
                    {/* Type badge on image */}
                    <span className={`absolute top-3 left-3 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider text-white shadow-lg ${item.type === "direct_sale" ? "bg-[#B8071C]" : "bg-[#008E46]"}`}>
                      {item.type === "direct_sale" ? t("sell_guide.direct_sale.subtitle") : t("sell_guide.auction.subtitle")}
                    </span>
                    {/* Status badge on image */}
                    <span className={`absolute top-3 right-3 text-[9px] px-2 py-1 rounded-full font-bold ${badge.className}`}>{badge.label}</span>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold font-serif text-[#008E46] text-lg line-clamp-1 mb-3">{item.title}</h3>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="text-lg font-bold font-serif text-[#B8071C]">
                        {item.starting_price
                          ? new Intl.NumberFormat("fr-MA", {
                            style: "currency",
                            currency: "MAD",
                            maximumFractionDigits: 0,
                          }).format(item.starting_price)
                          : "—"}
                      </div>
                      <Link href={link} className="text-sm font-bold font-serif text-[#008E46] hover:text-[#B8071C] transition-colors flex items-center gap-1">
                        {t("profile.view")} <span>→</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
