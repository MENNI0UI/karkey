import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getCurrentUser } from "./mysql-auth"
import prisma from "./prisma"
import { canonicalizeParams, parseParams } from "./filter-utils"

export type SavedSearchType = 'direct-sales' | 'auctions';

/**
 * Checks for a saved search (either in cookies or database) and redirects to the filtered URL
 * if no active filters are present in the current searchParams.
 * This prevents the 'flash' of unfiltered content on the server side.
 */
const IGNORED_KEYS = new Set(['lang']);

function hasActiveFilters(searchParams: Record<string, any>): boolean {
    return Object.keys(searchParams).some(k => {
        if (IGNORED_KEYS.has(k)) return false;
        const val = searchParams[k];
        return !!val && (Array.isArray(val) ? val.length > 0 : (String(val).trim() !== "" && String(val).toLowerCase() !== "all"));
    });
}

const COOKIE_NAMES: Record<SavedSearchType, string> = {
    'direct-sales': 'direct_sales_saved_searches_guest',
    'auctions': 'saved_searches_guest'
};

async function fetchLatestSavedSearch(type: SavedSearchType, userId: string) {
    const id = Number(userId);
    const orderBy = { created_at: 'desc' } as const;
    console.log(`[ServerSavedSearch] Fetching for type=${type}, userId=${userId} (as num=${id})`);
    if (type === 'auctions') return prisma.saved_searches.findFirst({ where: { user_id: id }, orderBy });
    if (type === 'direct-sales') {
        console.log(`[ServerSavedSearch] Querying direct_sales_saved_searches with user_id=${userId}`);
        const text_res = await prisma.direct_sales_saved_searches.findFirst({ where: { user_id: Number(userId) }, orderBy });
        console.log(`[ServerSavedSearch] Direct Sales result:`, text_res ? `Found ID ${text_res.id}` : 'null');
        return text_res;
    }
    return null;
}

/**
 * Checks for a saved search and redirects if no active filters are present.
 */
export async function handleSavedSearchRedirect(
    type: SavedSearchType,
    lang: string,
    searchParams: Record<string, any>
) {
    if (searchParams['reset'] === 'true') return;
    if (hasActiveFilters(searchParams)) return;

    const cookieStore = await cookies();
    let paramsStr: string | null = null;

    // 1. Try Guest Cookie
    const guestRaw = cookieStore.get(COOKIE_NAMES[type])?.value;
    if (guestRaw) {
        try {
            const arr = JSON.parse(decodeURIComponent(guestRaw));
            if (Array.isArray(arr) && arr.length > 0 && arr[0]?.params) {
                paramsStr = canonicalizeParams(parseParams(arr[0].params));
            }
        } catch { }
    }

    // 2. Try DB for Authenticated User
    if (!paramsStr) {
        const user = await getCurrentUser();
        if (user?.userId) {
            try {
                const latest = await fetchLatestSavedSearch(type, String(user.userId));
                if (latest?.params) {
                    paramsStr = canonicalizeParams(parseParams(latest.params));
                }
            } catch { }
        }
    }

    if (paramsStr) {
        redirect(`/${lang}/${type}?${paramsStr}`);
    }
}

function getGuestSavedParams(cookieValue: string | undefined): string | null {
    if (!cookieValue) return null;
    try {
        const arr = JSON.parse(decodeURIComponent(cookieValue));
        if (Array.isArray(arr) && arr.length > 0) {
            const latest = arr[0];
            return canonicalizeParams(parseParams(latest.params || latest));
        }
    } catch { }
    return null;
}

/**
 * Checks if the current URL parameters match a saved search (guest or DB).
 */
export async function getSavedSearchState(
    type: SavedSearchType,
    searchParams: Record<string, any>
): Promise<{ isMatch: boolean, savedId: number | null, paramsStr: string | null }> {
    const cookieStore = await cookies();
    const currentParamsStr = canonicalizeParams(searchParams);
    const isReset = searchParams['reset'] === 'true';
    const guestSavedParamsStr = getGuestSavedParams(cookieStore.get(COOKIE_NAMES[type])?.value);

    // 1. Check DB for Authenticated User FIRST (so we always get savedId if available)
    const userContext = await getCurrentUser();
    if (userContext?.userId) {
        try {
            const latest = await fetchLatestSavedSearch(type, String(userContext.userId));
            if (latest) {
                const savedParamsStr = canonicalizeParams(parseParams(latest.params));
                const isMatch = !isReset && !!currentParamsStr && savedParamsStr === currentParamsStr;
                return { isMatch, savedId: Number(latest.id), paramsStr: savedParamsStr };
            } else {
                // If user is logged in but has NO saved search in DB, 
                // we should NOT fallback to the guest cookie, as that would cause
                // cross-device sync issues (showing a saved search that was deleted on another device).
                return { isMatch: false, savedId: null, paramsStr: null };
            }
        } catch { }
    }

    // 2. Fallback to Guest Cookie (Only if NOT logged in)
    if (guestSavedParamsStr && !isReset && currentParamsStr && guestSavedParamsStr === currentParamsStr) {
        return { isMatch: true, savedId: null, paramsStr: guestSavedParamsStr };
    }

    return { isMatch: false, savedId: null, paramsStr: guestSavedParamsStr };
}
