/**
 * Unified Multilingual Search Dictionary
 * 
 * This is the SINGLE SOURCE OF TRUTH for all searchable terms across all 4 languages.
 * Used by both client-side suggestions and server-side search.
 * 
 * Structure: { dbValue: [all possible search terms in all languages] }
 */

// ============================================
// FUEL TYPES
// ============================================
export const FUEL_DICTIONARY: Record<string, string[]> = {
    gasoline: [
        // English
        'gasoline', 'petrol', 'gas', 'benzine',
        // French
        'essence', 'super', 'sans plomb',
        // Arabic - multiple spellings
        'بنزين', 'ايصانص', 'إيصانص', 'صونص', 'سوبر',
        // Spanish
        'gasolina', 'nafta'
    ],
    diesel: [
        // English
        'diesel', 'gasoil',
        // French
        'gazole', 'gasoil', 'diesel',
        // Arabic - multiple spellings
        'ديزل', 'ديزال', 'مازوت', 'كازوال', 'كازول', 'غازوال',
        // Spanish
        'diésel', 'diesel', 'gasóleo', 'gasoleo'
    ],
    electric: [
        // English
        'electric', 'ev', 'battery', 'bev',
        // French
        'électrique', 'electrique',
        // Arabic
        'كهربائي', 'كهربائية', 'كهرباء', 'إلكتريك',
        // Spanish
        'eléctrico', 'electrico'
    ],
    hybrid: [
        // English
        'hybrid', 'phev', 'hev',
        // French
        'hybride',
        // Arabic
        'هجين', 'هجينة', 'هايبرد', 'هايبريد',
        // Spanish
        'híbrido', 'hibrido'
    ]
};

// ============================================
// TRANSMISSION
// ============================================
export const TRANSMISSION_DICTIONARY: Record<string, string[]> = {
    automatic: [
        // English
        'automatic', 'auto', 'at', 'cvt', 'dct',
        // French
        'automatique', 'auto', 'bva', 'boite auto',
        // Arabic - multiple spellings
        'أوتوماتيك', 'اوتوماتيك', 'اتوماتيك', 'اوتوماتيكي', 'اوتو', 'بوات اوتو',
        // Spanish
        'automático', 'automatico', 'auto'
    ],
    manual: [
        // English
        'manual', 'stick', 'mt', 'standard',
        // French
        'manuelle', 'manuel', 'boite manuelle', 'bvm',
        // Arabic
        'يدوي', 'يدوية', 'مانويل', 'عادي', 'عادية', 'بوات عادية',
        // Spanish
        'manual', 'estándar', 'estandar'
    ]
};

// ============================================
// CONDITION
// ============================================
export const CONDITION_DICTIONARY: Record<string, string[]> = {
    excellent: [
        // English
        'excellent', 'perfect', 'mint', 'pristine', 'like new',
        // French
        'excellent', 'parfait', 'parfaite', 'impeccable', 'neuve', 'neuf',
        // Arabic
        'ممتاز', 'ممتازة', 'نظيف', 'نظيفة', 'زوينة', 'كتعجبني', 'توب',
        // Spanish
        'excelente', 'perfecto', 'impecable', 'como nuevo'
    ],
    good: [
        // English
        'good', 'nice', 'clean', 'well maintained',
        // French
        'bon', 'bonne', 'bien', 'propre', 'bien entretenue',
        // Arabic
        'جيد', 'جيدة', 'مزيان', 'مزيانة', 'لاباس', 'لا بأس',
        // Spanish
        'bueno', 'buena', 'bien', 'buen estado'
    ],
    fair: [
        // English
        'fair', 'average', 'okay', 'ok', 'acceptable',
        // French
        'correct', 'moyenne', 'moyen', 'passable', 'acceptable',
        // Arabic
        'متوسط', 'متوسطة', 'مقبول', 'مقبولة', 'عادي', 'عادية',
        // Spanish
        'aceptable', 'regular', 'medio'
    ],
    poor: [
        // English
        'poor', 'bad', 'rough', 'needs work', 'project',
        // French
        'mauvais', 'mauvaise', 'à réparer', 'en panne',
        // Arabic
        'سيء', 'سيئة', 'خايب', 'خايبة', 'محتاج صلاح',
        // Spanish
        'malo', 'mala', 'mal estado', 'necesita reparación'
    ]
};

