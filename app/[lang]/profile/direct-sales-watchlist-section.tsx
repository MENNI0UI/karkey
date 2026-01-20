"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DirectSaleCard } from "@/components/direct-sale-card";
import { Heart } from "lucide-react";
import { useTranslation } from "@/lib/i18n-context";

type DirectSaleItem = {
  id: number;
  user_id: number;
  make: string;
  model: string;
  year: number | null;
  mileage_km: number | null;
  fuel_type: string | null;
  engine_size: string | null;
  doors: number | null;
  transmission: string | null;
  vehicle_condition: string | null;
  location: string | null;
  price: number | null;
  description: string | null;
  status: string;
  photos: string[];
  created_at: string | null;
};

interface DirectSalesWatchlistSectionProps {
  initialItems?: DirectSaleItem[];
}

export default function DirectSalesWatchlistSection({ initialItems }: DirectSalesWatchlistSectionProps) {
  const [items, setItems] = useState<DirectSaleItem[]>(initialItems || []);
  // If initialItems is provided (even if empty array), we consider it fetched.
  const [fetched, setFetched] = useState<boolean>(typeof initialItems !== "undefined");
  const { t } = useTranslation();

  useEffect(() => {
    // If we have initial items from server (even empty), use them and mark fetched
    if (typeof initialItems !== "undefined") {
      setItems(initialItems);
      setFetched(true);
      return;
    }

    // Otherwise fetch from client
    async function fetchWatchlist() {
      try {
        const res = await fetch("/api/direct-sales-watchlist/mine", {
          credentials: "include",
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.items || data.watchlist || []);
          setItems(list);
        }
      } catch (err) {
        console.error("Failed to fetch direct sales watchlist:", err);
      } finally {
        setFetched(true);
      }
    }

    fetchWatchlist();
  }, [initialItems]);

  // Listen for removal events to update the list in real-time
  useEffect(() => {
    const handleRemove = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.directSaleId) {
        setItems((prev) => prev.filter((item) => item.id !== Number(detail.directSaleId)));
      }
    };

    window.addEventListener("direct-sales-watchlist:removed", handleRemove);
    return () => window.removeEventListener("direct-sales-watchlist:removed", handleRemove);
  }, []);

  if (!fetched) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl bg-gray-100 h-[320px]" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 rounded-full bg-[#f0f4ff] flex items-center justify-center mb-4">
          <Heart className="w-10 h-10 text-[#B8071C]" />
        </div>
        <h3 className="text-xl font-bold font-serif text-[#008E46] mb-2">{t("profile.no_saved_items")}</h3>
        <p className="text-[#717171] text-center max-w-md mb-6">
          {t("profile.no_saved_items_desc")}
        </p>
        <Link
          href="/direct-sales"
          className="inline-flex items-center px-6 py-2.5 bg-[#B8071C] text-white rounded-lg hover:bg-[#910515] transition font-medium"
        >
          {t("profile.browse_direct_sales")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <DirectSaleCard
          key={item.id}
          item={item}
          linkPrefix="/direct-sales"
        />
      ))}
    </div>
  );
}
