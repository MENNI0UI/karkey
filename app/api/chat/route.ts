/**
 * Chat API Route
 * 
 * Handles chat with Groq LLM and vehicle search.
 * Features:
 * - Rate limiting per user
 * - Language detection from request
 * - AI-powered search intent extraction
 * - Streaming responses
 */

import { streamText, generateText } from 'ai';
import { groq, AI_CONFIG } from '@/lib/ai/config';
import { getSystemPrompt } from '@/lib/ai/system-prompt';
import { searchVehicles } from '@/lib/ai/tools';
import { isRateLimited, getIp } from '@/lib/rate-limiter';

// Rate limit config for chat
const CHAT_RATE_LIMIT = {
    limit: 30,
    windowMs: 60 * 1000, // 30 requests per minute
};

// Search intent type
interface SearchIntent {
    isSearchRequest: boolean;
    make?: string;
    model?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
    transmission?: 'automatic' | 'manual';
    minYear?: number;
    maxYear?: number;
    maxEngineSize?: number;
    minEngineSize?: number;
    maxMileage?: number;
    minMileage?: number;
    doors?: string;
    exteriorColor?: string;
    vehicleCondition?: string;
    sortBy?: 'price' | 'year' | 'mileage' | 'created_at';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
}

// Keywords that indicate car search
const SEARCH_KEYWORDS = [
    // English
    'car', 'cars', 'vehicle', 'vehicles', 'find', 'search', 'looking', 'want', 'need', 'show', 'get', 'buy',
    // Arabic + Darija
    'سيارة', 'سيارات', 'طوموبيل', 'طونوبيل', 'كار', 'بغيت', 'كنقلب', 'ابحث', 'أريد', 'اريد', 'عندكم', 'شوف', 'ورني',
    // French
    'voiture', 'voitures', 'cherche', 'trouver', 'voudrais', 'veux', 'je veux', 'acheter', 'auto', 'autos',
    // Spanish
    'coche', 'coches', 'busco', 'quiero', 'buscar',
    // Car brands (including Arabic)
    'toyota', 'تويوتا', 'bmw', 'بي ام', 'بيام', 'mercedes', 'مرسيدس', 'audi', 'أودي', 'اودي',
    'volkswagen', 'vw', 'فولكس', 'golf', 'renault', 'رونو', 'رينو', 'peugeot', 'بوجو', 'بيجو',
    'dacia', 'داسيا', 'داكيا', 'hyundai', 'هيونداي', 'kia', 'كيا', 'ford', 'فورد',
    'nissan', 'نيسان', 'honda', 'هوندا', 'opel', 'اوبل', 'fiat', 'فيات', 'citroen', 'سيتروين',
    'seat', 'سيات', 'skoda', 'سكودا', 'mazda', 'مازدا', 'porsche', 'بورش', 'lexus', 'لكزس',
    'jeep', 'جيب', 'land rover', 'لاند روفر', 'volvo', 'فولفو',
    // Models
    'corolla', 'كورولا', 'clio', 'كليو', 'logan', 'لوغان', 'sandero', 'سانديرو',
    'polo', 'بولو', 'serie', 'megane', 'ميغان', 'duster', 'داستر', 'tucson', 'توكسون', 'sportage', 'سبورتاج',
    // Fuel
    'diesel', 'essence', 'بنزين', 'ديزل', 'مازوط', 'gasoline', 'petrol', 'electric', 'كهربائي', 'كهربائية', 'hybrid', 'هجين', 'اصانص', 'لصنص', 'l\'essence',
    // Transmission
    'automatic', 'أوتوماتيك', 'اوتوماتيك', 'اوتوماتيكية', 'أوتو', 'اوتو',
    'manual', 'يدوي', 'يدوية', 'عادي', 'عادية', 'automatique', 'manuelle',
    // Price
    'dh', 'درهم', 'mad', 'price', 'ثمن', 'prix', 'cheap', 'رخيص', 'moins cher', 'budget', 'ارخص', 'أرخص', 'أغلى', 'اغلى', 'اغلى من', 'cher', 'expensive', 'plus cher', 'أعلى', 'اعلى',
    // Condition
    'جيدة', 'جيد', 'نظيفة', 'نظيف', 'ممتازة', 'ممتاز', 'clean', 'good', 'excellent', 'propre', 'bonne',
    // Mileage
    'كم', 'كيلو', 'km', 'mileage', 'kilometre', 'kilométrage',
    // Year - detect year searches
    'model', 'modele', 'موديل', 'year', 'année', 'سنة', '2024', '2023', '2022', '2021', '2020',
    '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010',
    '2009', '2008', '2007', '2006', '2005', '2004', '2003', '2002', '2001', '2000',
    // Engine
    'engine', 'محرك', 'moteur', '0.5', '1.0', '1.2', '1.4', '1.6', '2.0', '2.5', '3.0',
    // Moroccan Cities (Arabic) - trigger location search
    'كازا', 'الدار البيضاء', 'الرباط', 'مراكش', 'طنجة', 'فاس', 'أكادير', 'مكناس', 'وجدة', 'القنيطرة', 'تطوان', 'آسفي', 'المحمدية', 'الجديدة',
    // Cities (French/English)
    'casablanca', 'rabat', 'marrakech', 'tangier', 'tanger', 'fes', 'agadir', 'meknes', 'oujda',
    // Colors (Arabic)
    'أبيض', 'بيضاء', 'أسود', 'سوداء', 'أحمر', 'حمراء', 'أزرق', 'زرقاء', 'أخضر', 'خضراء',
    'رمادي', 'فضي', 'ذهبي', 'بني', 'بيج', 'برتقالي', 'أصفر', 'عنابي', 'كحلي',
    // Colors (French)
    'blanc', 'blanche', 'noir', 'noire', 'rouge', 'bleu', 'bleue', 'vert', 'verte', 'gris', 'grise', 'argent', 'doré', 'marron', 'bordeaux',
    // Colors (English)
    'white', 'black', 'red', 'blue', 'green', 'gray', 'grey', 'silver', 'gold', 'brown', 'beige', 'orange', 'purple', 'burgundy',
    // Doors
    'أبواب', 'باب', 'portes', 'porte', 'doors', 'door', 'puertas'
];

// Check if message is a search request
function isSearchMessage(msg: string): boolean {
    const lower = msg.toLowerCase();

    // First check exact keywords
    if (SEARCH_KEYWORDS.some(kw => lower.includes(kw) || msg.includes(kw))) {
        return true;
    }

    // Also check for Arabic text that contains "سيارات" pattern
    if (msg.includes('سيارات') || msg.includes('سيارة')) {
        return true;
    }

    return false;
}