// ============================================
// MOROCCAN CITIES (All 12 regions)
// ============================================
export const CITY_DICTIONARY: Record<string, string[]> = {
    // Casablanca-Settat
    'Casablanca': ['casablanca', 'casa', 'الدار البيضاء', 'كازا', 'كازابلانكا', 'البيضاء', 'casablanca'],
    'Mohammedia': ['mohammedia', 'المحمدية', 'mohammédia'],
    'Settat': ['settat', 'سطات', 'ستات'],
    'El Jadida': ['el jadida', 'eljadida', 'الجديدة', 'جديدة', 'mazagan'],
    'Berrechid': ['berrechid', 'برشيد'],
    
    // Rabat-Salé-Kénitra
    'Rabat': ['rabat', 'الرباط', 'رباط'],
    'Salé': ['salé', 'sale', 'سلا'],
    'Kénitra': ['kénitra', 'kenitra', 'القنيطرة', 'قنيطرة'],
    'Témara': ['témara', 'temara', 'تمارة'],
    'Skhirat': ['skhirat', 'الصخيرات'],
    
    // Marrakech-Safi
    'Marrakech': ['marrakech', 'marrakesh', 'مراكش', 'مراكش الحمراء', 'الحمراء'],
    'Safi': ['safi', 'آسفي', 'اسفي'],
    'Essaouira': ['essaouira', 'الصويرة', 'صويرة', 'mogador'],
    'Beni Mellal': ['beni mellal', 'benimellal', 'بني ملال'],
    
    // Fès-Meknès
    'Fès': ['fès', 'fes', 'fez', 'فاس', 'فاس البالي'],
    'Meknès': ['meknès', 'meknes', 'مكناس', 'مكناسة'],
    'Taza': ['taza', 'تازة'],
    'Ifrane': ['ifrane', 'إفران', 'افران'],
    
    // Tanger-Tétouan-Al Hoceïma
    'Tanger': ['tanger', 'tangier', 'طنجة', 'تنجة'],
    'Tétouan': ['tétouan', 'tetouan', 'تطوان'],
    'Al Hoceïma': ['al hoceima', 'alhoceima', 'الحسيمة', 'حسيمة'],
    'Larache': ['larache', 'العرائش', 'عرائش'],
    'Chefchaouen': ['chefchaouen', 'شفشاون', 'شاون'],
    
    // Oriental
    'Oujda': ['oujda', 'وجدة'],
    'Nador': ['nador', 'الناظور', 'ناظور'],
    'Berkane': ['berkane', 'بركان'],
    
    // Béni Mellal-Khénifra
    'Khénifra': ['khénifra', 'khenifra', 'خنيفرة'],
    'Khouribga': ['khouribga', 'خريبكة'],
    
    // Drâa-Tafilalet
    'Errachidia': ['errachidia', 'الراشيدية', 'راشيدية'],
    'Ouarzazate': ['ouarzazate', 'ورزازات'],
    
    // Souss-Massa
    'Agadir': ['agadir', 'أكادير', 'اكادير'],
    'Inezgane': ['inezgane', 'إنزكان', 'انزكان'],
    'Tiznit': ['tiznit', 'تزنيت'],
    'Taroudant': ['taroudant', 'taroudannt', 'تارودانت'],
    
    // Guelmim-Oued Noun
    'Guelmim': ['guelmim', 'كلميم'],
    'Tan-Tan': ['tan-tan', 'tantan', 'طانطان', 'طان طان'],
    
    // Laâyoune-Sakia El Hamra
    'Laâyoune': ['laâyoune', 'laayoune', 'العيون', 'عيون'],
    'Boujdour': ['boujdour', 'بوجدور'],
    
    // Dakhla-Oued Ed Dahab
    'Dakhla': ['dakhla', 'الداخلة', 'داخلة']
};

// ============================================
// DOORS
// ============================================
export const DOORS_DICTIONARY: Record<string, string[]> = {
    '2': ['2', 'two', 'deux', 'اثنين', '٢', 'coupe', 'كوبيه', 'dos', 'بابين', '2 doors', '2 portes', '2 أبواب', '2 بيبان'],
    '3': ['3', 'three', 'trois', 'ثلاثة', '٣', 'tres', 'ثلاث أبواب', '3 doors', '3 portes', '3 أبواب', '3 بيبان'],
    '4': ['4', 'four', 'quatre', 'أربعة', '٤', 'cuatro', 'اربع', 'أربع أبواب', '4 doors', '4 portes', '4 أبواب', '4 بيبان'],
    '5': ['5', 'five', 'cinq', 'خمسة', '٥', 'cinco', 'خمس أبواب', '5 doors', '5 portes', '5 أبواب', '5 بيبان']
};

