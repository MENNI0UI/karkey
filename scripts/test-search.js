// Test the search dictionary

// Inline test
const normalizeForSearch = (query) => {
    if (!query || typeof query !== 'string') return '';
    let normalized = query.trim().toLowerCase();
    normalized = normalized
        .replace(/[أإآا]/g, 'ا')
        .replace(/[ىي]/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي');
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f\u064B-\u065F]/g, '');
    normalized = normalized.replace(/\s+/g, ' ').trim();
    return normalized;
};

const FUEL_DICTIONARY = {
    gasoline: ['gasoline', 'petrol', 'gas', 'benzine', 'essence', 'super', 'sans plomb', 'بنزين', 'ايصانص', 'إيصانص', 'صونص', 'سوبر', 'gasolina', 'nafta'],
    diesel: ['diesel', 'gasoil', 'gazole', 'ديزل', 'ديزال', 'مازوت', 'كازوال', 'كازول', 'غازوال', 'diésel', 'gasóleo', 'gasoleo'],
    electric: ['electric', 'ev', 'battery', 'bev', 'électrique', 'electrique', 'كهربائي', 'كهربائية', 'كهرباء', 'إلكتريك', 'eléctrico', 'electrico'],
    hybrid: ['hybrid', 'phev', 'hev', 'hybride', 'هجين', 'هجينة', 'هايبرد', 'هايبريد', 'híbrido', 'hibrido']
};

const DOORS_DICTIONARY = {
    '2': ['2', 'two', 'deux', 'اثنين', '٢', 'coupe', 'كوبيه', 'dos', 'بابين', '2 doors', '2 portes', '2 أبواب', '2 بيبان'],
    '3': ['3', 'three', 'trois', 'ثلاثة', '٣', 'tres', 'ثلاث أبواب', '3 doors', '3 portes', '3 أبواب', '3 بيبان'],
    '4': ['4', 'four', 'quatre', 'أربعة', '٤', 'cuatro', 'اربع', 'أربع أبواب', '4 doors', '4 portes', '4 أبواب', '4 بيبان'],
    '5': ['5', 'five', 'cinq', 'خمسة', '٥', 'cinco', 'خمس أبواب', '5 doors', '5 portes', '5 أبواب', '5 بيبان']
};

function findAllMatches(query, dict) {
    const normalizedQuery = normalizeForSearch(query);
    if (!normalizedQuery || normalizedQuery.length < 1) return [];
    
    const matches = [];
    for (const [dbValue, terms] of Object.entries(dict)) {
        const normalizedTerms = terms.map(t => normalizeForSearch(t));
        if (normalizedTerms.some(t => t.includes(normalizedQuery) || normalizedQuery.includes(t))) {
            matches.push(dbValue);
        }
    }
    return matches;
}

// Test cases
console.log('=== FUEL TESTS ===');
console.log('ديزل:', findAllMatches('ديزل', FUEL_DICTIONARY));
console.log('diesel:', findAllMatches('diesel', FUEL_DICTIONARY));
console.log('مازوت:', findAllMatches('مازوت', FUEL_DICTIONARY));
console.log('بنزين:', findAllMatches('بنزين', FUEL_DICTIONARY));
console.log('essence:', findAllMatches('essence', FUEL_DICTIONARY));

console.log('\n=== DOORS TESTS ===');
console.log('4:', findAllMatches('4', DOORS_DICTIONARY));
console.log('4 أبواب:', findAllMatches('4 أبواب', DOORS_DICTIONARY));
console.log('4 doors:', findAllMatches('4 doors', DOORS_DICTIONARY));
console.log('بابين:', findAllMatches('بابين', DOORS_DICTIONARY));
console.log('5 portes:', findAllMatches('5 portes', DOORS_DICTIONARY));
