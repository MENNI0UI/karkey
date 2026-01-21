import { searchTerms } from "@/lib/locales/search-terms";
import { SEARCH_DICTIONARY } from "@/lib/search-dictionary";

// Map localized value -> English value (DB value)
// e.g. "essence" -> "Petrol", "auto" -> "Automatic"
let reverseMap: Map<string, string> | null = null;

function initReverseMap() {
    if (reverseMap) return;
    reverseMap = new Map<string, string>();

    const languages = [searchTerms.fr, searchTerms.ar, searchTerms.es];

    // We only care about specific categories that are stored as English enum-like values in DB
    const processKeys = (prefix: string) => {
        // Iterate over English keys to find valid DB values
        Object.keys(searchTerms.en).forEach((key) => {
            if (key.startsWith(prefix)) {
                const dbValue = (searchTerms.en as Record<string, string>)[key]; // This is the English value stored in DB (e.g. "Petrol")

                // Map the English value itself to itself (normalization)
                // reverseMap!.set(dbValue.toLowerCase(), dbValue);

                // Now map other languages
                languages.forEach((lang) => {
                    const localized = (lang as Record<string, string>)[key];
                    if (localized) {
                        // normalize input: lowercase, trim
                        reverseMap!.set(String(localized).toLowerCase().trim(), dbValue);
                    }
                });
            }
        });
    };

    processKeys("vehicle.fuel.");
    processKeys("vehicle.transmission.");
    processKeys("vehicle.condition.");

    // Process Dictionary (Makes, Cities, Colors, etc.)
    Object.entries(SEARCH_DICTIONARY).forEach(([standard, variants]) => {
        // Map standard term itself if needed (optional, assuming standard is target)
        // reverseMap!.set(standard.toLowerCase(), standard);

        variants.forEach(v => {
            reverseMap!.set(String(v).toLowerCase().trim(), standard);
        });
    });
}

/**
 * Returns an array of search tokens including the original and any English database equivalents.
 * For example, if input is "essence" (French), returns ["essence", "Petrol"].
 * This allows the search query to match against the English DB value.
 */
export function getSearchTermVariants(term: string): string[] {
    if (!reverseMap) initReverseMap();

    const normalized = term.toLowerCase().trim();
    const variants = new Set<string>();
    variants.add(term); // always include original

    // Check strict match
    if (reverseMap!.has(normalized)) {
        variants.add(reverseMap!.get(normalized)!);
    }

    // Also checking for partial matches might be overkill and noisy, 
    // but if the user types "essen", we might want to match "Petrol" if "essence" maps to "Petrol".
    // For now, let's stick to strict reverse mapping for stability.

    return Array.from(variants);
}

/**
 * Parses natural language queries to extract structured filters.
 * e.g. "BMW 30000km" -> { q: "BMW", filters: { maxMileage: 30000 } }
 * Supports:
 * - Mileage: 100km, 100000 كلم, 50000 kilomètres
 * - Engine: 2.0L, 2.0 لتر, 2000cc
 * - Doors: 3 doors, 3 portes, 3 أبواب
 * - Year: 2020, 2019 (standalone 4-digit numbers in reasonable range)
 */
interface ExtractedFilters {
    maxMileage?: number;
    minEngine?: string;
    maxEngine?: string;
    doors?: number;
    year?: string;
    fuel?: string;
    transmission?: string;
}