// Check if user is asking about total count of cars
function isCountQuestion(msg: string): boolean {
    const lower = msg.toLowerCase();
    const countPatterns = [
        // English
        'how many', 'total cars', 'total vehicles', 'count',
        // French
        'combien', 'nombre de', 'total de voitures',
        // Arabic
        'كم عدد', 'كم سيارة', 'عدد السيارات', 'كم من سيارة', 'شحال من', 'المتواجدة',
        // Spanish
        'cuántos', 'cuantos', 'total de coches'
    ];
    return countPatterns.some(p => lower.includes(p));
}

// Check if user is asking about Karkey brand itself (not searching for cars)
function isBrandQuestion(msg: string): boolean {
    const lower = msg.toLowerCase();
    // Patterns that indicate questions about the brand/platform itself
    const brandPatterns = [
        // Arabic variations of "Karkey" with context words
        'كاركي و ليست', 'كركي و ليست', 'ليست كاركي', 'ليست كركي',
        'ما هي كاركي', 'ما هي كركي', 'شنو كاركي', 'شنو كركي',
        'ما هو كاركي', 'اش هي كاركي', 'واش كاركي', 'كيفاش كاركي',
        // English
        'what is karkey', 'about karkey', 'tell me about karkey',
        // French
        "qu'est-ce que karkey", 'parlez-moi de karkey', 'c\'est quoi karkey',
        // Spanish
        'qué es karkey', 'sobre karkey'
    ];
    return brandPatterns.some(p => lower.includes(p));
}

// Get total count of all available cars
async function getTotalCarCount(): Promise<number> {
    const { searchVehicles } = await import('@/lib/ai/tools');
    const result = await searchVehicles({ limit: 1 });
    return result.count;
}

// Location mappings for multilingual search (Arabic/Darija → Database name)
const LOCATION_MAP: Record<string, string[]> = {
    'Casablanca': ['casablanca', 'casa', 'كازا', 'الدار البيضاء', 'كازابلانكا', 'البيضاء', 'دار البيضاء'],
    'Rabat': ['rabat', 'الرباط', 'رباط'],
    'Marrakech': ['marrakech', 'marrakesh', 'مراكش', 'مراكش الحمراء'],
    'Tangier': ['tanger', 'tangier', 'طنجة', 'تنجة', 'طانجة'],
    'Fes': ['fès', 'fes', 'fez', 'فاس', 'فاس البالي'],
    'Agadir': ['agadir', 'أكادير', 'اكادير'],
    'Meknes': ['meknès', 'meknes', 'مكناس', 'مكناسة'],
    'Oujda': ['oujda', 'وجدة'],
    'Kenitra': ['kenitra', 'kénitra', 'القنيطرة', 'قنيطرة'],
    'Tetouan': ['tétouan', 'tetouan', 'تطوان'],
    'Safi': ['safi', 'آسفي', 'اسفي', 'صافي'],
    'Mohammedia': ['mohammedia', 'المحمدية', 'محمدية'],
    'El Jadida': ['el jadida', 'eljadida', 'الجديدة', 'جديدة'],
    'Beni Mellal': ['beni mellal', 'benimellal', 'بني ملال'],
    'Nador': ['nador', 'الناظور', 'ناظور'],
    'Taza': ['taza', 'تازة'],
    'Settat': ['settat', 'سطات'],
    'Berrechid': ['berrechid', 'برشيد'],
    'Khemisset': ['khemisset', 'الخميسات', 'خميسات'],
    'Errachidia': ['errachidia', 'الراشيدية', 'راشيدية'],
    'Laayoune': ['laâyoune', 'laayoune', 'العيون', 'عيون'],
    'Dakhla': ['dakhla', 'الداخلة', 'داخلة'],
    'Guelmim': ['guelmim', 'كلميم'],
    'Al Hoceima': ['al hoceima', 'alhoceima', 'الحسيمة', 'حسيمة'],
    'Larache': ['larache', 'العرائش', 'عرائش'],
    'Khouribga': ['khouribga', 'خريبكة'],
    'Ouarzazate': ['ouarzazate', 'ورزازات'],
    'Temara': ['témara', 'temara', 'تمارة'],
    'Sale': ['salé', 'sale', 'سلا'],
};

// Extract location from text using multilingual mappings
function extractLocationFromText(text: string): string | undefined {
    const lower = text.toLowerCase();
    for (const [dbName, aliases] of Object.entries(LOCATION_MAP)) {
        for (const alias of aliases) {
            if (lower.includes(alias.toLowerCase())) {
                return dbName;
            }
        }
    }
    return undefined;
}

// Extract year directly from text (fallback when AI fails)
// Extract year from text (ranges and exact years)
// Extract year from text (ranges and exact years)
function extractYearFromText(text: string): { minYear?: number; maxYear?: number } {
    const result: { minYear?: number; maxYear?: number } = {};
    const currentYear = new Date().getFullYear();
    const maxValidYear = currentYear + 2;
    const minValidYear = 1980;

    // Range patterns with global flag
    const rangePatterns = [
        /(?:بين|entre|between|from|de|من)\s*(\d{4})\s*(?:و|et|and|to|à|[-–])\s*(\d{4})/g,
    ];

    for (const pattern of rangePatterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const y1 = parseInt(match[1], 10);
            const y2 = parseInt(match[2], 10);
            // Validation
            if (y1 >= minValidYear && y1 <= maxValidYear && y2 >= minValidYear && y2 <= maxValidYear) {
                result.minYear = Math.min(y1, y2);
                result.maxYear = Math.max(y1, y2);
                console.log('[Year Extract] Valid range found:', result.minYear, '-', result.maxYear);
                return result;
            }
        }
    }

    // Single Year fallback
    const singleYearMatches = text.matchAll(/\b(\d{4})\b/g);
    for (const match of singleYearMatches) {
        const year = parseInt(match[1], 10);
        if (year >= 1980 && year <= maxValidYear) {
            return { minYear: year, maxYear: year };
        }
    }

    return result;
}

// Helper function to parse a single price from text
function parseSinglePrice(text: string): number | null {
    // Try European format first (235.000)
    const euroMatch = text.match(/(\d{1,3})[.,](\d{3})(?:[.,](\d{3}))?/);
    if (euroMatch) {
        const whole = euroMatch[1];
        const thousands = euroMatch[2];
        const millions = euroMatch[3];
        if (millions) {
            return parseInt(whole + thousands + millions, 10);
        } else {
            return parseInt(whole + thousands, 10);
        }
    }

    // Try k format (235k)
    const kMatch = text.match(/(\d{1,4})\s*[kK]/);
    if (kMatch) {
        return parseInt(kMatch[1], 10) * 1000;
    }

    // Try plain number (must be at least 5 digits to be a price)
    const plainMatch = text.match(/\b(\d{5,7})\b/);
    if (plainMatch) {
        return parseInt(plainMatch[1], 10);
    }

    // Try smaller number (could be in thousands context)
    const smallMatch = text.match(/\b(\d{1,3})\b/);
    if (smallMatch) {
        const num = parseInt(smallMatch[1], 10);
        // filter out single digits (likely engine size or doors) -> min 10 (10,000)
        if (num >= 10 && num <= 999) {
            return num * 1000;
        }
    }

    return null;
}

