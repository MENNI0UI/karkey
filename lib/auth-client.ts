"use client";



/**
 * Performs a robust global logout dealing with localStorage cleanup, 
 * cookie clearing, and event broadcasting.
 * 
 * @param options.redirect - Whether to redirect to home after logout (default: true)
 * @param options.contextLogout - Optional callback to clear React Context state
 * @param options.onBeforeRedirect - Optional callback to run before redirection (e.g. for UI state updates)
 */
export async function performGlobalLogout(options?: {
    redirect?: boolean;
    contextLogout?: () => Promise<void> | void;
    onBeforeRedirect?: () => void;
}) {
    const { redirect = true, contextLogout, onBeforeRedirect } = options || {};

    // 1. Mark auth as disabled FIRST to stop sync polls/interactions
    // but DON'T clear tokens yet to allow signOut() to use them if needed for CSRF
    try {
        localStorage.setItem("auth:disabled", "1");
        localStorage.setItem("auth:logout", String(Date.now()));
    } catch (e) {
        console.error("[Auth] initial cleanup error:", e);
    }

    // 2. Prevent auth sync
    try { (window as any).__preventAuthSync = true; } catch { }

    // 3. Broadcast events immediately to stop background activity
    try { window.dispatchEvent(new CustomEvent("auth:changed", { detail: { action: "logout" } })); } catch { }
    try { window.dispatchEvent(new CustomEvent("watchlist:changed", { detail: { action: "logout" } })); } catch { }

    // 4. Call optional before-redirect callback (e.g. flushSync state updates)
    if (onBeforeRedirect) {
        try { onBeforeRedirect(); } catch (e) { console.error("[Auth] onBeforeRedirect error:", e); }
    }

    // 5. Call Context Logout (This calls signOut() from NextAuth)
    if (contextLogout) {
        try { await contextLogout(); } catch { }
    }

    // 6. NOW clear the rest of localStorage
    try {
        const keysToRemove = [
            "auth_token", "auth:token", "me_cached", "auth_profile_picture", "auth_profile_userid",
            "notifications_cache", "unread_count", "header_user_cache", "notifications:refresh",
            "watchlist:refresh", "karkey_auth", "session", "jwt", "token"
        ];

        for (const k of keysToRemove) {
            try { localStorage.removeItem(k); } catch { }
        }

        const allKeys = Object.keys(localStorage);
        for (const k of allKeys) {
            if (k.startsWith("profile:") || k.startsWith("watchlist") || k.startsWith("showroom:interest")) {
                try { localStorage.removeItem(k); } catch { }
            }
        }
    } catch (e) {
        console.error("[Auth] final localStorage cleanup error:", e);
    }

    // 6. Server Logout (Concurrent)
    // Removed legacy /api/auth/logout calls as they conflict with NextAuth catch-all.
    // Session clearing is handled by NextAuth's signOut() called via Context.

    // 7. Small delay for propagation
    await new Promise(r => setTimeout(r, 100));

    // 8. Redirect
    if (redirect) {
        try { window.location.href = "/"; } catch { window.location.reload(); }
    }
}
