/**
 * Search Module Index
 * 
 * Exports all search-related utilities from a single entry point.
 * Use `import { ... } from '@/lib/search'` for all search functionality.
 */

// Core dictionary and normalization
export {
    // Dictionaries
    FUEL_DICTIONARY,
    TRANSMISSION_DICTIONARY,
    CONDITION_DICTIONARY,
    CITY_DICTIONARY,
    DOORS_DICTIONARY,
    ENGINE_DICTIONARY,
    COLOR_DICTIONARY,
    ACTION_KEYWORDS,
    
    // Types
    type SearchDictionaryType,
    type NumericSearchResult,
    
    // Functions
    normalizeForSearch,
    findDbValue,
    findAllMatches,
    searchAllDictionaries,
    getDisplayLabel,
    parseNumericSearch
} from './search-dictionary';
