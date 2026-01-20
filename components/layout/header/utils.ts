import { HeaderUserSnapshot, USER_CACHE_KEY, USER_CACHE_TTL_MS } from "./types";

export function normalizePhotoUrl(url: string | null): string {
    if (!url) return "/images/placeholders/user.png";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/")) return url;
    return `/${url}`;
}

export function deriveInitialFromUser(user: any): string | null {
    if (!user) return null;
    try {
        const nameSource = (
            user?.first_name ??
            user?.profile?.first_name ??
            user?.last_name ??
            user?.profile?.last_name ??
            user?.username ??
            user?.profile?.username ??
            user?.email ??
            ""
        )?.toString().trim();
        if (!nameSource) return null;
        return nameSource.charAt(0).toUpperCase();
    } catch {
        return null;
    }
}

export function sanitizeUserSnapshot(user: any): HeaderUserSnapshot {
    if (!user || typeof user !== "object") return null;
    const normalizedId = Number(user.id ?? user.userId ?? user.user_id);
    return {
        id: Number.isFinite(normalizedId) ? normalizedId : null,
        userId: Number.isFinite(normalizedId) ? normalizedId : null,
        username: user.username ?? null,
        email: user.email ?? null,
        first_name: user.first_name ?? user.profile?.first_name ?? null,
        last_name: user.last_name ?? user.profile?.last_name ?? null,
        profile_picture: user.profile_picture ?? user.profile?.profile_picture ?? null,
        initial: deriveInitialFromUser(user),
    };
}

export function persistInitialForUser(initial: string | null, userId?: number | null) {
    if (typeof window === "undefined") return;
    try {
        if (!initial) {
            if (userId != null) localStorage.removeItem(`profile:initial:${userId}`);
            return;
        }
        localStorage.setItem("profile:initial", initial);
        if (userId != null) localStorage.setItem(`profile:initial:${userId}`, initial);
    } catch { }
}

export function getStoredProfilePic() {
    if (typeof window === "undefined") return null;
    try {
        return localStorage.getItem("auth_profile_picture");
    } catch { return null; }
}

export function getStoredProfileInitial(preferredUserIds?: Array<number | null>): string | null {
    if (typeof window === "undefined") return null
    try {
        // Don't return cached initials if logged out or no token
        const isLoggedOut = localStorage.getItem("auth:disabled") === "1" || localStorage.getItem("auth:logout")
        if (isLoggedOut) return null
        const hasToken = localStorage.getItem("auth_token") || localStorage.getItem("auth:token")
        if (!hasToken) return null

        const ids: number[] = []
        for (const raw of preferredUserIds ?? []) {
            if (raw == null) continue
            const num = Number(raw)
            if (!Number.isFinite(num)) continue
            if (!ids.includes(num)) ids.push(num)
        }
        const authUid = (() => {
            try {
                const v = localStorage.getItem("auth_profile_userid")
                return v ? Number(v) : null
            } catch {
                return null
            }
        })()
        if (authUid != null && !ids.includes(authUid)) ids.push(authUid)
        const lastUid = (() => {
            try {
                const v = localStorage.getItem("profile:lastUid")
                return v ? Number(v) : null
            } catch {
                return null
            }
        })()
        if (lastUid != null && !ids.includes(lastUid)) ids.push(lastUid)
        for (const id of ids) {
            try {
                const val = localStorage.getItem(`profile:initial:${id}`)
                if (val) return val
            } catch { }
        }
        const fallback = localStorage.getItem("profile:initial")
        if (fallback) return fallback
    } catch { }
    return null
}

export function readCachedUserSnapshot(): HeaderUserSnapshot {
    if (typeof window === "undefined") return null
    try {
        const isLoggedOut = localStorage.getItem("auth:disabled") === "1" || localStorage.getItem("auth:logout")
        if (isLoggedOut) {
            localStorage.removeItem(USER_CACHE_KEY)
            return null
        }
        const raw = localStorage.getItem(USER_CACHE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== "object") return null
        const cachedAt = Number(parsed.cachedAt ?? 0)
        if (cachedAt && Date.now() - cachedAt > USER_CACHE_TTL_MS) {
            localStorage.removeItem(USER_CACHE_KEY)
            return null
        }
        const { cachedAt: _omit, ...snapshot } = parsed
        return snapshot
    } catch {
        return null
    }
}

export function writeCachedUserSnapshot(user: any) {
    if (typeof window === "undefined") return
    const snapshot = sanitizeUserSnapshot(user)
    if (!snapshot) {
        localStorage.removeItem(USER_CACHE_KEY)
        return
    }
    try {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify({ ...snapshot, cachedAt: Date.now() }))
    } catch { }
}

export function clearCachedUserSnapshot() {
    if (typeof window === "undefined") return
    try {
        localStorage.removeItem(USER_CACHE_KEY)
    } catch { }
}

export function isSyncDisabled(): boolean {
    try {
        if (typeof window === "undefined") return false
        return localStorage.getItem("auth:disabled") === "1" || Boolean((window as any).__preventAuthSync)
    } catch {
        return false
    }
}
