"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n-context";
import { useRouter, usePathname } from "next/navigation";
import {
    HeaderUserSnapshot,
    NOTIF_CACHE_KEY, NOTIF_CACHE_TS_KEY,
    UNREAD_CACHE_KEY, NOTIF_CACHE_TTL_MS,
    USER_CACHE_KEY, USER_CACHE_TTL_MS
} from "./types";
import {
    readCachedUserSnapshot,
    writeCachedUserSnapshot,
    clearCachedUserSnapshot,
    isSyncDisabled,
    getStoredProfilePic,
    getStoredProfileInitial,
    sanitizeUserSnapshot
} from "./utils";
import { on } from "@/lib/events";
import { performGlobalLogout } from "@/lib/auth-client";

export function useHeaderLogic() {
    const { user: authUser, logout } = useAuth();
    const { language, setLanguage, t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname() || "";
    const isRTL = language === "ar";

    // --- User State ---
    const cachedUserRef = useRef<HeaderUserSnapshot>(null);
    const [serverUser, setServerUser] = useState<HeaderUserSnapshot>(null);
    const [hydrated, setHydrated] = useState(false);
    const [authCheckCompleted, setAuthCheckCompleted] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [authDisabledFlag, setAuthDisabledFlag] = useState(false);
    const [localProfilePic, setLocalProfilePic] = useState<string | null>(null);

    // --- Dropdown/Panel States ---
    const [notifOpen, setNotifOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [sellDropdownOpen, setSellDropdownOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [languageOpen, setLanguageOpen] = useState(false);
    const [mobileLangOpen, setMobileLangOpen] = useState(false);
    const [expandedSellItem, setExpandedSellItem] = useState<string | null>(null);

    // --- Notifications State ---
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const notificationsFetchedAtRef = useRef<number>(0);

    // --- Refs ---
    const sellDropdownRef = useRef<HTMLDivElement>(null);
    const sellCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const notifPanelRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const headerRef = useRef<HTMLElement>(null);
    const profileDropdownRef = useRef<HTMLDivElement>(null);
    const languageDropdownRef = useRef<HTMLDivElement>(null);
    const stablePicRef = useRef<string | null>(null);
    const isLoggingOutRef = useRef(false);

    // --- Handlers ---
    const handleFullLogout = useCallback(async () => {
        if (isLoggingOutRef.current) return;
        isLoggingOutRef.current = true;

        setIsLoggingOut(true);
        setProfileDropdownOpen(false);
        setMenuOpen(false);
        try {
            await performGlobalLogout({
                contextLogout: async () => {
                    await logout();
                }
            });
            clearCachedUserSnapshot();
            setServerUser(null);
            setAuthDisabledFlag(true);
            setNotifications([]);
            setUnreadCount(0);
        } catch {
            await logout();
        } finally {
            setIsLoggingOut(false);
            isLoggingOutRef.current = false;
        }
    }, [logout]);

    const fetchNotifications = useCallback(async () => {
        if (isSyncDisabled()) return;
        setLoadingNotifs(true);
        try {
            const res = await fetch("/api/notifications/me");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
                notificationsFetchedAtRef.current = Date.now();

                // Cache results
                localStorage.setItem(NOTIF_CACHE_KEY, JSON.stringify(data.notifications || []));
                localStorage.setItem(UNREAD_CACHE_KEY, String(data.unreadCount || 0));
                localStorage.setItem(NOTIF_CACHE_TS_KEY, String(Date.now()));
            }
        } catch { }
        finally { setLoadingNotifs(false); }
    }, []);

    const markAsRead = useCallback(async (id: number | string) => {
        try {
            const res = await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "markAsRead", notificationId: id })
            });

            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch { }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "markAllAsRead" })
            });

            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        } catch { }
    }, []);

    const handleCreateClick = useCallback((path: string) => {
        setProfileDropdownOpen(false);
        router.push(path);
    }, [router]);

    // Navigation logic
    const handleSellMouseEnter = useCallback(() => {
        if (sellCloseTimeoutRef.current) {
            clearTimeout(sellCloseTimeoutRef.current);
            sellCloseTimeoutRef.current = null;
        }
        setSellDropdownOpen(true);
    }, []);

    const handleSellMouseLeave = useCallback(() => {
        sellCloseTimeoutRef.current = setTimeout(() => {
            setSellDropdownOpen(false);
        }, 150);
    }, []);

    const sellNavItems = {
        createLabel: t("sell_menu.sell_your_car") || "Sell Your Car",
        createHref: `/${language}/direct-sales/create`,
        guideLabel: t("sell_menu.sell_guide") || "Selling Guide",
        guideHref: `/${language}/sell-guide?type=direct-sale`,
    };

    const isSellActive = pathname.startsWith(`/${language}/direct-sales/create`) || pathname.startsWith(`/${language}/sell-guide`);
    const isAuctionsActive = pathname.startsWith(`/${language}/auctions`);

    // --- Effects & Logic ---

    // Load cached data from localStorage after hydration
    useEffect(() => {
        if (typeof window === "undefined") return;

        const isAuthDisabled = isSyncDisabled();
        if (isAuthDisabled) {
            setAuthDisabledFlag(true);
            setServerUser(null);
            setLocalProfilePic(null);
            setUnreadCount(0);
            setAuthCheckCompleted(true);
            setHydrated(true);
            return;
        }

        const cachedUser = readCachedUserSnapshot();
        if (cachedUser) {
            cachedUserRef.current = cachedUser;
            setServerUser(cachedUser);
        }

        // Load cached notifications
        try {
            const raw = localStorage.getItem(NOTIF_CACHE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) setNotifications(parsed);
            }
        } catch { }

        try {
            const v = Number(localStorage.getItem(UNREAD_CACHE_KEY) ?? "0");
            if (!Number.isNaN(v)) setUnreadCount(v);
        } catch { }

        try {
            const stored = Number(localStorage.getItem(NOTIF_CACHE_TS_KEY) ?? "0");
            if (!Number.isNaN(stored) && stored > 0) notificationsFetchedAtRef.current = stored;
        } catch { }

        setLocalProfilePic(getStoredProfilePic());
        setHydrated(true);
    }, []);

    // Auth sync effect
    useEffect(() => {
        if (!hydrated || isLoggingOut || authDisabledFlag) return;

        const syncAuth = async () => {
            try {
                const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.user) {
                        const sanitized = sanitizeUserSnapshot(data.user);
                        setServerUser(sanitized);
                        writeCachedUserSnapshot(data.user);
                    } else {
                        setServerUser(null);
                        clearCachedUserSnapshot();
                    }
                }
            } catch { }
            finally { setAuthCheckCompleted(true); }
        };

        syncAuth();
        const interval = setInterval(syncAuth, 60000);
        return () => clearInterval(interval);
    }, [hydrated, isLoggingOut, authDisabledFlag]);

    // Notification polling
    useEffect(() => {
        if (!hydrated || !serverUser || authDisabledFlag) return;

        fetchNotifications();
        const interval = setInterval(fetchNotifications, NOTIF_CACHE_TTL_MS);
        return () => clearInterval(interval);
    }, [hydrated, serverUser, authDisabledFlag, fetchNotifications]);

    // Handle clicks outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;

            if (profileDropdownOpen && profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
                setProfileDropdownOpen(false);
            }
            if (languageOpen && languageDropdownRef.current && !languageDropdownRef.current.contains(target)) {
                setLanguageOpen(false);
            }
            if (notifOpen && notifPanelRef.current && !notifPanelRef.current.contains(target)) {
                setNotifOpen(false);
            }
        };

        // Global listeners removed - relying on transparent overlay in UserMenu for correct mobile handling
        // document.addEventListener("mousedown", handleClickOutside);
        // document.addEventListener("touchstart", handleClickOutside);
        // return () => {
        //     document.removeEventListener("mousedown", handleClickOutside);
        //     document.removeEventListener("touchstart", handleClickOutside);
        // };
    }, [profileDropdownOpen, languageOpen, notifOpen]);

    // Event listeners
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleAuthChanged = (e: any) => {
            if (e.detail?.action === "logout") {
                handleFullLogout();
            } else {
                // Trigger re-sync
                setAuthCheckCompleted(false);
            }
        };

        const handleRefreshNotifs = () => fetchNotifications();

        window.addEventListener("auth:changed", handleAuthChanged);
        on("notifications:updated", handleRefreshNotifs);

        return () => {
            window.removeEventListener("auth:changed", handleAuthChanged);
        };
    }, [handleFullLogout, fetchNotifications]);

    // Return everything needed by the HeaderContent component
    return {
        // States
        authUser,
        serverUser,
        hydrated,
        authCheckCompleted,
        isLoggingOut,
        authDisabledFlag,
        localProfilePic,
        notifOpen,
        menuOpen,
        sellDropdownOpen,
        profileDropdownOpen,
        languageOpen,
        mobileLangOpen,
        expandedSellItem,
        notifications,
        unreadCount,
        loadingNotifs,
        isRTL,
        language,
        pathname,
        router,
        t,

        // Setters (if needed directly)
        setNotifOpen,
        setMenuOpen,
        setSellDropdownOpen,
        setProfileDropdownOpen,
        setLanguageOpen,
        setMobileLangOpen,
        setExpandedSellItem,
        setLanguage,
        setLocalProfilePic,
        setServerUser,
        setHydrated,
        setAuthCheckCompleted,

        // Handlers
        handleFullLogout,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        handleCreateClick,
        handleSellMouseEnter,
        handleSellMouseLeave,

        // Computeds
        sellNavItems,
        isSellActive,
        isAuctionsActive,

        // Refs
        sellDropdownRef,
        sellCloseTimeoutRef,
        panelRef,
        notifPanelRef,
        btnRef,
        headerRef,
        profileDropdownRef,
        languageDropdownRef,
        stablePicRef,
        cachedUserRef
    };
}
