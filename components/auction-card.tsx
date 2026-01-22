"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import BoxedCountdown from "@/components/boxed-countdown";
import { useTranslation } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { MapPin, Heart, ChevronLeft, ChevronRight, Zap, Fuel, Car } from "lucide-react";
import { CarCardImageSlider } from "@/components/ui/car-card/card-image-slider";
import { CarSpecsGrid } from "@/components/ui/car-card/card-specs";
import { on, emit } from "@/lib/events";

function AuctionCard({ data, priority = false, initialIsWatched }: { data: any, priority?: boolean, initialIsWatched?: boolean }) {
  const { t, language } = useTranslation();
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
    if (s.startsWith("data:") || s.startsWith("http://") || s.startsWith("https://")) return s;
    if (s.startsWith("/api/uploads/")) return s;
    if (s.startsWith("/uploads/")) return `/api${s}`;
    if (s.includes("uploads/vehicles")) return s.startsWith("/") ? `/api${s}` : `/api/${s}`;
    return `/api/uploads/vehicles/${s}`;
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
  // show only first name (prefer explicit first_name, then split full name / username)
  const sellerName =
    (seller as any)?.first_name
      ? String((seller as any).first_name).trim()
      : (seller as any)?.name
        ? String((seller as any).name).trim().split(/\s+/)[0]
        : (seller as any)?.username
          ? String((seller as any).username).trim().split(/\s+/)[0]
          : "Unknown";
  const sellerAvatar = seller?.avatar ?? "/placeholder.svg";

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
  // watchlist state + handler
  const [saved, setSaved] = useState<boolean>(initialSaved);
  // stableSaved lags slightly to avoid rapid class toggles that cause blink.
  const [stableSaved, setStableSaved] = useState<boolean>(initialSaved);
  // guard rapid toggles to avoid visual blinking (leading-edge debounce)
  const lastSavedToggleRef = React.useRef<number>(0);
  const safeSetSaved = (val: boolean) => {
    try {
      const now = Date.now();
      // if a recent toggle happened, ignore subsequent flips within the window
      if (now - lastSavedToggleRef.current < 250) return;
      lastSavedToggleRef.current = now;
      // apply change immediately (leading-edge) to avoid delayed visual updates
      setSaved(val);
    } catch {
      try { setSaved(val); } catch { }
    }
  };
  // keep a stable visual saved state that only updates after a short debounce
  React.useEffect(() => {
    let id: any = null;
    try {
      // short delay to avoid flicker from rapid successive updates
      id = setTimeout(() => { try { setStableSaved(saved); } catch { } }, 200);
    } catch { }
    return () => { try { if (id) clearTimeout(id); } catch { } };
  }, [saved]);
  const [saving, setSaving] = useState<boolean>(false);
  // Use Auth Context instead of fetching in each card
  const { currentUserId, isLoaded: authLoaded } = useAuth();
  // Owner check - show buttons by default, hide only when CONFIRMED owner
  // This prevents delay for non-owners while still hiding for owners
  const confirmedOwner = !!(authLoaded && currentUserId && ownerUserId && Number(currentUserId) === Number(ownerUserId));
  // Deprecated: old isAuctionOwner logic removed to prevent confusion
  // disable visual transitions during initial hydration to avoid a blink
  const [transitionsDisabled, setTransitionsDisabled] = useState<boolean>(true);
  // localStorage key helper for persistence across re-renders / navigation
  const watchlistKey = auctionId ? `watchlist:${String(auctionId)}` : null;
  // cached UI key for instant feedback across navigations (per-browser)
  const cachedKey = auctionId ? `watchlist_cached:${String(auctionId)}` : null;

  // Fetch watchlist state when auth is loaded and user is authenticated
  useEffect(() => {
    if (!authLoaded) return;
    let mounted = true;

    const resolveWatchlist = async () => {
      // show instant cached saved state (if present) to avoid flicker when coming back to page
      try {
        if (cachedKey) {
          const cv = localStorage.getItem(cachedKey)
          if (mounted && (cv === "1" || cv === "0")) {
            safeSetSaved(cv === "1")
          }
        }
      } catch { }

      try {
        if (currentUserId) {
          // Only fetch watchlist if user is authenticated
          const check = await fetch(`/api/direct-sales-watchlist/check?direct_sale_id=${encodeURIComponent(String(auctionId))}`, {
            credentials: "include",
            cache: "no-store",
          });
          if (check.ok) {
            const cj = await check.json().catch(() => null);
            if (cj && cj.saved) {
              safeSetSaved(true);
              try { if (cachedKey) localStorage.setItem(cachedKey, "1"); } catch { }
            } else {
              try { if (cachedKey) localStorage.setItem(cachedKey, "0"); } catch { }
            }
          }
        } else {
          safeSetSaved(false);
          try { if (cachedKey) localStorage.setItem(cachedKey, "0"); } catch { }
        }
      } catch { }
      // allow transitions after the initial resolution
      try { setTransitionsDisabled(false); } catch { }
    };

    void resolveWatchlist();

    // Fallback: ensure transitions are re-enabled after a short delay
    let fallbackTimeout: any = null;
    try {
      fallbackTimeout = setTimeout(() => { try { setTransitionsDisabled(false); } catch { } }, 700);
    } catch { }

    // Listen for storage changes (cross-tab)
    function onStorage(e: StorageEvent) {
      try {
        if (e.key === "auth_token" && e.newValue === null) {
          safeSetSaved(false);
        }
        if (e.key && e.key.startsWith("watchlist:")) {
          const parts = e.key.split(":");
          if (parts.length >= 3) {
            const storedUser = Number(parts[1]);
            const storedAuction = parts[2];
            if (currentUserId && Number(storedUser) === Number(currentUserId) && String(storedAuction) === String(auctionId)) {
              safeSetSaved(e.newValue === "1");
            }
          }
        }
      } catch { }
    }

    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      try { if (fallbackTimeout) clearTimeout(fallbackTimeout); } catch { }
      window.removeEventListener("storage", onStorage as EventListener);
    };
  }, [authLoaded, currentUserId, auctionId, cachedKey]);

  // On mount / when auctionId or currentUserId changes: restore state only when we can scope by user,
  // otherwise rely on server check (which is user-specific via credentials).
  useEffect(() => {
    // keep existing behavior but guard: only restore from per-user localStorage when we have a confirmed currentUserId
    if (!auctionId) return;
    let mounted = true;
    (async () => {
      try {
        if (currentUserId == null) {
          // not authenticated: ensure saved is false
          if (mounted) {
            // but try cached UI first for instant feedback
            try {
              const cv = cachedKey ? localStorage.getItem(cachedKey) : null
              if (cv === "1") safeSetSaved(true)
              else safeSetSaved(false)
            } catch { setSaved(false) }
          }
          return;
        }

        // 1) try local per-user cache for instant feedback
        try {
          const key = `watchlist:${String(currentUserId)}:${String(auctionId)}`;
          const v = localStorage.getItem(key);
          if (mounted && (v === "1" || v === "0")) {
            safeSetSaved(v === "1");
            // we still continue to verify with server to get canonical value, but instant UI is set
          }
        } catch { }

        try {
          const res = await fetch(`/api/direct-sales-watchlist/check?direct_sale_id=${encodeURIComponent(String(auctionId))}`, {
            credentials: "include",
            cache: "no-store",
          });
          if (!mounted) return;
          if (res.ok) {
            const json = await res.json().catch(() => null);
            if (json && typeof json.saved === "boolean") {
              safeSetSaved(Boolean(json.saved));
              // update cached UI to keep immediate state next time
              try { if (cachedKey) localStorage.setItem(cachedKey, json.saved ? "1" : "0"); } catch { }
            }
          }
        } catch {
          // ignore network errors; keep current saved state
        }
      } catch { }
    })();
    return () => { mounted = false };
  }, [auctionId, currentUserId]);

  // update saved state if prop changes (for home page live hearts)
  useEffect(() => {
    // prefer cached UI value (fast restore) when present, otherwise fall back to initialSaved
    try {
      if (cachedKey) {
        const cv = localStorage.getItem(cachedKey)
        if (cv === "1" || cv === "0") {
          safeSetSaved(cv === "1")
          return
        }
      }
    } catch { /* ignore */ }
    safeSetSaved(initialSaved)
  }, [initialSaved, cachedKey])

  // inline bubble state (small message above heart)
  const [bubbleOpen, setBubbleOpen] = useState<boolean>(false);
  const [bubbleType, setBubbleType] = useState<"signin" | "confirm" | "success" | "error" | null>(null);
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [confirmIsRemove, setConfirmIsRemove] = useState<boolean>(false);
  const bubbleTimerRef = useRef<any>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const watchlistBtnRef = useRef<HTMLButtonElement | null>(null);
  const bubbleAutoHideMsRef = useRef<number>(4000);
  const bubbleStartTimeRef = useRef<number>(0);

  const showBubble = (type: typeof bubbleType, text?: string, autoHideMs?: number) => {
    setBubbleType(type);
    setBubbleText(text ?? null);
    setBubbleOpen(true);
    // Synchronize: close other bubbles
    window.dispatchEvent(new CustomEvent("watchlist:bubble-opened", { detail: { id: auctionId } }))
    try { if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current); } catch { }
    const ms = typeof autoHideMs === "number" ? autoHideMs : 4000;
    bubbleAutoHideMsRef.current = ms;
    bubbleStartTimeRef.current = Date.now();
    if (ms && ms > 0) {
      bubbleTimerRef.current = setTimeout(() => {
        setBubbleOpen(false);
        setBubbleType(null);
        setBubbleText(null);
        bubbleTimerRef.current = null;
      }, ms);
    }
  };

  const pauseBubbleTimer = () => {
    if (bubbleTimerRef.current) {
      clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = null;
      const elapsed = Date.now() - bubbleStartTimeRef.current;
      bubbleAutoHideMsRef.current = Math.max(0, bubbleAutoHideMsRef.current - elapsed);
    }
  };

  const resumeBubbleTimer = () => {
    if (bubbleOpen) {
      bubbleStartTimeRef.current = Date.now();
      bubbleTimerRef.current = setTimeout(() => {
        setBubbleOpen(false);
        setBubbleType(null);
        setBubbleText(null);
        bubbleTimerRef.current = null;
      }, 4000);
    }
  };

  const hideBubble = () => {
    try { if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current); } catch { }
    bubbleTimerRef.current = null;
    setBubbleOpen(false);
    setBubbleType(null);
    setBubbleText(null);
  };

  // close bubble when clicking outside or pressing Escape
  useEffect(() => {
    const onBubbleOpened = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.id !== auctionId) {
        hideBubble();
      }
    };
    window.addEventListener("watchlist:bubble-opened", onBubbleOpened);

    if (!bubbleOpen) return () => window.removeEventListener("watchlist:bubble-opened", onBubbleOpened);

    function onDocClick(e: MouseEvent) {
      try {
        const t = e.target as Node | null;
        if (!t) return;
        if (bubbleRef.current && bubbleRef.current.contains(t)) return;
        if (watchlistBtnRef.current && watchlistBtnRef.current.contains(t)) return;
        hideBubble();
      } catch { }
    }
    function onKey(e: KeyboardEvent) {
      try { if (e.key === "Escape") hideBubble(); } catch { }
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("watchlist:bubble-opened", onBubbleOpened);
    };
  }, [bubbleOpen, auctionId]);

  // بسيطة: تحقق ما إذا كان المستخدم لديه أثر للمصادقة على العميل
  const isClientAuthenticated = (): boolean => {
    try {
      if (typeof window === "undefined") return false;
      // honor explicit disable flag or global short-circuit
      if (localStorage.getItem("auth:disabled") === "1" || Boolean((window as any).__preventAuthSync)) return false;
      // check local tokens first (fast-path)
      const token = localStorage.getItem("auth_token") ?? localStorage.getItem("auth:token");
      if (token) return true;
      const ck = document.cookie || "";
      if (ck.includes("auth_token=") || ck.includes("auth:token=") || ck.includes("karkey_auth")) return true;
    } catch {
      /* ignore */
    }
    return false;
  };

  const handleAddToWatchlist = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    console.debug("[watchlist] handleAddToWatchlist clicked for auctionId:", auctionId);
    if (!auctionId) {
      alert("Invalid auction");
      return;
    }
    if (saving) return;

    // If owner clicks, block and show a message
    if (ownerUserId && currentUserId && Number(ownerUserId) === Number(currentUserId)) {
      showBubble("error", t("watchlist.own_listing"));
      return;
    }

    // If already saved, show a remove confirmation instead of the add flow
    if (saved) {
      setConfirmIsRemove(true);
      showBubble("confirm", t("watchlist.remove_confirm"));
      return;
    }

    // unauthenticated -> show small bubble with sign-in action
    // Use server-resolved currentUserId (from /api/auth/me) as the primary auth check
    // because NextAuth uses HTTP-only session cookies that localStorage checks can't detect
    if (!currentUserId) {
      // Fallback: also try local token check for legacy/hybrid auth flows
      if (!isClientAuthenticated()) {
        showBubble("signin", t("watchlist.signin_required"));
        return;
      }
    }

    // authenticated -> show confirmation bubble (user must press "Add" to proceed)
    setConfirmIsRemove(false);
    showBubble("confirm", t("watchlist.add_confirm"));
    // IMPORTANT: do NOT send the POST here. confirmAdd() will perform the network request when the user clicks Add.
    return;
  };

  // Called from bubble "Add" button to actually perform the request (prevents duplicate UI code)
  const confirmAdd = async () => {
    hideBubble();
    // reuse handleAddToWatchlist flow but avoid repeating confirm logic: call API directly
    if (!auctionId || saving) return;
    setSaving(true);

    // OPTIMISTIC UI: Update immediately for instant feedback
    const previousSavedState = saved;
    safeSetSaved(true);
    try { if (cachedKey) localStorage.setItem(cachedKey, "1"); } catch { }

    try {
      // authoritative pre-check: ensure server session still valid (prevents races after logout)
      try {
        const chk = await fetch("/api/auth/check", { cache: "no-store" }).catch(() => null);
        const cj = chk ? await chk.json().catch(() => ({})) : {};
        if (!cj?.isAuthenticated) {
          // Rollback optimistic update
          safeSetSaved(previousSavedState);
          try { if (cachedKey) localStorage.setItem(cachedKey, previousSavedState ? "1" : "0"); } catch { }
          showBubble("signin", t("common.signin_to_save"));
          setSaving(false);
          return;
        }
      } catch {
        // continue to token fallback below
      }

      // prepare headers: include Authorization fallback for token-based flows + credentials for cookie-based flows
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const localToken = localStorage.getItem("auth_token") ?? localStorage.getItem("auth:token");
        // do not trust local token when auth sync explicitly disabled
        if (localToken && localStorage.getItem("auth:disabled") !== "1" && !(window as any).__preventAuthSync) {
          headers["Authorization"] = `Bearer ${localToken}`;
        }
      } catch { }

      const res = await fetch("/api/direct-sales-watchlist/add", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ direct_sale_id: Number(auctionId) }),
      });
      // handle unauthorized explicitly
      if (res.status === 401) {
        // server says the session/token is invalid -> prompt sign in
        showBubble("signin", t("watchlist.signin_required"));
        setSaving(false);
        // Rollback optimistic update on auth failure
        safeSetSaved(previousSavedState);
        try { if (cachedKey) localStorage.setItem(cachedKey, previousSavedState ? "1" : "0"); } catch { }
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (res.ok && (json.success || json.alreadyExists)) {
        // persist locally (scoped to current user) so UI remains saved for that user only
        try { if (currentUserId != null) localStorage.setItem(`watchlist:${currentUserId}:${String(auctionId)}`, "1"); } catch { }
        // Optimistic update already applied, just ensure consistency
        safeSetSaved(true);
        // ALSO persist cached UI key for instant restore across pages
        try { if (cachedKey) localStorage.setItem(cachedKey, "1"); } catch { }
        const msg = json.alreadyExists
          ? t("watchlist.success_add").replace("{model}", vehicleLabel)
          : t("watchlist.success_add").replace("{model}", vehicleLabel);
        showBubble("success", msg, 1600);

        // Notify header in this tab and other tabs to refresh unread count / notifications.
        try { emit("notifications:updated"); } catch { }
        try { localStorage.setItem("notifications:refresh", String(Date.now())); } catch { }
        // NEW: broadcast watchlist change so other components (including header/home cards) update immediately
        try { emit("watchlist:changed", { auctionId: Number(auctionId), userId: currentUserId, action: "add" }); } catch { }
        try { localStorage.setItem("watchlist:refresh", String(Date.now())); } catch { }
      } else {
        // Rollback optimistic update on API failure
        safeSetSaved(previousSavedState);
        // ensure any per-user cache is cleared on failure
        try { if (currentUserId != null) localStorage.removeItem(`watchlist:${currentUserId}:${String(auctionId)}`); } catch { }
        try { if (cachedKey) localStorage.setItem(cachedKey, "0"); } catch { }
        showBubble("error", json.error ?? t("watchlist.error"), 3000);
      }
    } catch (err) {
      console.error("[watchlist] confirmAdd error:", err);
      // Rollback optimistic update on error
      safeSetSaved(previousSavedState);
      try { if (currentUserId != null) localStorage.removeItem(`watchlist:${currentUserId}:${String(auctionId)}`); } catch { }
      try { if (cachedKey) localStorage.setItem(cachedKey, "0"); } catch { }
      showBubble("error", t("watchlist.error"), 3000);
    } finally {
      setSaving(false);
    }
  };
  const cancelAdd = () => hideBubble();

  // Called from bubble "Remove" button to actually perform the remove request
  const confirmRemove = async () => {
    hideBubble();
    if (!auctionId || saving) return;
    setSaving(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const localToken = localStorage.getItem("auth_token") ?? localStorage.getItem("auth:token");
        if (localToken && localStorage.getItem("auth:disabled") !== "1" && !(window as any).__preventAuthSync) {
          headers["Authorization"] = `Bearer ${localToken}`;
        }
      } catch { }

      const res = await fetch("/api/direct-sales-watchlist/remove", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ direct_sale_id: Number(auctionId) }),
      });
      if (res.status === 401) {
        showBubble("signin", t("watchlist.signin_required"));
        setSaving(false);
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (res.ok && (json.success || json.removed)) {
        try { if (currentUserId != null) localStorage.removeItem(`watchlist:${currentUserId}:${String(auctionId)}`); } catch { }
        safeSetSaved(false);
        try { if (cachedKey) localStorage.setItem(cachedKey, "0"); } catch { }
        showBubble("success", t("watchlist.success_remove").replace("{model}", vehicleLabel), 1400);
        try { emit("watchlist:changed", { auctionId: Number(auctionId), userId: currentUserId, action: "remove" }); } catch { }
        try { localStorage.setItem("watchlist:refresh", String(Date.now())); } catch { }
      } else {
        // If server returned an error message, show it. Otherwise, fallback to a local-remove
        // so the UI stays responsive when the API route is unavailable (e.g., during dev or transient errors).
        if (json && typeof json.error === "string" && json.error.length > 0) {
          showBubble("error", json.error, 2600);
        } else {
          console.warn("[watchlist] remove API returned non-ok response; falling back to local removal", res.status, json);
          // perform local removal so UI reflects user's action even if server couldn't be reached
          try { if (currentUserId != null) localStorage.removeItem(`watchlist:${currentUserId}:${String(auctionId)}`); } catch { }
          safeSetSaved(false);
          try { if (cachedKey) localStorage.setItem(cachedKey, "0"); } catch { }
          try { emit("watchlist:changed", { auctionId: Number(auctionId), userId: currentUserId, action: "remove" }); } catch { }
          try { localStorage.setItem("watchlist:refresh", String(Date.now())); } catch { }
          showBubble("success", t("watchlist.success_remove").replace("{model}", vehicleLabel), 2200);
        }
      }
    } catch (err) {
      console.error("[watchlist] confirmRemove error:", err);
      showBubble("error", t("watchlist.error"), 2600);
    } finally {
      setSaving(false);
    }
  };

  // Listen for cross-tab / in-page watchlist updates so home-page cards and other components reflect changes immediately
  useEffect(() => {
    function onWatchlistChanged(e: Event) {
      try {
        const d = (e as CustomEvent)?.detail
        if (!d) return
        const payloadAuctionId = String(d.auctionId ?? d.auction_id ?? "")
        const payloadUserId = d.userId ?? null
        // only react when it's about this auction and for the same user (or no user specified)
        if (String(auctionId) !== payloadAuctionId) return
        if (payloadUserId && currentUserId && Number(payloadUserId) !== Number(currentUserId)) return
        // support actions (add/remove)
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
        // react when per-user key changed for this auction
        const key = e.key ?? ""
        // if cachedKey changed elsewhere, use it immediately
        if (cachedKey && key === cachedKey) {
          safeSetSaved(e.newValue === "1")
          return
        }
        if (!key.startsWith("watchlist:")) return
        // key format: watchlist:{userId}:{auctionId}
        const parts = key.split(":")
        const storedUserId = parts[1] ? Number(parts[1]) : null
        const storedAuctionId = parts[2] ? String(parts[2]) : null
        if (!storedAuctionId || String(auctionId) !== storedAuctionId) return
        // only update if it belongs to our current user (or no user info)
        if (storedUserId && currentUserId && Number(storedUserId) !== Number(currentUserId)) return
        // if value removed/cleared -> not saved; otherwise saved
        const isSaved = e.newValue === "1"
        safeSetSaved(Boolean(isSaved))
        // mirror into cachedKey for fast restore
        try { if (cachedKey) localStorage.setItem(cachedKey, isSaved ? "1" : "0") } catch { }
      } catch { }
    }

    window.addEventListener("watchlist:changed", onWatchlistChanged)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("watchlist:changed", onWatchlistChanged)
      window.removeEventListener("storage", onStorage)
    }
  }, [auctionId, currentUserId])

  // no local image fade state (avoid opacity transitions causing flash)

  // router for client navigation control (used to guarantee scroll behavior)
  const router = useRouter();

  return (
    // promote card to its own layer and use transform-based hover to avoid layout reflow/jank
    <article
      className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-[#DEB735] group flex flex-col h-full auction-card font-serif premium-card shine-sweep"
      style={{
        willChange: "transform, opacity",
        transform: "translateZ(0)",
        contain: "layout paint",
        isolation: "isolate",
      }}
    >
      {/* Photo Section */}
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
            <div className="flex flex-col items-end gap-2">
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
                  {bubbleType === "signin" ? (
                    <div className="watchlist-msg-actions">
                      <a href={`/auth/login`} className="watchlist-msg-link" onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>{t("nav.signin")}</a>
                    </div>
                  ) : null}
                  {bubbleType === "confirm" ? (
                    <div className="watchlist-msg-actions">
                      <button onClick={(e) => { e.stopPropagation(); confirmIsRemove ? confirmRemove() : confirmAdd(); }} onTouchStart={(e) => e.stopPropagation()} className="watchlist-msg-btn watchlist-msg-btn--confirm">{confirmIsRemove ? t("common.remove") : t("common.add")}</button>
                      <button onClick={(e) => { e.stopPropagation(); cancelAdd(); }} onTouchStart={(e) => e.stopPropagation()} className="watchlist-msg-btn">{t("common.cancel")}</button>
                    </div>
                  ) : null}
                </div>
              )}
              <button
                ref={watchlistBtnRef}
                type="button"
                onClick={handleAddToWatchlist}
                onTouchStart={(e) => e.stopPropagation()}
                className={`watchlist-btn ${stableSaved ? "watchlist-btn--saved" : ""}`}
                style={{ position: 'relative', top: 'auto', right: 'auto' }}
                aria-label={stableSaved ? "Remove from watchlist" : "Add to watchlist"}
                title={stableSaved ? "Remove from watchlist" : "Add to watchlist"}
              >
                <span className="heart-icon-wrap" aria-hidden>
                  <Heart className={`heart-icon heart-icon-outline ${stableSaved ? "opacity-0" : "opacity-100"}`} size={16} />
                  <Heart className={`heart-icon heart-icon-filled ${stableSaved ? "opacity-100 animate-heart-pop" : "opacity-0"}`} size={16} fill="currentColor" />
                </span>
              </button>
            </div>
          )
        }
      />

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1 bg-white">
        <Link href={`/${language}/auctions/${auctionId}`} className="flex-1">
          {/* Year Badge */}
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-bold font-serif text-[#B8071C] bg-[#B8071C]/10 px-2 py-0.5 rounded">
              {year}
            </span>
          </div>

          {/* Title */}
          <div className="mb-1 flex flex-col items-start">
            <h3 className="text-xl font-bold font-serif text-[#103090] line-clamp-1 group-hover:text-[#B8071C] transition-colors">
              {model}
            </h3>
          </div>

          {/* Location */}
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#B8071C]" />
            <span className="text-sm font-medium font-serif text-gray-500">
              {location ?? t("common.unknown_location")}
            </span>
          </div>

          {/* Price Section */}
          <div className="mb-4">
            <div className="text-2xl font-bold font-serif text-[#B8071C]">
              {(() => {
                const candidates = [starting_price, (data as any)?.startingPrice, (data as any)?.price, (data as any)?.vehicle?.starting_price, (data as any)?.vehicle?.price, (data as any)?.auction?.starting_price, (data as any)?.auction?.current_bid, (data as any)?.current_bid]
                let num: number | null = null
                for (const c of candidates) {
                  if (c === undefined || c === null || c === "") continue
                  if (typeof c === "number") { num = c; break }
                  const parsed = Number(String(c).replace(/[^0-9.\-]/g, ""))
                  if (!Number.isNaN(parsed) && Number.isFinite(parsed)) { num = parsed; break }
                }
                if (num != null) return new Intl.NumberFormat(language === "ar" ? "ar-MA" : "fr-MA", { style: "decimal", maximumFractionDigits: 0 }).format(num) + " MAD"
                return String((data as any)?.displayPrice ?? (data as any)?.display_price ?? "—")
              })()}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#DEB735]/25 mb-4" />

          {/* Specs Grid */}
          <CarSpecsGrid
            specs={[
              { iconUrl: "/icons/mileage.png", label: "km", value: mileage ?? undefined },
              { iconUrl: "/icons/transmission.png", label: "", value: transmission ? t(`vehicle.transmission.${transmission.toLowerCase()}` as any) : undefined },
              {
                iconUrl: (fuel_type || "").toLowerCase().includes("electric") || (fuel_type || "").toLowerCase().includes("hybrid") ? undefined : (String(fuel_type ?? "").toLowerCase().includes("elect") ? "/icons/electric-fuel.png" : "/icons/fuel.png"),
                IconComponent: (fuel_type || "").toLowerCase().includes("electric") ? Zap : ((fuel_type || "").toLowerCase().includes("hybrid") ? Fuel : undefined),
                label: "",
                value: fuel_type ? t(`vehicle.fuel.${fuel_type.toLowerCase()}` as any) : undefined,
                variant: (fuel_type || "").toLowerCase().includes("electric") || (fuel_type || "").toLowerCase().includes("hybrid") ? "green" : "default"
              },
              {
                iconUrl: "/icons/condition.png",
                label: "",
                value: vehicle_condition ? t(`vehicle.condition.${vehicle_condition.toLowerCase()}` as any) : undefined,
                variant: (vehicle_condition || "").toLowerCase().includes("excellent") ? "green" : "default"
              },
              { iconUrl: "/icons/engine.png", label: t("unit.liter"), value: engine_size ?? undefined },
              { iconUrl: "/icons/car-door.png", label: t("vehicle.doors"), value: doors ?? undefined }
            ]}
          />
        </Link>

        {/* Auction Timer & Action Button */}
        <div className="mt-auto flex flex-col gap-4">
          <div className="flex flex-col gap-2 border-t border-[#DEB735]/25 pt-4 pb-1">
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
            className="w-full bg-[#B8071C] hover:bg-[#910515] hover:border hover:border-[#DEB735] text-white font-bold font-serif py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md group-hover:shadow-lg active:scale-[0.98] whitespace-nowrap uppercase text-base"
          >
            {t("auction.place_bid")}
          </button>
        </div>
      </div>
    </article>
  );

}

// Memoize AuctionCard to avoid re-rendering when props are stable.
// This reduces work when rendering many cards in lists/grids.
export default React.memo(AuctionCard)
