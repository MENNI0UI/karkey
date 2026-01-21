/**
 * Locales Index - Types and shared exports
 */

// Re-export all translations
export { en } from './en';
export { fr } from './fr';
export { ar } from './ar';
export { es } from './es';

// Type definitions
export type Language = "en" | "fr" | "ar" | "es";

// TranslationKey is derived from the English translations (the source of truth)
import type { en } from './en';
export type TranslationKey = keyof typeof en;

// Translations map removed to prevent bundling all languages.
// Use loadTranslations from ./loader.ts instead.

// Dynamic loader for lazy loading (use when you want to load only needed language)
// function removed, use lib/locales/loader.ts instead
