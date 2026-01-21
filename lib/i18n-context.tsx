"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { loadTranslations } from "./locales/loader";
import { en } from "./locales/en";
import type { Language, TranslationKey } from "./locales/index";

type I18nContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
  isReady: boolean;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "karkey:lang";

export function I18nProvider({ children, lang }: { children: React.ReactNode; lang?: Language }) {
  const [language, setLanguageState] = useState<Language>(lang || "en");
  // Store loaded translations instead of importing the huge object
  const [currentTranslations, setCurrentTranslations] = useState<any>(en);
  const [isReady, setIsReady] = useState(false);

  // Sync with prop if it changes (URL change)
  useEffect(() => {
    if (lang && lang !== language) {
      changeLanguage(lang);
    }
  }, [lang]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      // If lang provided via props, use it. Otherwise check localStorage or default to en.
      let targetLang = lang;
      if (!targetLang && typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
          if (stored && ['en', 'fr', 'ar', 'es'].includes(stored)) {
            targetLang = stored as Language;
          }
        } catch { }
      }
      targetLang = targetLang || 'en';

      if (targetLang !== 'en') {
        // Load translations for the target language
        const loaded = await loadTranslations(targetLang);
        setCurrentTranslations(loaded);
      }

      setLanguageState(targetLang);
      document.documentElement.lang = targetLang;
      document.documentElement.dir = targetLang === "ar" ? "rtl" : "ltr";
      setIsReady(true);
    };

    init();
  }, []);

  const changeLanguage = async (newLang: Language) => {
    // 1. Optimistically update state
    setLanguageState(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";

    // 2. Persist preference
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? ';Secure' : '';
      document.cookie = `${LANGUAGE_STORAGE_KEY}=${newLang};path=/;max-age=31536000${secure}`;
    } catch { }

    // 3. Load translation file dynamically
    if (newLang === 'en') {
      setCurrentTranslations(en);
    } else {
      const loaded = await loadTranslations(newLang);
      setCurrentTranslations(loaded);
    }
  };

  const setLanguage = (lang: Language) => {
    changeLanguage(lang);
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    // Fallback to English if key missing in current language
    let text = currentTranslations[key] || en[key as keyof typeof en] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  const dir = language === "ar" ? "rtl" : "ltr";

  // Don't render children until we've attempted initial setup
  if (!isReady) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, dir, isReady }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}

export function useLanguage() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within an I18nProvider");
  }
  return context.language;
}
