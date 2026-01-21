/**
 * Translations - Backward Compatibility Layer
 * 
 * This file re-exports from the split locale files for backward compatibility.
 * The actual translations are now in lib/locales/*.ts
 * 
 * For better performance, consider importing directly from:
 * - @/lib/locales/en
 * - @/lib/locales/fr
 * - @/lib/locales/ar
 * - @/lib/locales/es
 */

// Re-export everything from locales index
export { en, fr, ar, es } from './locales';
export { loadTranslations } from './locales/loader';
export type { Language, TranslationKey } from './locales';
