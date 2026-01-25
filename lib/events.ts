
/**
 * Global Event Bus for Cross-Component Communication
 * 
 * Provides a type-safe wrapper around the native CustomEvent API.
 * 
 * Usage:
 *   emit("watchlist:updated", { vehicleId: 123, status: true })
 *   
 *   useEffect(() => {
 *     return on("watchlist:updated", (detail) => {
 *       if (detail.vehicleId === myId) setSaved(detail.status);
 *     })
 *   }, [])
 */

export interface AppEventMap {
    "watchlist:updated": { vehicleId: number; status: boolean; userId: number | null };
    "watchlist:changed": { auctionId?: number; direct_sale_id?: number; userId: number | null; action: "add" | "remove" };
    "auth:changed": { action: "login" | "logout" | "profile-update" | "profile-sync" };
    "notifications:updated": void;
    "saved_search:updated": { searchId?: number; name: string; isActive: boolean };
}

export function emit<K extends keyof AppEventMap>(
    name: K,
    detail?: AppEventMap[K]
) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
        new CustomEvent(name, { detail })
    );
}

export function on<K extends keyof AppEventMap>(
    name: K,
    callback: (detail: AppEventMap[K]) => void
): () => void {
    if (typeof window === "undefined") return () => { };

    const handler = (e: Event) => {
        const customEvent = e as CustomEvent<AppEventMap[K]>;
        callback(customEvent.detail);
    };

    window.addEventListener(name, handler);
    return () => window.removeEventListener(name, handler);
}