// ============================================
// ENGINE SIZE (common values in liters)
// ============================================
export const ENGINE_DICTIONARY: Record<string, string[]> = {
    '1.0': ['1.0', '1', '1l', '1 litre', '1 liter', '١', '1.0l', 'one liter'],
    '1.2': ['1.2', '1.2l', '1,2', '1.2 litre', '١.٢'],
    '1.4': ['1.4', '1.4l', '1,4', '1.4 litre', '١.٤'],
    '1.5': ['1.5', '1.5l', '1,5', '1.5 litre', '١.٥', 'dci 1.5'],
    '1.6': ['1.6', '1.6l', '1,6', '1.6 litre', '١.٦', 'hdi 1.6'],
    '1.8': ['1.8', '1.8l', '1,8', '1.8 litre', '١.٨'],
    '2.0': ['2.0', '2', '2l', '2 litre', '2 liter', '٢', '2.0l', 'two liter'],
    '2.2': ['2.2', '2.2l', '2,2', '2.2 litre', '٢.٢'],
    '2.5': ['2.5', '2.5l', '2,5', '2.5 litre', '٢.٥'],
    '3.0': ['3.0', '3', '3l', '3 litre', '٣', 'v6 3.0'],
    '3.5': ['3.5', '3.5l', '3,5', '3.5 litre', '٣.٥'],
    '4.0': ['4.0', '4', '4l', '4 litre', '٤', 'v8 4.0'],
    '5.0': ['5.0', '5', '5l', '5 litre', '٥', 'v8 5.0']
};

// ============================================
// COLORS (Exterior & Interior)
// ============================================
export const COLOR_DICTIONARY: Record<string, string[]> = {
    'white': ['white', 'blanc', 'blanche', 'أبيض', 'بيض', 'blanco', 'bianco'],
    'black': ['black', 'noir', 'noire', 'أسود', 'كحل', 'negro', 'nero'],
    'silver': ['silver', 'argent', 'argenté', 'فضي', 'رمادي فاتح', 'plata', 'plateado'],
    'gray': ['gray', 'grey', 'gris', 'رمادي', 'gris'],
    'red': ['red', 'rouge', 'أحمر', 'حمر', 'rojo', 'rosso'],
    'blue': ['blue', 'bleu', 'bleue', 'أزرق', 'زرق', 'azul', 'blu'],
    'green': ['green', 'vert', 'verte', 'أخضر', 'خضر', 'verde'],
    'yellow': ['yellow', 'jaune', 'أصفر', 'صفر', 'amarillo', 'giallo'],
    'orange': ['orange', 'برتقالي', 'naranja', 'arancione'],
    'brown': ['brown', 'marron', 'brun', 'بني', 'قهوي', 'marrón', 'marrone'],
    'beige': ['beige', 'بيج', 'crème', 'كريمي', 'crema'],
    'gold': ['gold', 'or', 'doré', 'ذهبي', 'oro', 'dorado'],
    'bronze': ['bronze', 'برونزي', 'bronce'],
    'champagne': ['champagne', 'شامبانيا', 'champán'],
    'burgundy': ['burgundy', 'bordeaux', 'عنابي', 'بوردو', 'granate'],
    'navy': ['navy', 'bleu marine', 'أزرق غامق', 'كحلي', 'azul marino'],
    'pearl': ['pearl', 'nacré', 'لؤلؤي', 'perla'],
    'tan': ['tan', 'beige foncé', 'بني فاتح', 'tostado'],
    'cream': ['cream', 'crème', 'كريمي', 'كريم', 'crema']
};

// ============================================
// SEARCH ACTION KEYWORDS (what user wants to do)
// ============================================
export const ACTION_KEYWORDS = {
    buy: ['buy', 'acheter', 'شراء', 'اشري', 'comprar', 'بغيت', 'كنقلب على'],
    sell: ['sell', 'vendre', 'بيع', 'نبيع', 'vender', 'بغيت نبيع'],
    rent: ['rent', 'louer', 'كراء', 'نكري', 'alquilar', 'location']
};