// Extract price from text (handles various formats)
function extractPriceFromText(text: string): { minPrice?: number; maxPrice?: number; exactPrice?: number } {
    const lower = text.toLowerCase();

    // Range patterns with global flag
    const betweenPatterns = [
        /بين\s*(\d[\d.,]*)\s*(?:و|إلى|الى|-)\s*(\d[\d.,]*)/g,
        /entre\s*(\d[\d.,]*)\s*(?:et|à|a|-)\s*(\d[\d.,]*)/g,
        /between\s*(\d[\d.,]*)\s*(?:and|to|-)\s*(\d[\d.,]*)/g,
        /(?:from|de|من)\s*(\d[\d.,]*)\s*(?:to|à|a|إلى|الى|-)\s*(\d[\d.,]*)/g,
    ];

    for (const pattern of betweenPatterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const price1 = parseSinglePrice(match[1]);
            const price2 = parseSinglePrice(match[2]);
            if (price1 !== null && price2 !== null) {
                const minP = Math.min(price1, price2);
                const maxP = Math.max(price1, price2);
                console.log('[Price Extract] Valid range found:', minP, 'to', maxP);
                return { minPrice: minP > 0 ? minP : undefined, maxPrice: maxP };
            }
        }
    }

    // Check for "exact" price indicators
    const exactIndicators = ['بالظبط', 'بالضبط', 'exactly', 'exactement', 'exact', 'تماما', 'تحديدا'];
    const isExact = exactIndicators.some(ind => lower.includes(ind));

    // Extract single price
    let price: number | null = null;

    // Try European format first (235.000)
    const euroMatch = text.match(/(\d{1,3})[.,](\d{3})(?:[.,](\d{3}))?/);
    if (euroMatch) {
        // 235.000 → 235000
        const whole = euroMatch[1];
        const thousands = euroMatch[2];
        const millions = euroMatch[3];
        if (millions) {
            price = parseInt(whole + thousands + millions, 10);
        } else {
            price = parseInt(whole + thousands, 10);
        }
    }

    // Try k format (235k)
    if (!price) {
        const kMatch = text.match(/(\d{1,4})\s*[kK]/);
        if (kMatch) {
            price = parseInt(kMatch[1], 10) * 1000;
        }
    }

    // Try plain number (must be at least 10000 to be a price)
    if (!price) {
        const plainMatch = text.match(/\b(\d{5,7})\b/);
        if (plainMatch) {
            price = parseInt(plainMatch[1], 10);
        }
    }

    if (!price) return {};

    // If exact price requested, set both min and max to same value with small tolerance
    if (isExact) {
        return { minPrice: price - 1000, maxPrice: price + 1000, exactPrice: price };
    }

    // Check for "less than" or "under" indicators
    const underIndicators = ['moins de', 'under', 'below', 'اقل من', 'أقل من', 'تحت', 'maximum', 'max'];
    const isUnder = underIndicators.some(ind => lower.includes(ind));
    if (isUnder) {
        return { maxPrice: price };
    }

    // Check for "more than" or "above" indicators
    const overIndicators = ['plus de', 'above', 'over', 'اكثر من', 'أكثر من', 'فوق', 'minimum', 'min'];
    const isOver = overIndicators.some(ind => lower.includes(ind));
    if (isOver) {
        return { minPrice: price };
    }

    // Default: treat as approximate (±10%)
    return { minPrice: Math.floor(price * 0.9), maxPrice: Math.ceil(price * 1.1) };
}

// Extract fuel type from text
function extractFuelTypeFromText(text: string): string | undefined {
    const fuelMap: Record<string, string[]> = {
        'diesel': ['diesel', 'ديزل', 'مازوط', 'mazout', 'gasoil', 'ديزال', 'dizal'],
        'gasoline': ['gasoline', 'essence', 'بنزين', 'petrol', 'benzine', 'gas', 'اسانس', 'سانس', 'اصانص', 'لصنص', 'l\'essence', 'sans plomb'],
        'electric': ['electric', 'électrique', 'كهربائي', 'كهربائية', 'كهرباء', 'eléctrico', 'الكتريك'],
        'hybrid': ['hybrid', 'hybride', 'هجين', 'هجينة', 'هايبرد', 'híbrido'],
        'lpg': ['lpg', 'gpl', 'غاز', 'gas naturel'],
    };

    for (const [fuelType, aliases] of Object.entries(fuelMap)) {
        for (const alias of aliases) {
            if (text.includes(alias) || text.toLowerCase().includes(alias.toLowerCase())) {
                return fuelType;
            }
        }
    }
    return undefined;
}

// Extract transmission from text
function extractTransmissionFromText(text: string): string | undefined {
    const transmissionMap: Record<string, string[]> = {
        'automatic': ['automatic', 'automatique', 'أوتوماتيك', 'اوتوماتيك', 'اوتوماتيكية', 'أوتوماتيكية', 'اتوماتيك', 'اتوماتيكية', 'أوتو', 'اوتو', 'auto', 'bva', 'boite auto'],
        'manual': ['manual', 'manuelle', 'يدوي', 'يدوية', 'عادي', 'عادية', 'مانويل', 'stick', 'bvm', 'boite manuelle'],
    };

    for (const [transmission, aliases] of Object.entries(transmissionMap)) {
        for (const alias of aliases) {
            if (text.includes(alias) || text.toLowerCase().includes(alias.toLowerCase())) {
                return transmission;
            }
        }
    }
    return undefined;
}

