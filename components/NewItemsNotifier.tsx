"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  fetchUrl: string;
  initialTopId?: string | number | null;
  pollIntervalMs?: number;
  label?: string;
  isLoading?: boolean; // New prop to sync with parent loading state
};

export default function NewItemsNotifier({
  fetchUrl,
  initialTopId = null,
  pollIntervalMs = 30000,
  label = "Show new auctions",
  isLoading = false
}: Props) {
  const [hasNew, setHasNew] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If parent is loading, we silent everything and reset.
    if (isLoading) {
      setHasNew(false);
      return;
    }

    let mounted = true;
    let lastTop = initialTopId ?? null;
    let initialized = initialTopId != null;

    // We establish a baseline. 
    // Since we now use a key and isLoading prop, this baseline is much more reliable.
    const initialDelay = 3000; // Increased delay to ensure search effects have settled

    const check = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (!mounted) return;

      try {
        const res = await fetch(fetchUrl, { cache: "no-store" });
        if (!mounted) return;
        const data = await res.json();

        const tryExtractArray = (obj: any): any[] | null => {
          if (!obj) return null
          if (Array.isArray(obj)) return obj
          const keys = ["direct_sales", "results", "vehicles", "auctions", "items", "data"]
          for (const k of keys) {
            try { if (Array.isArray(obj[k])) return obj[k] } catch { }
          }
          return null
        }

        const arr = tryExtractArray(data)
        let latest: any = null
        if (arr && arr.length > 0) {
          const tsKeys = ["created_at", "createdAt", "created", "updated_at", "updatedAt", "ts", "timestamp"]
          let bestItem: any = arr[0]
          let bestTs: number | null = null
          for (const it of arr) {
            let foundTs: number | null = null
            for (const k of tsKeys) {
              try {
                const v = it?.[k]
                if (!v) continue
                const n = Number(new Date(String(v)).valueOf())
                if (!Number.isNaN(n) && Number.isFinite(n)) { foundTs = n; break }
              } catch { }
            }
            if (foundTs != null && (bestTs == null || foundTs > bestTs)) {
              bestTs = foundTs
              bestItem = it
            }
          }
          const first = bestItem ?? arr[0]
          latest = first?.id ?? first?.vehicle_id ?? first?.auction_id ?? null
        } else if (data?.id) {
          latest = data.id
        }

        if (!initialized) {
          initialized = true;
          if (latest != null) lastTop = latest;
          return;
        }

        if (latest == null || lastTop == null) {
          if (latest != null) lastTop = latest;
          return;
        }

        const latestVal = typeof latest === "number" ? latest : parseInt(String(latest), 10);
        const lastVal = typeof lastTop === "number" ? lastTop : parseInt(String(lastTop), 10);

        const isNumericallyNewer = !isNaN(latestVal) && !isNaN(lastVal) && latestVal > lastVal;
        const isStringDifferent = isNaN(latestVal) && String(latest) !== String(lastTop);

        if (isNumericallyNewer || isStringDifferent) {
          // Double check: if it's already in the search params or results, it's not "new"
          // This is a safety layer.
          lastTop = latest;
          setHasNew(true);
        }
      } catch (e) {
        // ignore
      }
    };

    const id = setInterval(check, pollIntervalMs);
    const initialTimer = setTimeout(() => {
      if (mounted) void check();
    }, initialDelay);

    return () => {
      mounted = false;
      clearInterval(id);
      clearTimeout(initialTimer);
    };
  }, [fetchUrl, initialTopId, pollIntervalMs, isLoading]);

  if (!hasNew || isLoading) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200000] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-2 bg-white border border-[#e6f4ff] shadow-xl rounded-full px-4 py-2 pr-2">
        <button
          onClick={() => {
            setHasNew(false);
            router.refresh();
          }}
          className="flex items-center gap-2 text-sm font-bold text-[#B1060F]"
        >
          <span className="flex h-2 w-2 rounded-full bg-[#B1060F] animate-pulse" />
          {label}
        </button>
        <div className="w-[1px] h-4 bg-gray-200 mx-1" />
        <button
          onClick={() => setHasNew(false)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}