// ============================================
// TYPE DEFINITIONS
// ============================================
export type SearchDictionaryType = 
    | 'fuel' 
    | 'transmission' 
    | 'condition' 
    | 'city' 
    | 'doors' 
    | 'engine' 
    | 'color';

// ============================================
// COMBINED DICTIONARY LOOKUP
// ============================================
const ALL_DICTIONARIES: Record<SearchDictionaryType, Record<string, string[]>> = {
    fuel: FUEL_DICTIONARY,
    transmission: TRANSMISSION_DICTIONARY,
    condition: CONDITION_DICTIONARY,
    city: CITY_DICTIONARY,
    doors: DOORS_DICTIONARY,
    engine: ENGINE_DICTIONARY,
    color: COLOR_DICTIONARY
};

/**
 * Normalize a search query for matching.
 * Removes diacritics, normalizes Arabic letters, lowercases.
 */
export function normalizeForSearch(query: string): string {
    if (!query || typeof query !== 'string') return '';
    
    let normalized = query.trim().toLowerCase();
    
    // Normalize Arabic letters (common variants)
    normalized = normalized
        .replace(/[أإآا]/g, 'ا')  // Normalize alef variants
        .replace(/[ىي]/g, 'ي')   // Normalize ya variants
        .replace(/ة/g, 'ه')       // Normalize ta marbuta
        .replace(/ؤ/g, 'و')       // Normalize waw hamza
        .replace(/ئ/g, 'ي');      // Normalize ya hamza
    
    // Remove diacritics (tashkeel for Arabic, accents for French/Spanish)
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f\u064B-\u065F]/g, '');
    
    // Remove extra whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
}

/**
 * Find the database value for a search term.
 * Returns the canonical DB value or null if not found.
 */
export function findDbValue(query: string, dictType: SearchDictionaryType): string | null {
    const dict = ALL_DICTIONARIES[dictType];
    if (!dict) return null;
    
    const normalizedQuery = normalizeForSearch(query);
    if (!normalizedQuery) return null;
    
    for (const [dbValue, terms] of Object.entries(dict)) {
        const normalizedTerms = terms.map(t => normalizeForSearch(t));
        if (normalizedTerms.some(t => t === normalizedQuery || t.includes(normalizedQuery) || normalizedQuery.includes(t))) {
            return dbValue;
        }
    }
    
    return null;
}

/**
 * Find all matching DB values for a search term.
 * Useful for partial matches.
 */
export function findAllMatches(query: string, dictType: SearchDictionaryType): string[] {
    const dict = ALL_DICTIONARIES[dictType];
    if (!dict) return [];
    
    const normalizedQuery = normalizeForSearch(query);
    if (!normalizedQuery || normalizedQuery.length < 2) return [];
    
    const matches: string[] = [];
    
    for (const [dbValue, terms] of Object.entries(dict)) {
        const normalizedTerms = terms.map(t => normalizeForSearch(t));
        if (normalizedTerms.some(t => t.includes(normalizedQuery) || normalizedQuery.includes(t))) {
            matches.push(dbValue);
        }
    }
    
    return Array.from(new Set(matches)); // Remove duplicates
}

/**
 * Search across ALL dictionaries and return categorized matches.
 * This is the main function for unified search.
 */
export function searchAllDictionaries(query: string): Record<SearchDictionaryType, string[]> {
    const results: Record<SearchDictionaryType, string[]> = {
        fuel: [],
        transmission: [],
        condition: [],
        city: [],
        doors: [],
        engine: [],
        color: []
    };
    
    const normalizedQuery = normalizeForSearch(query);
    if (!normalizedQuery || normalizedQuery.length < 1) return results;
    
    for (const dictType of Object.keys(ALL_DICTIONARIES) as SearchDictionaryType[]) {
        results[dictType] = findAllMatches(query, dictType);
    }
    
    return results;
}

/**
 * Get display label for a DB value in a specific language.
 */
export function getDisplayLabel(dbValue: string, dictType: SearchDictionaryType, lang: 'en' | 'fr' | 'ar' | 'es' = 'en'): string {
    const dict = ALL_DICTIONARIES[dictType];
    if (!dict || !dict[dbValue]) return dbValue;
    
    const terms = dict[dbValue];
    
    // Find the appropriate term based on language position in array
    // Arrays are structured: [en terms..., fr terms..., ar terms..., es terms...]
    // For simplicity, just return a user-friendly version
    switch (lang) {
        case 'ar':
            // Find first Arabic term (contains Arabic characters)
            return terms.find(t => /[\u0600-\u06FF]/.test(t)) || dbValue;
        case 'fr':
            // For French cities, use the one with accents
            return terms.find(t => /[éèêëàâùûîïôç]/i.test(t)) || terms[0] || dbValue;
        case 'es':
            // For Spanish, use the one with Spanish accents
            return terms.find(t => /[áéíóúñ]/i.test(t)) || terms[0] || dbValue;
        default:
            return terms[0] || dbValue;
    }
}

