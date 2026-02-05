/**
 * Search utility functions for vehicle search functionality.
 * Used by server actions to process search queries and filters.
 * 
 * NOTE: This file now uses the unified search dictionary from lib/search/search-dictionary.ts
 * All multilingual term mappings are centralized there.
 */

import {
    findAllMatches,
    searchAllDictionaries,
    normalizeForSearch,
    parseNumericSearch,
    type SearchDictionaryType,
    type NumericSearchResult
} from './search/search-dictionary';

// Re-export for convenience
export { parseNumericSearch, type NumericSearchResult };

/**
 * Get search term variants for fuzzy matching.
 * Returns an array of normalized search terms.
 */
export function getSearchTermVariants(query: string): string[] {
    if (!query || typeof query !== 'string') return [];
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    // Return the base query and common variants
    const variants = [trimmed];

    // Add normalized variant (without diacritics, normalized Arabic)
    const normalized = normalizeForSearch(trimmed);
    if (normalized !== trimmed) {
        variants.push(normalized);
    }

    return Array.from(new Set(variants)); // Remove duplicates
}

/**
 * Get enum matches for a search query.
 * Returns matched enum keys based on the query and enum type.
 * Now uses the unified search dictionary.
 */
export function getEnumMatches(query: string, enumType: 'fuel' | 'transmission' | 'condition'): string[] {
    if (!query || typeof query !== 'string') return [];
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return findAllMatches(q, enumType as SearchDictionaryType);
}

/**
 * Get ALL field matches across all dictionaries.
 * This is the unified search function for comprehensive multilingual search.
 */
export function getUnifiedSearchMatches(query: string): {
    fuel: string[];
    transmission: string[];
    condition: string[];
    city: string[];
    doors: string[];
    engine: string[];
    color: string[];
} {
    return searchAllDictionaries(query);
}

/**
 * Format a query string for MySQL full-text search (boolean mode).
 * Adds suffix wildcard (*) for prefix matching.
 */
export function formatFTSQuery(query: string): string {
    if (!query || typeof query !== 'string') return '';
    const trimmed = query.trim();
    if (!trimmed) return '';

    // Split into words and format each for boolean mode
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return '';

    // Add wildcard suffix to each word for prefix matching
    return words.map(word => `+${word}*`).join(' ');
}

/**
 * Normalize search filter values.
 * Handles both string and array inputs, trimming and lowercasing values.
 */
export function normalizeSearchFilter(value: string | string[] | undefined): string | string[] | undefined {
    if (value === undefined || value === null) return undefined;

    if (Array.isArray(value)) {
        const normalized = value
            .filter(v => v !== null && v !== undefined)
            .map(v => String(v).trim())
            .filter(v => v.length > 0);
        return normalized.length > 0 ? normalized : undefined;
    }

    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

