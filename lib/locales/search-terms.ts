/**
 * Search Terms for UI Display
 * 
 * NOTE: For search/matching logic, use the unified dictionary at:
 * @/lib/search/search-dictionary.ts
 * 
 * This file is for UI LABELS ONLY - what users see in dropdowns and filters.
 * The search-dictionary.ts contains ALL synonyms and alternate spellings for matching.
 */

export const searchTerms = {
    en: {
        "vehicle.fuel.gasoline": "Gasoline",
        "vehicle.fuel.petrol": "Petrol",
        "vehicle.fuel.diesel": "Diesel",
        "vehicle.fuel.electric": "Electric",
        "vehicle.fuel.hybrid": "Hybrid",
        "vehicle.transmission.automatic": "Automatic",
        "vehicle.transmission.manual": "Manual",
        "vehicle.condition.new": "New",
        "vehicle.condition.used": "Used",
        "vehicle.condition.excellent": "Excellent",
        "vehicle.condition.good": "Good",
        "vehicle.condition.fair": "Fair",
        "vehicle.condition.poor": "Poor",
        // Doors
        "vehicle.doors.2": "2 Doors",
        "vehicle.doors.3": "3 Doors",
        "vehicle.doors.4": "4 Doors",
        "vehicle.doors.5": "5 Doors",
    },
    fr: {
        "vehicle.fuel.gasoline": "Essence",
        "vehicle.fuel.petrol": "Essence",
        "vehicle.fuel.diesel": "Diesel",
        "vehicle.fuel.electric": "Électrique",
        "vehicle.fuel.hybrid": "Hybride",
        "vehicle.transmission.automatic": "Automatique",
        "vehicle.transmission.manual": "Manuelle",
        "vehicle.condition.new": "Neuf",
        "vehicle.condition.used": "Occasion",
        "vehicle.condition.excellent": "Excellent",
        "vehicle.condition.good": "Bon",
        "vehicle.condition.fair": "Correct",
        "vehicle.condition.poor": "Mauvais",
        // Doors
        "vehicle.doors.2": "2 Portes",
        "vehicle.doors.3": "3 Portes",
        "vehicle.doors.4": "4 Portes",
        "vehicle.doors.5": "5 Portes",
    },
    ar: {
        "vehicle.fuel.gasoline": "بنزين",
        "vehicle.fuel.petrol": "بنزين",
        "vehicle.fuel.diesel": "ديزل",
        "vehicle.fuel.electric": "كهربائي",
        "vehicle.fuel.hybrid": "هجين",
        "vehicle.transmission.automatic": "أوتوماتيك",
        "vehicle.transmission.manual": "يدوي",
        "vehicle.condition.new": "جديد",
        "vehicle.condition.used": "مستعمل",
        "vehicle.condition.excellent": "ممتاز",
        "vehicle.condition.good": "جيد",
        "vehicle.condition.fair": "مقبول",
        "vehicle.condition.poor": "سيء",
        // Doors
        "vehicle.doors.2": "بابين",
        "vehicle.doors.3": "3 أبواب",
        "vehicle.doors.4": "4 أبواب",
        "vehicle.doors.5": "5 أبواب",
    },
    es: {
        "vehicle.fuel.gasoline": "Gasolina",
        "vehicle.fuel.petrol": "Gasolina",
        "vehicle.fuel.diesel": "Diésel",
        "vehicle.fuel.electric": "Eléctrico",
        "vehicle.fuel.hybrid": "Híbrido",
        "vehicle.transmission.automatic": "Automático",
        "vehicle.transmission.manual": "Manual",
        "vehicle.condition.new": "Nuevo",
        "vehicle.condition.used": "Usado",
        "vehicle.condition.excellent": "Excelente",
        "vehicle.condition.good": "Bueno",
        "vehicle.condition.fair": "Aceptable",
        "vehicle.condition.poor": "Mal estado",
        // Doors
        "vehicle.doors.2": "2 Puertas",
        "vehicle.doors.3": "3 Puertas",
        "vehicle.doors.4": "4 Puertas",
        "vehicle.doors.5": "5 Puertas",
    }
} as const;

