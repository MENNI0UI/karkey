"use client";

import React from "react";

interface LanguageSwitcherProps {
    language: string;
    languageOpen: boolean;
    setLanguageOpen: (open: boolean) => void;
    setLanguage: (lang: any) => void;
    setProfileDropdownOpen: (open: boolean) => void;
    setNotifOpen: (open: boolean) => void;
    pathname: string;
    router: any;
    isRTL: boolean;
    dropdownRef: React.RefObject<HTMLDivElement>;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
    language,
    languageOpen,
    setLanguageOpen,
    setLanguage,
    setProfileDropdownOpen,
    setNotifOpen,
    pathname,
    router,
    isRTL,
    dropdownRef
}) => {
    // Map language code to flag country code (us for en)
    const flagMap: Record<string, string> = { en: "us", fr: "fr", es: "es", ar: "ma" };
    const labelMap: Record<string, string> = { en: "English", fr: "Français", es: "Español", ar: "العربية" };

    const currentFlag = flagMap[language] || "us";
    const currentLabel = labelMap[language] || "English";

    const languages = [
        { code: "en", label: "English", flag: "us" },
        { code: "es", label: "Español", flag: "es" },
        { code: "fr", label: "Français", flag: "fr" },
        { code: "ar", label: "العربية", flag: "ma" }
    ];

    const handleLanguageChange = (langCode: string) => {
        try {
            setLanguage(langCode as any);
            router.replace(pathname.replace(/^\/[a-z]{2}/, `/${langCode}`));
            setLanguageOpen(false);
        } catch { }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-[#1e2a5e] hover:bg-gray-50 transition-colors font-serif"
                aria-label="Language"
                aria-expanded={languageOpen}
                type="button"
                onClick={() => {
                    try {
                        setLanguageOpen(!languageOpen);
                        setProfileDropdownOpen(false);
                        setNotifOpen(false);
                    } catch { }
                }}
            >
                <span className={`fi fi-${currentFlag} !w-4 !h-4 !bg-cover rounded-full shadow-sm`}></span>
                <span className="text-[15px] font-medium hidden sm:inline-block">{currentLabel}</span>
                <span className="text-[#1e2a5e]/60">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>

            <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-2 w-[180px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[100002] py-1 transition-all duration-200 ${isRTL ? 'origin-top-left' : 'origin-top-right'} ${languageOpen ? "opacity-100 visible scale-100 pointer-events-auto" : "opacity-0 invisible scale-95 pointer-events-none"}`}>
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        type="button"
                        className={`w-full text-left px-4 py-3 text-[15px] font-serif transition-colors flex items-center gap-3 ${language === lang.code ? "bg-[#B8071C]/5 text-[#B8071C] font-medium" : "text-[#1e2a5e] hover:bg-gray-50"}`}
                        onClick={() => handleLanguageChange(lang.code)}
                    >
                        <span className={`fi fi-${lang.flag} !w-6 !h-6 !bg-cover rounded-full shadow-sm`}></span>
                        <span className="pt-0.5">{lang.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
