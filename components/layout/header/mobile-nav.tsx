"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Home, Gavel, Car, Info, User, LogOut, LogIn, UserPlus, ChevronRight } from "lucide-react";
import { normalizePhotoUrl } from "./utils";

interface MobileNavProps {
    language: string;
    t: any;
    menuOpen: boolean;
    setMenuOpen: (open: boolean) => void;
    mobileLangOpen: boolean;
    setMobileLangOpen: (open: boolean) => void;
    isAuthenticated: boolean;
    hasCachedUser: boolean;
    shouldShowAuthButtons: boolean;
    effectiveName: string | null;
    effectiveInitial: string | null;
    handleFullLogout: () => void;
    pathname: string;
    router: any;
    setLanguage: (lang: any) => void;
    stablePicRef: React.MutableRefObject<string | null>;
    localProfilePic: string | null;
}

export const MobileNav: React.FC<MobileNavProps> = ({
    language,
    t,
    menuOpen,
    setMenuOpen,
    mobileLangOpen,
    setMobileLangOpen,
    isAuthenticated,
    hasCachedUser,
    shouldShowAuthButtons,
    effectiveName,
    effectiveInitial,
    handleFullLogout,
    pathname,
    router,
    setLanguage,
    stablePicRef,
    localProfilePic
}) => {
    if (!menuOpen) return null;

    const isRTL = language === 'ar';

    return (
        <div className="fixed inset-0 z-[100005] lg:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#1e2a5e]/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => setMenuOpen(false)}
            />

            {/* Content Sidebar */}
            <div
                dir={isRTL ? "rtl" : "ltr"}
                className={`absolute top-0 ${isRTL ? "right-0" : "left-0"} bottom-0 w-[440px] max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 transform translate-x-0`}>
                {/* Header Area */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <Link href={`/${language}`} onClick={() => setMenuOpen(false)} className="py-2">
                        <Image
                            src="/logo.png"
                            alt="Karkey Logo"
                            width={240}
                            height={80}
                            className="h-20 w-auto object-contain scale-[1.7]"
                        />
                    </Link>
                    <button
                        onClick={() => setMenuOpen(false)}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X size={24} className="text-[#1e2a5e]" />
                    </button>
                </div>

                {/* Scrollable Navigation Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Primary Links */}
                    <div className="space-y-3">
                        <div className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] font-serif">
                            {t("nav.explore")}
                        </div>
                        <div className="space-y-1">
                            <Link href={`/${language}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#1e2a5e] hover:bg-gray-50 hover:text-[#B8071C] transition-colors font-serif">
                                <Home size={20} className="text-[#1e2a5e]/70" />
                                <span className="text-[15px] font-medium">{t("nav.home")}</span>
                            </Link>
                            <Link href={`/${language}/showroom`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#1e2a5e] hover:bg-gray-50 hover:text-[#B8071C] transition-colors font-serif">
                                <Car size={20} className="text-[#1e2a5e]/70" />
                                <span className="text-[15px] font-medium">{t("nav.buy")}</span>
                            </Link>
                            <Link href={`/${language}/auctions`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#1e2a5e] hover:bg-gray-50 hover:text-[#B8071C] transition-colors font-serif">
                                <Gavel size={20} className="text-[#1e2a5e]/70" />
                                <span className="text-[15px] font-medium">{t("nav.auctions")}</span>
                            </Link>
                        </div>

                        {/* Karkey Cars */}
                        <div className="space-y-1">
                            <Link href={`/${language}/karkey-cars`} onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-[#1e2a5e] hover:bg-gray-50 hover:text-[#B8071C] transition-colors font-serif">
                                <span className="text-[15px] font-medium">{t("nav.karkey_cars") || "Karkey Cars"}</span>
                            </Link>
                        </div>
                    </div>

                    {/* Account Actions */}
                    <div className="space-y-3">
                        <div className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] font-serif">
                            {t("nav.account")}
                        </div>
                        <div className="space-y-1">
                            {(isAuthenticated || hasCachedUser) ? (
                                <>
                                    <Link href={`/${language}/profile?tab=personal-info`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors group font-serif">
                                        <User size={20} className="text-gray-400 group-hover:text-[#B8071C] transition-colors" />
                                        <span className="text-[15px] font-medium group-hover:text-[#B8071C] transition-colors">{t("nav.my_profile")}</span>
                                    </Link>
                                    <button
                                        onClick={() => { setMenuOpen(false); void handleFullLogout(); }}
                                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-serif"
                                    >
                                        <LogOut size={20} />
                                        <span className="text-[15px] font-medium">{t("nav.logout")}</span>
                                    </button>
                                </>
                            ) : shouldShowAuthButtons ? (
                                <>
                                    <Link href={`/${language}/auth/login`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#1e2a5e] hover:bg-gray-50 transition-colors group font-serif">
                                        <LogIn size={20} className="text-[#1e2a5e]/70 group-hover:text-[#B8071C] transition-colors" />
                                        <span className="text-[15px] font-medium group-hover:text-[#B8071C] transition-colors">{t("nav.signin")}</span>
                                    </Link>
                                    <Link href={`/${language}/auth/register`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-white bg-[#B8071C] hover:bg-[#910515] transition-colors shadow-sm font-serif">
                                        <UserPlus size={20} />
                                        <span className="text-[15px] font-semibold">{t("nav.signup")}</span>
                                    </Link>
                                </>
                            ) : null}
                        </div>
                    </div>

                    {/* Language Switcher (Mobile) */}
                    <div className="space-y-3">
                        <div className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] font-serif">
                            {t("nav.language") === "nav.language" ? (language === 'ar' ? "اللغة" : "Language") : t("nav.language")}
                        </div>
                        <div className="space-y-1">
                            <button
                                onClick={() => setMobileLangOpen(!mobileLangOpen)}
                                className="w-full flex items-center justify-between px-3 py-3 rounded-xl bg-gray-50 text-gray-900 font-medium transition-colors hover:bg-gray-100 font-serif"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`fi fi-${{ en: "us", fr: "fr", es: "es", ar: "ma" }[language] || "us"} !w-5 !h-5 !bg-cover rounded-full shadow-sm`}></span>
                                    <span className="text-[15px]">
                                        {{ en: "English", fr: "Français", es: "Español", ar: "العربية" }[language] || "English"}
                                    </span>
                                </div>
                                <ChevronRight size={16} className={`text-gray-400 transition-transform duration-300 ${mobileLangOpen ? "rotate-90" : ""}`} />
                            </button>

                            {/* Dropdown Options */}
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${mobileLangOpen ? "max-h-[300px] opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"}`}>
                                <div className="space-y-1 px-2 border-l-2 border-gray-100 ml-3 rtl:border-l-0 rtl:border-r-2 rtl:ml-0 rtl:mr-3">
                                    {["en", "fr", "ar", "es"].map((langCode) => {
                                        if (langCode === language) return null;
                                        const flagMap: Record<string, string> = { en: "us", fr: "fr", es: "es", ar: "ma" }
                                        const labelMap: Record<string, string> = { en: "English", fr: "Français", es: "Español", ar: "العربية" }
                                        return (
                                            <button
                                                key={langCode}
                                                onClick={() => {
                                                    try {
                                                        setLanguage(langCode as any)
                                                        router.replace(pathname.replace(/^\/[a-z]{2}/, `/${langCode}`))
                                                        setMenuOpen(false)
                                                        setMobileLangOpen(false)
                                                    } catch { }
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:text-[#B8071C] hover:bg-[#B8071C]/5 transition-colors font-serif"
                                            >
                                                <span className={`fi fi-${flagMap[langCode]} !w-4 !h-4 !bg-cover rounded-full shadow-sm grayscale opacity-70`}></span>
                                                <span className="text-[14px]">{labelMap[langCode]}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Footer (Auth Only) */}
                    {(isAuthenticated || hasCachedUser) && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                            <Link href={`/${language}/profile`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3">
                                {(() => {
                                    const placeholderPic = normalizePhotoUrl(null)
                                    const picToShow = stablePicRef.current ?? localProfilePic ?? null
                                    const hasRealPic = !!picToShow && String(picToShow) !== String(placeholderPic)
                                    if (hasRealPic) {
                                        return (
                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-white">
                                                <Image src={picToShow as string} alt="Profile" width={40} height={40} className="object-cover w-10 h-10" unoptimized priority />
                                            </div>
                                        )
                                    }
                                    if (effectiveInitial) {
                                        return (
                                            <div className="w-10 h-10 rounded-full bg-[#B8071C] text-white font-bold grid place-items-center text-sm">
                                                {effectiveInitial}
                                            </div>
                                        )
                                    }
                                    return (
                                        <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 grid place-items-center">
                                            <User size={20} />
                                        </div>
                                    )
                                })()}
                                <div className="flex-1 min-w-0 font-serif">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{effectiveName || "User"}</p>
                                    <p className="text-xs text-gray-500 truncate">{t("nav.view_profile")}</p>
                                </div>
                                <ChevronRight size={16} className="text-gray-400" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
