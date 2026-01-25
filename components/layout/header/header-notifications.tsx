"use client";

import React from "react";
import { Bell } from "lucide-react";

interface HeaderNotificationsProps {
    language: string;
    unreadCount: number;
    notifOpen: boolean;
    setNotifOpen: (open: boolean) => void;
    fetchNotifications: () => Promise<void>;
    notifications: any[];
    loadingNotifs: boolean;
    markAsRead: (id: number | string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clientAuth: boolean;
    authUser: any;
    serverUser: any;
    router: any;
    panelRef: React.RefObject<HTMLDivElement>;
    btnRef: React.RefObject<HTMLButtonElement>;
    notifPanelRef: React.RefObject<HTMLDivElement>;
    DynamicNotificationsPanel: any;
}

export const HeaderNotifications: React.FC<HeaderNotificationsProps> = ({
    language,
    unreadCount,
    notifOpen,
    setNotifOpen,
    fetchNotifications,
    notifications,
    loadingNotifs,
    markAsRead,
    markAllAsRead,
    clientAuth,
    authUser,
    serverUser,
    router,
    panelRef,
    btnRef,
    notifPanelRef,
    DynamicNotificationsPanel
}) => {
    return (
        <div className="relative" ref={panelRef}>
            <button
                ref={btnRef}
                onClick={async () => {
                    if (!clientAuth && !authUser && !serverUser) {
                        router.push(`/${language}/auth/login`);
                        return;
                    }
                    const next = !notifOpen;
                    setNotifOpen(next);
                    if (next) await fetchNotifications();
                }}
                className="relative p-2.5 rounded-full text-[#1e2a5e] hover:text-[#103090] hover:bg-[#faf5ef] transition-colors"
                aria-label="Notifications"
                aria-expanded={notifOpen}
                type="button"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#B8071C] text-white text-[10px] font-bold flex items-center justify-center opacity-100 shadow-sm">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>
            {notifOpen && (
                <>
                    {/* Transparent overlay for outside clicks */}
                    <div
                        className="fixed z-[100001] bg-transparent"
                        style={{ top: -2000, left: -2000, right: -2000, bottom: -2000 }}
                        onClick={() => setNotifOpen(false)}
                        aria-hidden="true"
                    />
                    <React.Suspense fallback={<div />}>
                        <DynamicNotificationsPanel
                            ref={notifPanelRef}
                            onClose={() => setNotifOpen(false)}
                            language={language}
                            notifications={notifications}
                            loadingNotifs={loadingNotifs}
                            unreadCount={unreadCount}
                            markAsRead={markAsRead}
                            markAllAsRead={markAllAsRead}
                        />
                    </React.Suspense>
                </>
            )}
        </div>
    );
};