// Extract make from text (common car brands with Arabic support)
function extractMakeFromText(text: string): string | undefined {
    // Map of makes with their variations (Arabic, French, Moroccan Darija, common misspellings)
    const makeMap: Record<string, string[]> = {
        'Toyota': ['toyota', 'تويوتا', 'طويوطا', 'طيوطا'],
        'BMW': ['bmw', 'بي ام', 'بي ام دبليو', 'بيام', 'بي إم', 'بمو'],
        'Mercedes': ['mercedes', 'mercedes-benz', 'مرسيدس', 'مارسيدس', 'ميرسيدس'],
        'Audi': ['audi', 'أودي', 'اودي'],
        'Volkswagen': ['volkswagen', 'vw', 'فولكس', 'فولكسفاجن', 'فولكسفاغن', 'فولسفاكن'],
        'Renault': ['renault', 'رونو', 'رينو', 'رينولت'],
        'Peugeot': ['peugeot', 'بوجو', 'بيجو', 'بيجوت', 'بوجوت'],
        'Dacia': ['dacia', 'داسيا', 'داتشيا', 'داكيا'],
        'Hyundai': ['hyundai', 'هيونداي', 'هيوندي', 'هونداي'],
        'Kia': ['kia', 'كيا'],
        'Ford': ['ford', 'فورد'],
        'Nissan': ['nissan', 'نيسان'],
        'Honda': ['honda', 'هوندا'],
        'Opel': ['opel', 'أوبل', 'اوبل'],
        'Fiat': ['fiat', 'فيات'],
        'Citroen': ['citroen', 'citroën', 'سيتروين', 'ستروين'],
        'Seat': ['seat', 'سيات'],
        'Skoda': ['skoda', 'škoda', 'سكودا'],
        'Mazda': ['mazda', 'مازدا'],
        'Mitsubishi': ['mitsubishi', 'ميتسوبيشي', 'ميتسوبيتشي'],
        'Suzuki': ['suzuki', 'سوزوكي'],
        'Lexus': ['lexus', 'لكزس', 'لكسس'],
        'Porsche': ['porsche', 'بورش', 'بورشه'],
        'Jaguar': ['jaguar', 'جاكوار', 'جاغوار'],
        'Land Rover': ['land rover', 'لاند روفر', 'لاندروفر'],
        'Jeep': ['jeep', 'جيب'],
        'Chevrolet': ['chevrolet', 'chevy', 'شيفروليه', 'شيفرولي'],
        'Volvo': ['volvo', 'فولفو'],
        'Mini': ['mini', 'ميني'],
        'Alfa Romeo': ['alfa romeo', 'alfa', 'الفا روميو'],
        'Saab': ['saab', 'ساب'],
    };

    const lower = text.toLowerCase();
    for (const [make, aliases] of Object.entries(makeMap)) {
        for (const alias of aliases) {
            if (lower.includes(alias) || text.includes(alias)) {
                return make;
            }
        }
    }
    return undefined;
}

