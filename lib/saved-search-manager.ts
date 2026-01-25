"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { canonicalizeParams, paramsToObject, parseParams } from "@/lib/filter-utils"

// ============================================================================
// TYPES & CONFIG
// ============================================================================

export type SavedSearchContext = 'direct-sales' | 'auctions'

interface ContextConfig {
    cookieName: string
    apiEndpoint: string
    pageRoute: string
}

const CONFIG: Record<SavedSearchContext, ContextConfig> = {
    'direct-sales': {
        cookieName: 'direct_sales_saved_searches_guest',
        apiEndpoint: '/api/direct-sales-saved-searches',
        pageRoute: '/direct-sales'
    },
    'auctions': {
        cookieName: 'saved_searches_guest',
        apiEndpoint: '/api/saved-searches',
        pageRoute: '/auctions'
    }
}

// ============================================================================
// COOKIE HELPERS (Guest Users)
// ============================================================================

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null
    const match = document.cookie.split('; ').find(c => c.startsWith(`${name}=`))
    if (!match) return null
    return match.split('=')[1] || null
}

function setCookie(name: string, value: string, maxAgeDays = 365): void {
    if (typeof window === 'undefined') return
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    const maxAge = 60 * 60 * 24 * maxAgeDays
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}${secure}`
}

function clearCookie(name: string): void {
    if (typeof document === 'undefined') return
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${name}=; path=/; max-age=0${secure}`
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Load saved search from cookie (guest) - no `type` filtering needed
 * because each context has its own cookie
 */
function loadFromCookie(context: SavedSearchContext): string | null {
    const { cookieName } = CONFIG[context]
    const raw = getCookie(cookieName)
    if (!raw) return null

    try {
        const arr = JSON.parse(decodeURIComponent(raw))
        if (Array.isArray(arr) && arr.length > 0 && arr[0]?.params) {
            // Clean params - remove any lingering 'type' field
            const cleanParams = { ...arr[0].params }
            delete cleanParams.type
            return canonicalizeParams(parseParams(cleanParams))
        }
    } catch { }
    return null
}

/**
 * Save to cookie (guest)
 */
function saveToCookie(context: SavedSearchContext, params: Record<string, any>): void {
    const { cookieName } = CONFIG[context]
    try {
        const raw = getCookie(cookieName)
        const existing = raw ? JSON.parse(decodeURIComponent(raw)) : []

        // Clean params - never save 'type'
        const cleanParams = { ...params }
        delete cleanParams.type

        existing.unshift({
            name: `Saved search ${new Date().toLocaleString()}`,
            params: cleanParams,
            created_at: new Date().toISOString()
        })

        setCookie(cookieName, JSON.stringify(existing.slice(0, 10)))
    } catch { }
}

// ============================================================================
// REACT HOOK
// ============================================================================

interface UseSavedSearchResult {
    isSavedActive: boolean
    savedId: number | null
    isLoading: boolean
    toggleSave: () => Promise<void>
    loadedParams: string | null
}

interface InitialSavedState {
    isMatch?: boolean
    savedId?: number | null
    paramsStr?: string | null
}

/**
 * Unified hook for managing saved searches
 * Each context (direct-sales, auctions) is completely isolated
 * 
 * @param initialState - Optional SSR state to prevent flash of unsaved button
 */
