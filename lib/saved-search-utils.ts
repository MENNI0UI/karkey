"use client"

/**
 * Shared utilities for managing saved search cookies across different pages.
 * This eliminates code duplication across showroom, direct-sales, and auction filter sidebars.
 */

export type SavedSearchType = 'direct-sales' | 'auctions';

const COOKIE_NAMES: Record<SavedSearchType, string> = {
    'direct-sales': 'direct_sales_saved_searches_guest',
    'auctions': 'saved_searches_guest'
};

/**
 * Clears the guest saved search cookie for the specified page type.
 * Used when user toggles off the "Save Search" button.
 */
export function clearSavedSearchCookie(type: SavedSearchType): void {
    try {
        const cookieName = COOKIE_NAMES[type];
        const secure = globalThis.window !== undefined && globalThis.window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `${cookieName}=; path=/; max-age=0${secure}`;
    } catch {
        // Silently fail if cookie clearing fails
    }
}

/**
 * Gets the cookie name for a specific saved search type.
 */
export function getSavedSearchCookieName(type: SavedSearchType): string {
    return COOKIE_NAMES[type];
}
