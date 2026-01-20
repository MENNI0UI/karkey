"use client";

import React, { createContext, useContext, useEffect, useState, useLayoutEffect } from "react";
import { translations, Language, TranslationKey } from "./translations";

type I18nContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
  isReady: boolean;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "karkey:lang";

// Helper to get initial language synchronously (for SSR consistency)
function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  try {
    const stored = (localStorage.getItem(LANGUAGE_STORAGE_KEY) || "").toLowerCase();
    if (stored === "fr") return "fr";
    if (stored === "ar") return "ar";
    if (stored === "es") return "es";
  } catch { }
  return "en";
}

export function I18nProvider({ children, lang }: { children: React.ReactNode; lang?: Language }) {
  // Initialize with provided lang or "en"
  const [language, setLanguageState] = useState<Language>(lang || "en");
  const [isReady, setIsReady] = useState(false);

  // Sync with prop if it changes (URL change)
  useEffect(() => {
    if (lang && lang !== language) {
      setLanguageState(lang);
    }
  }, [lang]);

  // Use useLayoutEffect to match document attributes
  useLayoutEffect(() => {
    // If we have a lang from URL, we trust it. We can sync to localStorage.
    if (lang) {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? ';Secure' : '';
      document.cookie = `${LANGUAGE_STORAGE_KEY}=${lang};path=/;max-age=31536000${secure}`;
    }
    setIsReady(true);
  }, [lang]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      // Also set as cookie for potential SSR usage
      const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? ';Secure' : '';
      document.cookie = `${LANGUAGE_STORAGE_KEY}=${lang};path=/;max-age=31536000${secure}`;
    } catch { }
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let text = translations[language][key] || translations["en"][key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  const dir = language === "ar" ? "rtl" : "ltr";

  // Don't render children until language is loaded to prevent flash
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
