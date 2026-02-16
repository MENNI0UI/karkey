
import { searchVehicles } from './lib/ai/tools';

// Mock functions to match route.ts EXACTly
function extractMileageFromText(text: string): { maxMileage?: number; minMileage?: number } {
    const result: { maxMileage?: number; minMileage?: number } = {};
    const parseNumber = (str: string): number => {
        let valueStr = str.replace(/\s/g, '');
        if (valueStr.includes('.') && valueStr.split('.')[1]?.length === 3) {
            valueStr = valueStr.replace(/\./g, '');
        } else if (valueStr.includes(',') && valueStr.split(',')[1]?.length === 3) {
            valueStr = valueStr.replace(/,/g, '');
        }
        return parseFloat(valueStr) || 0;
    };
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
    return result;
}

async function main() {
    const englishQuery = "cars between 100km and 2000km";
    const arabicQuery = "سيارات بين 100 كم و 2000 كم";

    console.log("--- DEBUGGING SEARCH ---");

    // 1. English Extraction
    const enMileage = extractMileageFromText(englishQuery);
    console.log(`English Query: "${englishQuery}"`);
    console.log(`  Extracted:`, enMileage);

    // 2. English Search
    const enParams = { ...enMileage };
    console.log(`  Searching with params:`, JSON.stringify(enParams));
    const enRes = await searchVehicles(enParams);
    console.log(`  Found: ${enRes.count} vehicles`);

    // 3. Arabic Extraction
    const arMileage = extractMileageFromText(arabicQuery);
    console.log(`\nArabic Query: "${arabicQuery}"`);
    console.log(`  Extracted:`, arMileage);

    // 4. Arabic Search
    const arParams = { ...arMileage };
    console.log(`  Searching with params:`, JSON.stringify(arParams));
    const arRes = await searchVehicles(arParams);
    console.log(`  Found: ${arRes.count} vehicles`);

    if (arRes.count !== enRes.count) {
        console.error("\n!!! DISCREPANCY DETECTED !!!");
        console.log(`English search found ${enRes.count}, Arabic found ${arRes.count}`);
    } else {
        console.log("\nResults are consistent across languages in this script.");
    }
}

main().catch(console.error);