// Extract mileage from text (km, كم)
// IMPORTANT: Use exact values - 150 km means 150 km, not 150,000
function extractMileageFromText(text: string): { maxMileage?: number; minMileage?: number } {
    const result: { maxMileage?: number; minMileage?: number } = {};

    // Helper to parse number from string (handles thousand separators)
    const parseNumber = (str: string): number => {
        let valueStr = str.replace(/\s/g, '');
        // Check if it's formatted with thousand separators
        if (valueStr.includes('.') && valueStr.split('.')[1]?.length === 3) {
            // "150.000" format (European thousand separator)
            valueStr = valueStr.replace(/\./g, '');
        } else if (valueStr.includes(',') && valueStr.split(',')[1]?.length === 3) {
            // "150,000" format (US thousand separator)
            valueStr = valueStr.replace(/,/g, '');
        }
        return parseFloat(valueStr) || 0;
    };

    // FIRST: Check for "between X and Y" pattern (بين X و Y)
    const betweenPatterns = [
        /(?:بين|entre|between)\s*(\d+[\d\s.,]*)\s*(?:كم|km|كيلو)?\s*(?:و|et|and|[-–])\s*(\d+[\d\s.,]*)\s*(?:كم|km|كيلو)/i,
        /(?:من|from|de)\s*(\d+[\d\s.,]*)\s*(?:كم|km)?\s*(?:إلى|الى|to|à|jusqu'à)\s*(\d+[\d\s.,]*)\s*(?:كم|km)/i,
    ];

    for (const pattern of betweenPatterns) {
        const match = text.match(pattern);
        if (match) {
            const min = parseNumber(match[1]);
            const max = parseNumber(match[2]);
            if (min > 0 && max > 0) {
                result.minMileage = Math.min(min, max);
                result.maxMileage = Math.max(min, max);
                return result;
            }
        }
    }

    // Patterns for "less than X km" in multiple languages
    const lessThanPatterns = [
        /(?:أقل|اقل|moins|under|below|less)\s*(?:من|de|than)?\s*(\d+[\d\s.,]*)\s*(?:كم|km|كيلو|kilo|kilometre|كيلومتر)/i,
        /(\d+[\d\s.,]*)\s*(?:كم|km|كيلو)\s*(?:أو أقل|او اقل|ou moins|or less)/i,
        /max(?:imum)?\s*(\d+[\d\s.,]*)\s*(?:كم|km)/i,
    ];

    // Patterns for "more than X km" - added "اكبر" (without hamza)
    const moreThanPatterns = [
        /(?:أكثر|اكثر|أكبر|اكبر|plus|over|above|more)\s*(?:من|de|than)?\s*(\d+[\d\s.,]*)\s*(?:كم|km|كيلو)/i,
        /(\d+[\d\s.,]*)\s*(?:كم|km)\s*(?:أو أكثر|او اكثر|او اكبر|ou plus|or more)/i,
        /min(?:imum)?\s*(\d+[\d\s.,]*)\s*(?:كم|km)/i,
    ];

    for (const pattern of lessThanPatterns) {
        const match = text.match(pattern);
        if (match) {
            const value = parseNumber(match[1]);
            if (value > 0) {
                result.maxMileage = value;
                break;
            }
        }
    }

    for (const pattern of moreThanPatterns) {
        const match = text.match(pattern);
        if (match) {
            const value = parseNumber(match[1]);
            if (value > 0) {
                result.minMileage = value;
                break;
            }
        }
    }

    return result;
}

// Extract vehicle condition from text
function extractConditionFromText(text: string): string | undefined {
    const conditionMap: Record<string, string[]> = {
        'excellent': ['excellent', 'ممتازة', 'ممتاز', 'excellente', 'parfait', 'parfaite', 'perfect', 'جديدة', 'جديد', 'new', 'neuf', 'neuve'],
        'good': ['good', 'جيدة', 'جيد', 'نظيفة', 'نظيف', 'bonne', 'bon', 'propre', 'clean', 'bien'],
        'fair': ['fair', 'مقبولة', 'مقبول', 'moyenne', 'acceptable', 'متوسطة', 'okay', 'ok'],
        'poor': ['poor', 'سيئة', 'سيء', 'mauvais', 'mauvaise', 'bad'],
    };

    const lower = text.toLowerCase();
    for (const [condition, aliases] of Object.entries(conditionMap)) {
        for (const alias of aliases) {
            if (lower.includes(alias) || text.includes(alias)) {
                return condition;
            }
        }
    }
    return undefined;
}

// Extract exterior color from text (Arabic, French, English, Spanish, Darija)
function extractColorFromText(text: string): string | undefined {
    const colorMap: Record<string, string[]> = {
        'white': ['white', 'blanc', 'blanche', 'أبيض', 'بيضاء', 'بيض', 'ابيض', 'blanco', 'blanca'],
        'black': ['black', 'noir', 'noire', 'أسود', 'سوداء', 'سودة', 'كحل', 'كحلي', 'كحلية', 'negro', 'negra'],
        'gray': ['gray', 'grey', 'gris', 'grise', 'رمادي', 'رمادية', 'قريزي', 'grise'],
        'silver': ['silver', 'argent', 'argenté', 'argentée', 'فضي', 'فضية', 'plateado', 'plateada'],
        'red': ['red', 'rouge', 'أحمر', 'حمراء', 'حمر', 'احمر', 'rojo', 'roja'],
        'blue': ['blue', 'bleu', 'bleue', 'أزرق', 'زرقاء', 'زرق', 'ازرق', 'azul'],
        'brown': ['brown', 'marron', 'brun', 'brune', 'بني', 'بنية', 'marrón'],
        'beige': ['beige', 'بيج', 'بيجي'],
        'green': ['green', 'vert', 'verte', 'أخضر', 'خضراء', 'خضر', 'اخضر', 'verde'],
        'gold': ['gold', 'doré', 'dorée', 'ذهبي', 'ذهبية', 'dorado', 'dorada'],
        'yellow': ['yellow', 'jaune', 'أصفر', 'صفراء', 'صفر', 'amarillo', 'amarilla'],
        'orange': ['orange', 'برتقالي', 'برتقالية', 'naranja'],
        'purple': ['purple', 'violet', 'violette', 'أرجواني', 'بنفسجي', 'بنفسجية', 'morado', 'morada'],
        'bronze': ['bronze', 'برونزي', 'برونزية'],
        'burgundy': ['burgundy', 'bordeaux', 'عنابي', 'عنابية', 'burdeos'],
        'champagne': ['champagne', 'شامبانيا', 'شامبين'],
        'teal': ['teal', 'turquoise', 'أزرق مخضر', 'تركواز'],
    };

    const lower = text.toLowerCase();
    for (const [color, aliases] of Object.entries(colorMap)) {
        for (const alias of aliases) {
            if (lower.includes(alias) || text.includes(alias)) {
                return color;
            }
        }
    }
    return undefined;
}

// Extract number of doors from text
function extractDoorsFromText(text: string): string | undefined {
    const doorsPatterns = [
        // Arabic: 2 أبواب، 4 أبواب، ثلاث أبواب
        { regex: /(\d)\s*(?:أبواب|باب|بيبان)/i, extract: (m: RegExpMatchArray) => m[1] },
        { regex: /(?:ثنائي|اثنين|جوج)\s*(?:أبواب|باب)/i, extract: () => '2' },
        { regex: /(?:ثلاث|ثلاثة|تلاتة)\s*(?:أبواب|باب)/i, extract: () => '3' },
        { regex: /(?:أربع|أربعة|اربع|ربعة)\s*(?:أبواب|باب)/i, extract: () => '4' },
        { regex: /(?:خمس|خمسة|خمسة)\s*(?:أبواب|باب)/i, extract: () => '5' },
        // French: 2 portes, 4 portes
        { regex: /(\d)\s*portes?/i, extract: (m: RegExpMatchArray) => m[1] },
        { regex: /(?:deux|2)\s*portes?/i, extract: () => '2' },
        { regex: /(?:trois|3)\s*portes?/i, extract: () => '3' },
        { regex: /(?:quatre|4)\s*portes?/i, extract: () => '4' },
        { regex: /(?:cinq|5)\s*portes?/i, extract: () => '5' },
        // English: 2 doors, 4-door
        { regex: /(\d)[- ]?doors?/i, extract: (m: RegExpMatchArray) => m[1] },
        { regex: /(?:two|2)[- ]?doors?/i, extract: () => '2' },
        { regex: /(?:three|3)[- ]?doors?/i, extract: () => '3' },
        { regex: /(?:four|4)[- ]?doors?/i, extract: () => '4' },
        { regex: /(?:five|5)[- ]?doors?/i, extract: () => '5' },
        // Spanish: 2 puertas
        { regex: /(\d)\s*puertas?/i, extract: (m: RegExpMatchArray) => m[1] },
    ];

    for (const pattern of doorsPatterns) {
        const match = text.match(pattern.regex);
        if (match) {
            return pattern.extract(match);
        }
    }
    return undefined;
}

// Extract engine size from text (supports "2.0L", "محرك 1.6", "moteur 2.0")
function extractEngineSizeFromText(text: string): { minEngineSize?: number; maxEngineSize?: number } {
    const result: { minEngineSize?: number; maxEngineSize?: number } = {};

    // Check for "less than" patterns
    const lessPatterns = [
        /(?:أقل|اقل|moins|under|below|max(?:imum)?)\s*(?:من|de|than)?\s*([\d.]+)\s*(?:L|لتر|litre|litres|cc)?/i,
    ];

    for (const pattern of lessPatterns) {
        const match = text.match(pattern);
        if (match) {
            result.maxEngineSize = parseFloat(match[1]) + 0.1; // Add tolerance
            break;
        }
    }

    // Check for "more than" patterns
    const morePatterns = [
        /(?:أكثر|اكثر|أكبر|اكبر|plus|over|above|min(?:imum)?)\s*(?:من|de|than)?\s*([\d.]+)\s*(?:L|لتر|litre|litres|cc)?/i,
    ];

    for (const pattern of morePatterns) {
        const match = text.match(pattern);
        if (match) {
            result.minEngineSize = parseFloat(match[1]) - 0.1; // Add tolerance
            break;
        }
    }

    // Check for "between X and Y" patterns
    const betweenPatterns = [
        /(?:بين|entre|between)\s*([\d.]+)\s*(?:و|et|and|to|\-|–)\s*([\d.]+)\s*(?:L|لتر|litre|cc)?/i,
    ];

    for (const pattern of betweenPatterns) {
        const match = text.match(pattern);
        if (match) {
            const v1 = parseFloat(match[1]);
            const v2 = parseFloat(match[2]);

            // VALIDATION: Engine sizes must be realistic (e.g. 0.5 - 12.0)
            // If values are > 12, they are likely prices or mileage, so ignore them
            if (v1 > 12 || v2 > 12) {
                continue;
            }

            result.minEngineSize = Math.min(v1, v2) - 0.1; // Add tolerance
            result.maxEngineSize = Math.max(v1, v2) + 0.1; // Add tolerance
            return result;
        }
    }

    // If no comparison found, look for exact engine size with context
    if (!result.minEngineSize && !result.maxEngineSize) {
        const exactPatterns = [
            // Arabic with preposition: "بمحرك 2.2" or "سيارات بمحرك 2.0"
            /(?:بمحرك|محرك|b?motor)\s*([\d.]+)\s*(?:L|لتر|litre|cc)?/i,
            /(?:moteur|engine)\s*([\d.]+)\s*(?:L|لتر|litre|cc)?/i,
            // Size with unit: "2.2L" or "2.0 لتر"
            /([\d.]+)\s*(?:L|لتر|litres?|cc)\b/i,
        ];

        for (const pattern of exactPatterns) {
            const match = text.match(pattern);
            if (match) {
                const size = parseFloat(match[1]);
                // For exact matches, allow small tolerance
                if (size > 0 && size < 10) {
                    result.minEngineSize = size - 0.1;
                    result.maxEngineSize = size + 0.1;
                    break;
                }
            }
        }
    }

    return result;
}

// Extract car model from text (common models)
function extractModelFromText(text: string): string | undefined {
    // Map of models with their variations
    const modelMap: Record<string, string[]> = {
        // Volkswagen
        'Passat': ['passat', 'باسات'],
        'Golf': ['golf', 'غولف', 'جولف'],
        'Polo': ['polo', 'بولو'],
        'T-Roc': ['t-roc', 'troc', 't roc'],
        'Tiguan': ['tiguan', 'تيغوان'],
        'Touareg': ['touareg', 'طوارق'],
        'Arteon': ['arteon'],
        'Jetta': ['jetta', 'جيتا'],
        // Toyota
        'Corolla': ['corolla', 'كورولا'],
        'Camry': ['camry', 'كامري'],
        'Yaris': ['yaris', 'ياريس'],
        'RAV4': ['rav4', 'rav 4', 'راف4'],
        'Land Cruiser': ['land cruiser', 'لاند كروزر'],
        'Hilux': ['hilux', 'هايلوكس'],
        'C-HR': ['c-hr', 'chr'],
        // BMW
        'Serie 3': ['serie 3', 'series 3', 'سيري 3', '320', '330', '318'],
        'Serie 5': ['serie 5', 'series 5', 'سيري 5', '520', '530', '540'],
        'X1': ['x1'],
        'X3': ['x3'],
        'X5': ['x5'],
        'X6': ['x6'],
        // Mercedes
        'Classe C': ['classe c', 'class c', 'c class', 'c180', 'c200', 'c220', 'c300'],
        'Classe E': ['classe e', 'class e', 'e class', 'e200', 'e220', 'e300'],
        'Classe A': ['classe a', 'class a', 'a class', 'a180', 'a200', 'a250'],
        'GLC': ['glc'],
        'GLE': ['gle'],
        // Renault
        'Clio': ['clio', 'كليو'],
        'Megane': ['megane', 'mégane', 'ميغان'],
        'Captur': ['captur', 'كابتور'],
        'Kadjar': ['kadjar', 'كادجار'],
        'Scenic': ['scenic', 'scénic'],
        // Peugeot
        '208': ['208'],
        '308': ['308'],
        '3008': ['3008'],
        '508': ['508'],
        '5008': ['5008'],
        // Dacia
        'Logan': ['logan', 'لوغان'],
        'Sandero': ['sandero', 'سانديرو'],
        'Duster': ['duster', 'داستر'],
        'Stepway': ['stepway'],
        // Hyundai
        'Tucson': ['tucson', 'توكسون'],
        'Santa Fe': ['santa fe', 'santafe', 'سانتا في'],
        'i10': ['i10', 'i 10'],
        'i20': ['i20', 'i 20'],
        'i30': ['i30', 'i 30'],
        'Accent': ['accent', 'اكسنت'],
        // Kia
        'Sportage': ['sportage', 'سبورتاج'],
        'Sorento': ['sorento', 'سورنتو'],
        'Picanto': ['picanto', 'بيكانتو'],
        'Rio': ['rio', 'ريو'],
        'Ceed': ['ceed', 'سيد'],
        // Honda
        'Civic': ['civic', 'سيفيك'],
        'Accord': ['accord', 'اكورد'],
        'CR-V': ['cr-v', 'crv', 'cr v'],
        'HR-V': ['hr-v', 'hrv'],
        // Ford
        'Focus': ['focus', 'فوكس'],
        'Fiesta': ['fiesta', 'فيستا'],
        'Kuga': ['kuga', 'كوغا'],
        'Mustang': ['mustang', 'موستنج'],
        // Audi
        'A3': ['a3', 'a 3'],
        'A4': ['a4', 'a 4'],
        'A6': ['a6', 'a 6'],
        'Q3': ['q3', 'q 3'],
        'Q5': ['q5', 'q 5'],
        'Q7': ['q7', 'q 7'],
    };

    const lower = text.toLowerCase();
    for (const [model, aliases] of Object.entries(modelMap)) {
        for (const alias of aliases) {
            // Use word boundary for short model names to avoid false matches
            if (alias.length <= 3) {
                const regex = new RegExp(`\\b${alias}\\b`, 'i');
                if (regex.test(lower)) {
                    return model;
                }
            } else if (lower.includes(alias)) {
                return model;
            }
        }
    }
    return undefined;
}

// Extract JSON from AI response - handles markdown code blocks and extra text
function extractJsonFromText(text: string): SearchIntent | null {
    try {
        // Try to find JSON in code block first
        const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
            const parsed = JSON.parse(codeBlockMatch[1]) as SearchIntent;
            parsed.isSearchRequest = true;
            // Filter out empty/zero values
            return cleanIntent(parsed);
        }

        // Try to find raw JSON
        const jsonMatch = text.match(/\{[^{}]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as SearchIntent;
            parsed.isSearchRequest = true;
            return cleanIntent(parsed);
        }
    } catch (e) {
        console.error('[Chat API] JSON parse error:', e);
    }
    return { isSearchRequest: true }; // Default: search with no filters
}

// Remove empty/zero values from intent
function cleanIntent(intent: SearchIntent): SearchIntent {
    const cleaned: SearchIntent = { isSearchRequest: true };

    if (intent.make && intent.make.trim() && intent.make !== '') cleaned.make = intent.make;
    if (intent.model && intent.model.trim() && intent.model !== '') cleaned.model = intent.model;
    if (intent.minPrice && intent.minPrice > 0) cleaned.minPrice = intent.minPrice;
    if (intent.maxPrice && intent.maxPrice > 0) cleaned.maxPrice = intent.maxPrice;
    if (intent.location && intent.location.trim() && intent.location !== '') cleaned.location = intent.location;
    if (intent.fuelType && intent.fuelType.trim()) cleaned.fuelType = intent.fuelType;
    if (intent.transmission && intent.transmission.trim()) cleaned.transmission = intent.transmission;
    if (intent.minYear && intent.minYear > 1900) cleaned.minYear = intent.minYear;
    if (intent.maxYear && intent.maxYear > 1900) cleaned.maxYear = intent.maxYear;
    if (intent.maxEngineSize && intent.maxEngineSize > 0) cleaned.maxEngineSize = intent.maxEngineSize;
    if (intent.minEngineSize && intent.minEngineSize > 0) cleaned.minEngineSize = intent.minEngineSize;
    if (intent.maxMileage && intent.maxMileage > 0) cleaned.maxMileage = intent.maxMileage;
    if (intent.minMileage && intent.minMileage > 0) cleaned.minMileage = intent.minMileage;
    if (intent.doors && intent.doors.trim() && intent.doors !== '') cleaned.doors = intent.doors;
    if (intent.exteriorColor && intent.exteriorColor.trim() && intent.exteriorColor !== '') cleaned.exteriorColor = intent.exteriorColor;
    if (intent.vehicleCondition && intent.vehicleCondition.trim() && intent.vehicleCondition !== '') cleaned.vehicleCondition = intent.vehicleCondition;

    return cleaned;
}

export async function POST(req: Request) {
    try {
        // 1. Rate limiting
        const ip = getIp(req);
        const rateLimited = await isRateLimited(`chat:${ip}`, CHAT_RATE_LIMIT);

        if (rateLimited) {
            return new Response(
                JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 2. Parse request
        const { messages, language = 'en' } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Messages are required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 3. Get last user message and check if it's a search
        const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop();
        let vehicleResults: unknown[] = [];
        let totalVehicleCount = 0; // Store the REAL total count

        // 3.5 Check if user is asking about total car count
        if (lastUserMessage && isCountQuestion(lastUserMessage.content)) {
            console.log('[Chat API] Count question detected:', lastUserMessage.content);
            const totalCount = await getTotalCarCount();
            console.log('[Chat API] Total cars in database:', totalCount);

            const countResponses: Record<string, string[]> = {
                en: [
                    `We currently have **${totalCount} cars** available on Karkey.ma! 🚗✨ Browse them at karkey.ma/${language}/direct-sales`,
                    `Great question! There are **${totalCount} vehicles** waiting for you on our platform! 🎉 Check them out!`,
                    `Right now, we have **${totalCount} cars** listed! 🌟 New cars are added daily. Explore: karkey.ma/${language}/direct-sales`,
                ],
                fr: [
                    `Nous avons actuellement **${totalCount} voitures** disponibles sur Karkey.ma ! 🚗✨ Découvrez-les sur karkey.ma/${language}/direct-sales`,
                    `Excellente question ! Il y a **${totalCount} véhicules** qui vous attendent ! 🎉 Jetez un œil !`,
                    `En ce moment, nous avons **${totalCount} voitures** listées ! 🌟 De nouvelles voitures sont ajoutées chaque jour.`,
                ],
                ar: [
                    `لدينا حالياً **${totalCount} سيارة** متاحة على Karkey.ma! 🚗✨ تصفحها على karkey.ma/${language}/direct-sales`,
                    `سؤال ممتاز! هناك **${totalCount} سيارة** في انتظارك! 🎉 ألقِ نظرة!`,
                    `الآن لدينا **${totalCount} سيارة** معروضة! 🌟 سيارات جديدة تُضاف يومياً.`,
                ],
                es: [
                    `¡Actualmente tenemos **${totalCount} coches** disponibles en Karkey.ma! 🚗✨ Explóralos en karkey.ma/${language}/direct-sales`,
                    `¡Gran pregunta! ¡Hay **${totalCount} vehículos** esperándote! 🎉 ¡Échalos un vistazo!`,
                    `¡Ahora mismo tenemos **${totalCount} coches** listados! 🌟 Se añaden coches nuevos cada día.`,
                ],
            };

            const langResponses = countResponses[language] || countResponses.en;
            const randomResponse = langResponses[Math.floor(Math.random() * langResponses.length)];

            return new Response(randomResponse, {
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
        }

        // 3.6 Check if user is asking about Karkey brand itself
        if (lastUserMessage && isBrandQuestion(lastUserMessage.content)) {
            console.log('[Chat API] Brand question detected:', lastUserMessage.content);

            const brandResponses: Record<string, string[]> = {
                en: [
                    `**Karkey** is Morocco's online vehicle marketplace! 🚗✨ We connect car buyers and sellers across Morocco. You can browse cars at karkey.ma/${language}/direct-sales, join live auctions, or check out our verified Karkey Cars showroom! What would you like to know more about?`,
                    `Great question! **Karkey** (كاركي) is your go-to platform for buying and selling cars in Morocco! 🇲🇦 We offer direct sales, auctions, and verified showroom cars. How can I help you today?`,
                ],
                fr: [
                    `**Karkey** est la marketplace automobile en ligne du Maroc ! 🚗✨ Nous connectons acheteurs et vendeurs de voitures à travers le Maroc. Vous pouvez parcourir les voitures sur karkey.ma/${language}/direct-sales, participer aux enchères en direct, ou découvrir notre showroom Karkey Cars vérifié ! Que souhaitez-vous savoir de plus ?`,
                    `Excellente question ! **Karkey** (كاركي) est votre plateforme pour acheter et vendre des voitures au Maroc ! 🇲🇦 Nous offrons ventes directes, enchères et voitures de showroom vérifiées. Comment puis-je vous aider ?`,
                ],
                ar: [
                    `**كاركي (Karkey)** هي منصة السيارات الإلكترونية في المغرب! 🚗✨ نربط بين مشتري وبائعي السيارات في جميع أنحاء المغرب. يمكنك تصفح السيارات على karkey.ma/${language}/direct-sales، المشاركة في المزادات المباشرة، أو الاطلاع على معرض سيارات كاركي المعتمدة! ماذا تريد أن تعرف أكثر؟`,
                    `سؤال ممتاز! **كاركي (Karkey)** هي منصتك لشراء وبيع السيارات في المغرب! 🇲🇦 نقدم البيع المباشر، المزادات، وسيارات المعرض المعتمدة. كيف يمكنني مساعدتك اليوم؟`,
                ],
                es: [
                    `**Karkey** es el marketplace de vehículos online de Marruecos! 🚗✨ Conectamos compradores y vendedores de coches en todo Marruecos. Puedes explorar coches en karkey.ma/${language}/direct-sales, participar en subastas en vivo, o ver nuestro showroom verificado Karkey Cars! ¿Qué te gustaría saber más?`,
                    `¡Gran pregunta! **Karkey** (كاركي) es tu plataforma para comprar y vender coches en Marruecos! 🇲🇦 Ofrecemos ventas directas, subastas y coches de showroom verificados. ¿Cómo puedo ayudarte hoy?`,
                ],
            };

            const langResponses = brandResponses[language] || brandResponses.en;
            const randomResponse = langResponses[Math.floor(Math.random() * langResponses.length)];

            return new Response(randomResponse, {
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
        }

        if (lastUserMessage && isSearchMessage(lastUserMessage.content)) {
            console.log('[Chat API v2] Smart Hybrid Search triggered:', lastUserMessage.content);

            // 1. Parallel Extractions
            const direct = {
                year: extractYearFromText(lastUserMessage.content),
                make: extractMakeFromText(lastUserMessage.content),
                model: extractModelFromText(lastUserMessage.content),
                location: extractLocationFromText(lastUserMessage.content),
                price: extractPriceFromText(lastUserMessage.content),
                fuelType: extractFuelTypeFromText(lastUserMessage.content),
                transmission: extractTransmissionFromText(lastUserMessage.content),
                mileage: extractMileageFromText(lastUserMessage.content),
                condition: extractConditionFromText(lastUserMessage.content),
                color: extractColorFromText(lastUserMessage.content),
                doors: extractDoorsFromText(lastUserMessage.content),
                engineSize: extractEngineSizeFromText(lastUserMessage.content)
            };

            let aiIntent: SearchIntent | null = null;
            if (lastUserMessage.content.length > 15) {
                try {
                    const aiResponse = await generateText({
                        model: groq(AI_CONFIG.intentModel),
                        prompt: `Extract search filters from: "${lastUserMessage.content}"
Output ONLY a JSON object. Fields: make, model, minPrice, maxPrice, location, fuelType, transmission, minYear, maxYear, maxMileage, minEngineSize, maxEngineSize, exteriorColor, vehicleCondition, sortBy, sortOrder, limit.
For superlatives like "most expensive" or "highest price", use sortBy: "price" and sortOrder: "desc". For "cheapest", use sortBy: "price" and sortOrder: "asc". For "newest", use sortBy: "year" and sortOrder: "desc". For "just one", use limit: 1.`,
                        temperature: 0,
                    });
                    aiIntent = extractJsonFromText(aiResponse.text);
                } catch (err) {
                    console.error('[Chat API] AI Extraction failed:', err);
                }
            }

            // 2. Merge and Search
            const searchParams: Record<string, any> = {};
            if (direct.year.minYear) { searchParams.minYear = direct.year.minYear; searchParams.maxYear = direct.year.maxYear; }
            if (direct.make) searchParams.make = direct.make;
            if (direct.model) searchParams.model = direct.model;
            if (direct.location) searchParams.location = direct.location;
            if (direct.price.minPrice) searchParams.minPrice = direct.price.minPrice;
            if (direct.price.maxPrice) searchParams.maxPrice = direct.price.maxPrice;
            if (direct.fuelType) searchParams.fuelType = direct.fuelType;
            if (direct.transmission) searchParams.transmission = direct.transmission;
            if (direct.mileage.maxMileage) searchParams.maxMileage = direct.mileage.maxMileage;
            if (direct.condition) searchParams.vehicleCondition = direct.condition;
            if (direct.color) searchParams.exteriorColor = direct.color;
            if (direct.engineSize.minEngineSize) searchParams.minEngineSize = direct.engineSize.minEngineSize;
            if (direct.engineSize.maxEngineSize) searchParams.maxEngineSize = direct.engineSize.maxEngineSize;

            if (aiIntent) {
                if (!searchParams.make && aiIntent.make) searchParams.make = aiIntent.make;
                if (!searchParams.model && aiIntent.model) searchParams.model = aiIntent.model;
                if (!searchParams.minPrice && aiIntent.minPrice) searchParams.minPrice = aiIntent.minPrice;
                if (!searchParams.maxPrice && aiIntent.maxPrice) searchParams.maxPrice = aiIntent.maxPrice;
                if (!searchParams.location && aiIntent.location) searchParams.location = aiIntent.location;
                if (!searchParams.maxYear && aiIntent.maxYear) searchParams.maxYear = aiIntent.maxYear;
                if (!searchParams.sortBy && aiIntent.sortBy) searchParams.sortBy = aiIntent.sortBy;
                if (!searchParams.sortOrder && aiIntent.sortOrder) searchParams.sortOrder = aiIntent.sortOrder;
                if (!searchParams.limit && aiIntent.limit) searchParams.limit = aiIntent.limit;
            }

            const searchResult = await searchVehicles(searchParams);
            vehicleResults = searchResult.vehicles || [];
            totalVehicleCount = searchResult.count;

            // 3. CONTEXT INJECTION: Prepare context for AI to "talk" about the results
            const resultSummary = vehicleResults.length > 0
                ? `Search found ${totalVehicleCount} vehicles. Showing the first ${vehicleResults.length}. Top results: ${vehicleResults.slice(0, 3).map(v => `${(v as any).make} ${(v as any).model} (${(v as any).price} DH)`).join(', ')}.`
                : `No vehicles found for filters: ${JSON.stringify(searchParams)}. Suggest broadening the search or check other models.`;

            messages.push({
                role: 'system',
                content: `INTERNAL SEARCH RESULTS: ${resultSummary}\nTask: Discuss these results with the user. Be helpful and expert. Use Moroccan context if appropriate.`
            });
        }

        // 4. Unified AI Response (Always streams via AI to maintain conversation)
        const result = streamText({
            model: groq(AI_CONFIG.model),
            system: getSystemPrompt(language),
            messages,
            temperature: 0.5,
            maxOutputTokens: 400,
        });

        // 5. Intelligent Bridge: Send vehicle markers THEN AI text
        const encoder = new TextEncoder();
        const aiStream = result.textStream;

        const responseStream = new ReadableStream({
            async start(controller) {
                // If we found vehicles, inject the UI marker at the very beginning of the stream
                if (vehicleResults.length > 0) {
                    const vehiclesData = JSON.stringify({ type: 'vehicles', data: vehicleResults, totalCount: totalVehicleCount });
                    controller.enqueue(encoder.encode(`__VEHICLES__${vehiclesData}__END_VEHICLES__`));
                }

                // Now pipe the AI response
                const reader = aiStream.getReader();
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        controller.enqueue(encoder.encode(value));
                    }
                } finally {
                    reader.releaseLock();
                    controller.close();
                }
            },
        });

        return new Response(responseStream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error) {
        console.error('[Chat API Error]', error);
        return new Response(
            JSON.stringify({ error: 'Failed to process chat message' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

