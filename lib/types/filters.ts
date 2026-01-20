// ============================================
// Filter Types - Shared across pages and actions
// ============================================

export interface FilterOption {
    value: string;
    label: string;
}

/**
 * Filter options returned by getFilterOptions / getDirectSalesFilterOptions.
 */
export interface FilterOptionsResult {
    success: boolean;
    source?: 'db' | 'cache' | 'fs-fallback';
    options: {
        makes: string[];
        models: string[];
        modelsByMake?: Record<string, string[]>;
        yearsByMake?: Record<string, string[]>;
        makeModels?: Record<string, string[]>; // alias
        years: string[];
        locations: string[];
        fuelTypes: FilterOption[];
        transmissions: string[];
        conditions?: FilterOption[];
        minPrice?: number;
        maxPrice?: number;
    };
}

/**
 * Search result from searchVehicles.
 */
export interface SearchResult<T> {
    success: boolean;
    vehicles: T[];
    server_time?: string;
    hasMore?: boolean;
    total?: number;
    page?: number;
    limit?: number;
    source?: 'db' | 'cache' | 'fs-fallback';
    error?: string;
}