export function parseSmartQuery(query: string) {
    let refined = query;
    const extracted: ExtractedFilters = {};

    // Helper to extract and remove patterns
    const extract = (regex: RegExp, handler: (match: RegExpExecArray) => void) => {
        let m;
        // We need to loop because there might be multiple (though usually one per type)
        // Using simple replacement loop
        while ((m = regex.exec(refined)) !== null) {
            handler(m);
            refined = refined.replace(m[0], " ").replace(/\s+/g, " ").trim();
            // reset regex index since string changed
            regex.lastIndex = 0;
        }
    };

    // 1. Mileage (km, kilom, كلم, كم)
    // Matches: 100,000 km, 100000km, 100 000 km
    // value group 1.
    extract(/(\d+(?:[., ]\d+)*)\s*(?:km|kilometers|kilometres|kilomètres|kms|كلم|كم)(?=\s|$)/gi, (m) => {
        const val = Number(m[1].replace(/[.,\s]/g, ""));
        if (!isNaN(val)) {
            // Assume user searching for mileage implies "around" or "max"? 
            // For accurate search, "maxMileage" is safest for "budget/limit" mindset, 
            // but if they type specific "10000 km", they might want exactly that?
            // Let's assume strict equality isn't ideal for mileage. 
            // We'll set a range: +/- 20%? Or simply use it as a keyword if not sure?
            // Actually, existing filters use min/max. 
            // If I put `maxMileage: val`, searching "10000 km" shows cars < 10000km. Reasonable.
            extracted.maxMileage = val;
        }
    });

    // 2. Engine Size (L, cc, liter, litre, لتر, ل)
    // Matches: 2.0L, 2.5 l, 2000cc, 1.6 لتر
    // Updated regex to handle Arabic boundaries better (replacing \b with lookahead or grouping)
    extract(/(\d+(?:[.,]\d+)?)\s*(?:l|liter|litre|litres|cc|لتر|ل)(?=\s|$)/gi, (m) => {
        const rawVal = m[1].replace(",", ".");
        const val = Number(rawVal);
        if (!isNaN(val)) {
            // If small number (< 10), assume Liters. If large (> 100), assume CC.
            // Database usually stores Liters as float (e.g. 2.0) or CC as int (e.g. 2000).
            // Check existing DB schema or `searchVehicles` convention.
            // `searchVehicles` uses `minEngine`/`maxEngine`.
            // The DB column `engine_size` is typically float (Liters) or int (CC).
            // Let's look at `searchVehicles`: `parseNumeric` logic exists.
            // Karkey seems to use Liters (e.g. 2.5) or maybe CC?
            // In `getApprovedVehicles`, it returns `engine_size` as number.
            // Based on typical car apps: 2.0 usually means 2.0L.
            // If user types 2000cc, we should normalize.
            // We'll add a `exactEngine` or similar, OR strict min/max range.
            // Let's assume +/- 0.1L for Liters.

            let valLiters = val;
            if (val > 20) {
                // Assume CC, convert to Liters roughly (CC / 1000)
                valLiters = val / 1000;
            }

            // Range [val - 0.1, val + 0.1]
            extracted.minEngine = (valLiters - 0.1).toFixed(1);
            extracted.maxEngine = (valLiters + 0.1).toFixed(1);
        }
    });

    // 3. Doors (doors, portes, abwab, أبواب, باب)
    // Matches: 3 doors, 5 portes, 2 باب
    extract(/(\d+)\s*(?:door|doors|porte|portes|portas|abwab|abab|أبواب|باب)(?=\s|$)/gi, (m) => {
        const val = Number(m[1]);
        if (!isNaN(val)) {
            extracted.doors = val;
        }
    });

    // 4. Year (standalone 4 digits 1900-2099)
    // Only extract if it looks like a year and isolated
    // regex: \b(19|20)\d{2}\b
    // But be careful not to extract "2000" from "2000 dh" or "2000 cc" (though cc handled above).
    // We'll do this LAST so units are already stripped.
    extract(/\b((?:19|20)\d{2})\b/g, (m) => {
        // Could be year or price or cc (if unit missing).
        // If we already have year, skip.
        if (!extracted.year) {
            extracted.year = m[1];
        }
    });

    // 4. Fuel Type Extraction
    // Check against known fuel types in SEARCH_DICTIONARY
    // "Petrol": ["Essence", ...], "Diesel": ...
    const fuelTypes = ["Petrol", "Diesel", "Hybrid", "Electric"];
    fuelTypes.forEach(ft => {
        // Build a regex from all variants
        const variants = SEARCH_DICTIONARY[ft] || [];
        // Add the standard term itself to variants
        const allVariants = [ft, ...variants];
        // Create regex: \b(Petrol|Essence|...)\b
        // Escape special chars in variants just in case
        const pattern = allVariants.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|");
        const regex = new RegExp(`\\b(${pattern})(?=\\s|$)`, "gi");

        extract(regex, (m) => {
            // If match found, set extracted.fuelType = standard term
            // But what if multiple matches? Use the last one or first?
            // Usually one fuel type per query.
            extracted.fuel = ft;
        });
    });

    // 5. Transmission Extraction
    const transmissionTypes = ["Manual", "Automatic"];
    transmissionTypes.forEach(tt => {
        const variants = SEARCH_DICTIONARY[tt] || [];
        const allVariants = [tt, ...variants];
        const pattern = allVariants.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|");
        const regex = new RegExp(`\\b(${pattern})(?=\\s|$)`, "gi");

        extract(regex, (m) => {
            extracted.transmission = tt;
        });
    });

    return { refinedQuery: refined, extractedFilters: extracted };
}

