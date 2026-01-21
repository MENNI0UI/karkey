import type { Language } from './index';

/**
 * Load translations dynamically to avoid bundling all languages in the client.
 * This file MUST NOT have static imports for locales other than 'en' (if needed).
 */
export async function loadTranslations(lang: Language) {
    switch (lang) {
        case 'fr':
            return (await import('./fr')).fr;
        case 'ar':
            return (await import('./ar')).ar;
        case 'es':
            return (await import('./es')).es;
        case 'en':
        default:
            return (await import('./en')).en;
    }
}