// ============================================
// NUMERIC SEARCH PATTERNS
// ============================================

/**
 * Keywords that indicate price search (multilingual)
 */
const PRICE_KEYWORDS = [
    'درهم', 'dh', 'mad', 'dirhams', 'dirham', 'prix', 'price', 'سعر', 'ثمن', 'precio',
    'moins de', 'less than', 'under', 'أقل من', 'اقل من', 'تحت',
    'plus de', 'more than', 'over', 'أكثر من', 'اكثر من', 'فوق'
];

/**
 * Keywords that indicate mileage search (multilingual)
 */
const MILEAGE_KEYWORDS = [
    'km', 'كلم', 'كيلو', 'كيلومتر', 'kilomètre', 'kilometer', 'mileage', 'miles',
    'kilométrage', 'kilometraje'
];

/**
 * Keywords that indicate engine size search (multilingual)
 */
const ENGINE_KEYWORDS = [
    'l', 'لتر', 'litre', 'liter', 'cc', 'سي سي', 'cylindrée', 'cilindrada', 'engine'
];

export interface NumericSearchResult {
    type: 'price' | 'mileage' | 'engine' | 'year' | 'unknown';
    value: number;
    operator: 'eq' | 'lte' | 'gte' | 'range';
    maxValue?: number;
}

/**
 * Extract numeric values and their context from search query.
 * Handles patterns like:
 * - "50000 درهم" → price around 50000
 * - "100000 كلم" → mileage around 100000  
 * - "1.6 لتر" → engine size 1.6
 * - "2020" → year 2020
 * - "moins de 100000" → price less than 100000
 */
export function parseNumericSearch(query: string): NumericSearchResult | null {
    if (!query || typeof query !== 'string') return null;
    
    const normalized = query.trim().toLowerCase();
    
    // Extract all numbers (including decimals)
    const numbers = normalized.match(/[\d.,]+/g);
    if (!numbers || numbers.length === 0) return null;
    
    // Parse the first number
    const numStr = numbers[0].replace(',', '.');
    const value = parseFloat(numStr);
    if (isNaN(value)) return null;
    
    // Determine operator (less than, more than, etc.)
    let operator: 'eq' | 'lte' | 'gte' = 'eq';
    const lessThanPatterns = ['moins', 'less', 'under', 'أقل', 'اقل', 'تحت', 'max', 'jusqu'];
    const moreThanPatterns = ['plus', 'more', 'over', 'أكثر', 'اكثر', 'فوق', 'min', 'partir'];
    
    if (lessThanPatterns.some(p => normalized.includes(p))) {
        operator = 'lte';
    } else if (moreThanPatterns.some(p => normalized.includes(p))) {
        operator = 'gte';
    }
    
    // Determine type based on keywords and value characteristics
    
    // Check for year (1900-2100)
    if (value >= 1900 && value <= 2100 && Number.isInteger(value) && numbers[0].length === 4) {
        return { type: 'year', value, operator };
    }
    
    // Check for engine size (0.8 - 8.0, usually with decimal)
    if (value >= 0.8 && value <= 8.0 && (numStr.includes('.') || ENGINE_KEYWORDS.some(k => normalized.includes(k)))) {
        return { type: 'engine', value, operator };
    }
    
    // Check for mileage keywords
    if (MILEAGE_KEYWORDS.some(k => normalized.includes(k))) {
        return { type: 'mileage', value, operator };
    }
    
    // Check for price keywords
    if (PRICE_KEYWORDS.some(k => normalized.includes(k))) {
        return { type: 'price', value, operator };
    }
    
    // Infer from value range
    if (value >= 1000 && value <= 500000) {
        // Could be mileage (1000-500000 km) or price (1000-500000 MAD)
        // Default to price if no other context
        return { type: 'price', value, operator };
    }
    
    if (value >= 500000) {
        // Likely price for expensive cars
        return { type: 'price', value, operator };
    }
    
    return null;
}
