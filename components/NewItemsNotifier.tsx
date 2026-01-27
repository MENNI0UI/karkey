"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  fetchUrl: string;
  initialTopId?: string | number | null;
  pollIntervalMs?: number;
  label?: string;
};

export default function NewItemsNotifier({ fetchUrl, initialTopId = null, pollIntervalMs = 30000, label = "Show new auctions" }: Props) {
  const [hasNew, setHasNew] = useState(false);
  const [checking, setChecking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let lastTop = initialTopId ?? null;
    // If we have an initial ID, we are already "initialized" baseline-wise, 
    // but we still want to handle the first check carefully to avoid false positives if logic differs.
    // Actually, trusting initialTopId allows immediate updates on the very first fetch if freshness drift occurred.
    let initialized = initialTopId != null;

    const check = async () => {
      // Skip check if tab is not visible to save server resources
      if (typeof document !== "undefined" && document.hidden) return;

      try {
        setChecking(true);
        const res = await fetch(fetchUrl, { cache: "no-store" });
        if (!mounted) return;
        const data = await res.json();
        // defensively extract a top-level array from common API shapes
        const tryExtractArray = (obj: any): any[] | null => {
          if (!obj) return null
          if (Array.isArray(obj)) return obj
          const keys = ["direct_sales", "results", "vehicles", "auctions", "items", "data"]
          for (const k of keys) {
            try {
              if (Array.isArray(obj[k])) return obj[k]
            } catch { }
          }
          // sometimes payload is { success: true, direct_sales: [...] }
          for (const k of Object.keys(obj || {})) {
            try {
              if (Array.isArray((obj as any)[k])) return (obj as any)[k]
            } catch { }
          }
          return null
        }

        const arr = tryExtractArray(data)
        let latest: any = null
        if (arr && arr.length > 0) {
          // Prefer the item with the newest timestamp if available
          const tsKeys = ["created_at", "createdAt", "created", "updated_at", "updatedAt", "ts", "timestamp"]
          let bestItem: any = arr[0]
          let bestTs: number | null = null
          for (const it of arr) {
            // extract a numeric timestamp if possible
            let foundTs: number | null = null
            for (const k of tsKeys) {
              try {
                const v = it?.[k]
                if (!v) continue
                const n = Number(new Date(String(v)).valueOf())
                if (!Number.isNaN(n) && Number.isFinite(n)) { foundTs = n; break }
              } catch { }
            }
            if (foundTs != null) {
              if (bestTs == null || foundTs > bestTs) {
                bestTs = foundTs
                bestItem = it
              }
            }
          }
          const first = bestItem ?? arr[0]
          latest = first?.id ?? first?.vehicle_id ?? first?.auction_id ?? null
        } else if (data?.id) {
          latest = data.id
        }

        if (!initialized) {
          initialized = true;
          if (lastTop == null && latest != null) {
            lastTop = latest;
          }
          return;
        }

        if (latest == null) return;

        if (lastTop == null) {
          lastTop = latest;
          // No prompt on first initialization or if we just lost track
          return;
        }

        // Only trigger if IDs are numeric and the new one is higher, 
        // OR if they are strings and they definitely changed.
        // This reduces false positives from reordering/deletion.
        const latestVal = typeof latest === "number" ? latest : parseInt(String(latest), 10);
        const lastVal = typeof lastTop === "number" ? lastTop : parseInt(String(lastTop), 10);

        const isNumericallyNewer = !isNaN(latestVal) && !isNaN(lastVal) && latestVal > lastVal;
        const isStringDifferent = isNaN(latestVal) && String(latest) !== String(lastTop);

        if (isNumericallyNewer || isStringDifferent) {
          lastTop = latest;
          setHasNew(true);
        }
      } catch (e) {
        // ignore network errors
      } finally {
        if (mounted) setChecking(false);
      }
    };

    const id = setInterval(check, pollIntervalMs);
    // run initial check immediately to establish baseline quickly
    void check();

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [fetchUrl, initialTopId, pollIntervalMs]);

  if (!hasNew) return null;

  // Centered top notification - more professional and less overlapping
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