export function useSavedSearch(
    context: SavedSearchContext,
    searchParams: URLSearchParams | null,
    language: string,
    t: (key: any) => string,
    initialState?: InitialSavedState
): UseSavedSearchResult {
    const router = useRouter()
    const { toast } = useToast()
    const config = CONFIG[context]

    // Initialize from SSR state if available - prevents flash
    const [isSavedActive, setIsSavedActive] = useState(initialState?.isMatch ?? false)
    const [savedId, setSavedId] = useState<number | null>(initialState?.savedId ?? null)
    const [isLoading, setIsLoading] = useState(!initialState?.isMatch) // Already loaded if SSR provided match
    const [loadedParams, setLoadedParams] = useState<string | null>(initialState?.paramsStr ?? null)

    // Load saved search on mount
    useEffect(() => {
        const load = async () => {
            let foundParams: string | null = null
            let foundId: number | null = null
            let isAuthenticated = false

            // Try API first (Server-side truth)
            try {
                const res = await fetch(config.apiEndpoint, {
                    cache: 'no-store',
                    credentials: 'include'
                })

                if (res.ok) {
                    isAuthenticated = true
                    const data = await res.json()

                    // IF AUTHENTICATED: STRICTLY USE DB
                    // Aggressively clear local cookie to prevent any stale state mix-up
                    clearCookie(config.cookieName)

                    if (data?.success && data.saved_searches?.length > 0) {
                        const latest = data.saved_searches[0]
                        if (latest?.params) {
                            const cleanParams = typeof latest.params === 'string'
                                ? JSON.parse(latest.params)
                                : latest.params
                            delete cleanParams.type
                            foundParams = canonicalizeParams(parseParams(cleanParams))
                            foundId = Number(latest.id)
                        }
                    }
                } else if (res.status === 401) {
                    isAuthenticated = false
                }
            } catch {
                isAuthenticated = false
            }

            // IF GUEST: Use Cookie only
            if (!isAuthenticated) {
                foundParams = loadFromCookie(context)
            }

            // Apply state logic
            if (foundParams) {
                setSavedId(foundId)
                setLoadedParams(foundParams)

                const currentParams = searchParams ? canonicalizeParams(searchParams) : ''
                const isReset = searchParams?.get('reset') === 'true'

                // Check strict match
                if (currentParams && currentParams === foundParams) {
                    setIsSavedActive(true)
                } else if (!currentParams && !isReset) {
                    router.replace(`/${language}${config.pageRoute}?${foundParams}`)
                    setIsSavedActive(true)
                } else {
                    setIsSavedActive(false)
                }
            } else {
                // No saved search (either deleted on DB or no cookie)
                setSavedId(null)
                setIsSavedActive(false)
                setLoadedParams(null)
            }

            setIsLoading(false)
        }

        load()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Toggle save/unsave
    const toggleSave = useCallback(async () => {
        if (!searchParams) return

        const paramString = canonicalizeParams(searchParams)

        // UNSAVE
        if (isSavedActive) {
            // Optimistic update
            setIsSavedActive(false)
            setSavedId(null)
            setLoadedParams(null)
            toast({ title: t('notifications.removed'), description: t('filters.saved_search_removed'), variant: 'success' })

            if (savedId) {
                try {
                    // Try to delete from API
                    const res = await fetch(`${config.apiEndpoint}/${savedId}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    })

                    if (res.ok) {
                        // Consistently clear cookie for authenticated users
                        clearCookie(config.cookieName)
                    } else if (res.status === 401) {
                        // Fallback for guest: clear cookie
                        clearCookie(config.cookieName)
                    }
                } catch {
                    // Network error? assume guest and clear cookie
                    clearCookie(config.cookieName)
                }
            } else {
                // No ID (guest mode or stale state) -> clear cookie
                clearCookie(config.cookieName)
            }
            return
        }

        // SAVE
        if (!paramString) {
            toast({ title: t('filters.select_filters'), description: t('filters.select_filters_desc'), variant: 'error' })
            return
        }

        // Optimistic update
        setIsSavedActive(true)

        try {
            const paramsObj = paramsToObject(searchParams)
            delete paramsObj.type

            const body = {
                name: `Saved search ${new Date().toLocaleString()}`,
                params: paramsObj,
                replaceExisting: true
            }

            const res = await fetch(config.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                credentials: 'include'
            })

            if (res.ok) {
                // AUTHENTICATED SUCCESS
                const data = await res.json()
                if (data?.success) {
                    setSavedId(data.id || null)
                    setLoadedParams(paramString)
                    // Enforce DB-only source of truth -> Clear cookie
                    clearCookie(config.cookieName)
                    toast({ title: t('filters.search_saved'), description: t('filters.search_saved'), variant: 'success' })
                    return
                }
            } else if (res.status === 401) {
                // GUEST FALLBACK
                saveToCookie(context, paramsObj)
                setLoadedParams(paramString)
                toast({ title: t('filters.search_saved'), description: t('filters.search_saved'), variant: 'success' })
            }
        } catch {
            // Network failure fallback -> Guest save
            const paramsObj = paramsToObject(searchParams)
            delete paramsObj.type
            saveToCookie(context, paramsObj)
            setLoadedParams(paramString)
            toast({ title: t('filters.search_saved'), description: t('filters.search_saved'), variant: 'success' })
        }
    }, [searchParams, isSavedActive, savedId, config, context, toast])

    return {
        isSavedActive,
        savedId,
        isLoading,
        toggleSave,
        loadedParams
    }
}

// ============================================================================
// UTILITY: Clear saved search cookie (for use in other places)
// ============================================================================

export function clearSavedSearchCookie(context: SavedSearchContext): void {
    clearCookie(CONFIG[context].cookieName)
}
