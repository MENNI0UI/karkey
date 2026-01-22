"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Home, Gavel, Car, Info, User, LogOut, LogIn, UserPlus, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { normalizePhotoUrl } from "./utils";
import { HeaderUserSnapshot } from "./types";

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
    serverUser: HeaderUserSnapshot;
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
    localProfilePic,
    serverUser
}) => {
    const isRTL = language === 'ar';

    // Animation Variants
    const containerVariants = {
        hidden: {
            x: isRTL ? "100%" : "-100%",
            transition: { type: "spring", stiffness: 300, damping: 35 }
        },
        visible: {
            x: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 35,
                staggerChildren: 0.12,
                delayChildren: 0.1
            }
        }
    } as const;

    const itemVariants = {
        hidden: { opacity: 0, y: 15, filter: "blur(5px)" },
        visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: { type: "spring", stiffness: 260, damping: 25 }
        }
    } as const;

    const backdropVariants = {
        hidden: { opacity: 0, backdropFilter: "blur(0px)" },
        visible: { opacity: 1, backdropFilter: "blur(8px)" }
    } as const;

    return (
        <AnimatePresence>
            {menuOpen && (
                <div className="fixed inset-0 z-[100005] lg:hidden overflow-hidden">
                    {/* Magical Backdrop */}
                    <motion.div
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="absolute inset-0 bg-[#1e2a5e]/50"
                        onClick={() => setMenuOpen(false)}
                    />

                    {/* Content Sidebar */}
                    <motion.div
                        dir={isRTL ? "rtl" : "ltr"}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className={`absolute top-0 ${isRTL ? "right-0" : "left-0"} bottom-0 w-[440px] max-w-[85vw] bg-white shadow-[0_0_50px_rgba(0,0,0,0.15)] flex flex-col z-[100006]`}
                    >
                        {/* Magical Particles Background (Subtle Gradient) */}
                        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />

                        <div className="relative flex flex-col h-full">
                            {/* Header Area */}
                            <motion.div variants={itemVariants} className="flex items-center justify-between p-6 border-b border-gray-100">
                                <Link href={`/${language}`} onClick={() => setMenuOpen(false)} className="py-2">
                                    <Image
                                        src="/logo.png"
                                        alt="Karkey Logo"
                                        width={240}
                                        height={80}
                                        className="h-24 w-auto object-contain scale-[2.1] translate-y-1.5"
                                    />
                                </Link>
                                <button
                                    onClick={() => setMenuOpen(false)}
                                    className="p-3 rounded-full bg-gray-50 text-[#1e2a5e] hover:bg-gray-100 active:scale-90 transition-all"
                                >
                                    <X size={24} strokeWidth={2.5} />
                                </button>
                            </motion.div>

                            {/* Scrollable Navigation Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                                {/* Primary Links */}
                                <div className="space-y-3">
                                    <motion.div variants={itemVariants} className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] font-serif">
                                        {t("nav.explore")}
                                    </motion.div>
                                    <div className="space-y-1">
                                        {[
                                            { href: `/${language}`, icon: Home, label: t("nav.home") },
                                            { href: `/${language}/direct-sales`, icon: Car, label: t("nav.buy") },
                                            { href: `/${language}/auctions`, icon: Gavel, label: t("nav.auctions") },
                                            { href: `/${language}/karkey-cars`, label: t("nav.karkey_cars") || "Karkey Cars", simple: true }
                                        ].map((item, idx) => (
                                            <motion.div key={idx} variants={itemVariants}>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setMenuOpen(false)}
                                                    className={`flex items-center gap-3 px-3 py-3.5 rounded-xl text-[#1e2a5e] hover:bg-[#B8071C]/5 hover:text-[#B8071C] active:scale-[0.98] transition-all font-serif group`}
                                                >
                                                    {item.icon && <item.icon size={22} className="text-[#1e2a5e]/50 group-hover:text-[#B8071C] transition-colors" />}
                                                    <span className={`text-[16px] font-semibold ${item.simple ? "ml-1 rtl:mr-1" : ""}`}>{item.label}</span>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Account Actions */}
                                <div className="space-y-3">
                                    <motion.div variants={itemVariants} className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] font-serif">
                                        {t("nav.account")}
                                    </motion.div>
                                    <div className="space-y-1">
                                        {(isAuthenticated || hasCachedUser) ? (
                                            <>
                                                <motion.div variants={itemVariants}>
                                                    <Link href={`/${language}/profile?tab=personal-info`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all group font-serif">
                                                        <User size={22} className="text-gray-400 group-hover:text-[#B8071C] transition-colors" />
                                                        <span className="text-[16px] font-semibold group-hover:text-[#B8071C] transition-colors">{t("nav.my_profile")}</span>
                                                    </Link>
                                                </motion.div>
                                                <motion.div variants={itemVariants}>
                                                    <button
                                                        onClick={() => { setMenuOpen(false); void handleFullLogout(); }}
                                                        className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-red-600 hover:bg-red-50 active:scale-[0.98] transition-all font-serif"
                                                    >
                                                        <LogOut size={22} />
                                                        <span className="text-[16px] font-semibold">{t("nav.logout")}</span>
                                                    </button>
                                                </motion.div>
                                            </>
                                        ) : shouldShowAuthButtons ? (
                                            <>
                                                <motion.div variants={itemVariants}>
                                                    <Link href={`/${language}/auth/login`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-[#1e2a5e] hover:bg-gray-50 active:scale-[0.98] transition-all group font-serif">
                                                        <LogIn size={22} className="text-[#1e2a5e]/50 group-hover:text-[#B8071C] transition-colors" />
                                                        <span className="text-[16px] font-semibold group-hover:text-[#B8071C] transition-colors">{t("nav.signin")}</span>
                                                    </Link>
                                                </motion.div>
                                                <motion.div variants={itemVariants}>
                                                    <Link href={`/${language}/auth/register`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-4 rounded-2xl text-white bg-gradient-to-r from-[#B8071C] to-[#d60821] hover:shadow-lg hover:shadow-[#B8071C]/20 active:scale-[0.98] transition-all font-serif">
                                                        <UserPlus size={22} strokeWidth={2.5} />
                                                        <span className="text-[16px] font-bold">{t("nav.signup")}</span>
                                                    </Link>
                                                </motion.div>
                                            </>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Language Switcher (Mobile) */}
                                <div className="space-y-3">
                                    <motion.div variants={itemVariants} className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] font-serif">
                                        {t("nav.language") === "nav.language" ? (language === 'ar' ? "اللغة" : "Language") : t("nav.language")}
                                    </motion.div>
                                    <motion.div variants={itemVariants} className="space-y-1">
                                        <button
                                            onClick={() => setMobileLangOpen(!mobileLangOpen)}
                                            className="w-full flex items-center justify-between px-4 py-4 rounded-xl bg-gray-50 text-gray-900 font-semibold transition-all hover:bg-gray-100 font-serif"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`fi fi-${{ en: "us", fr: "fr", es: "es", ar: "ma" }[language] || "us"} !w-5 !h-5 !bg-cover rounded-full shadow-sm`}></span>
                                                <span className="text-[16px]">
                                                    {{ en: "English", fr: "Français", es: "Español", ar: "العربية" }[language] || "English"}
                                                </span>
                                            </div>
                                            <ChevronRight size={18} className={`text-gray-400 transition-transform duration-500 ${mobileLangOpen ? "rotate-90" : ""}`} />
                                        </button>

                                        <AnimatePresence>
                                            {mobileLangOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="space-y-1 py-1 px-2 border-l-2 border-[#B8071C]/20 ml-4 rtl:border-l-0 rtl:border-r-2 rtl:ml-0 rtl:mr-4 mt-2">
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
                                                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-600 hover:text-[#B8071C] hover:bg-[#B8071C]/5 transition-all font-serif font-medium"
                                                                >
                                                                    <span className={`fi fi-${flagMap[langCode]} !w-4 !h-4 !bg-cover rounded-full shadow-sm grayscale opacity-70`}></span>
                                                                    <span className="text-[15px]">{labelMap[langCode]}</span>
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </div>

                                {/* User Footer (Auth Only) */}
                                {(isAuthenticated || hasCachedUser) && (
                                    <motion.div variants={itemVariants} className="mt-8 px-2">
                                        <Link
                                            href={`/${language}/profile`}
                                            onClick={() => setMenuOpen(false)}
                                            className="relative flex items-center gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl hover:bg-[#B8071C]/5 hover:border-[#B8071C]/20 transition-all active:scale-[0.98] group"
                                        >
                                            {(() => {
                                                const placeholderPic = normalizePhotoUrl(null);
                                                const picFromStable = stablePicRef.current;
                                                const picFromLocal = localProfilePic;
                                                const picFromServer = serverUser?.profile_picture ? normalizePhotoUrl(serverUser.profile_picture) : null;
                                                const picToShow = picFromStable ?? picFromLocal ?? picFromServer;

                                                const hasRealPic = !!picToShow && String(picToShow) !== String(placeholderPic);

                                                if (hasRealPic) {
                                                    return (
                                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#DEB735] shadow-sm">
                                                            <Image
                                                                src={picToShow as string}
                                                                alt="Profile"
                                                                width={48}
                                                                height={48}
                                                                className="object-cover w-full h-full"
                                                                unoptimized
                                                                priority
                                                            />
                                                        </div>
                                                    )
                                                }
                                                if (effectiveInitial) {
                                                    return (
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#B8071C] to-[#d60821] text-white font-bold grid place-items-center text-lg shadow-sm border-2 border-[#DEB735]">
                                                            {effectiveInitial}
                                                        </div>
                                                    )
                                                }
                                                return (
                                                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 grid place-items-center border-2 border-[#DEB735]">
                                                        <User size={22} strokeWidth={1.5} />
                                                    </div>
                                                )
                                            })()}
                                            <div className="flex-1 min-w-0 font-serif">
                                                <p className="text-[16px] font-bold text-gray-900 truncate tracking-tight group-hover:text-[#B8071C] transition-colors">{effectiveName || "User"}</p>
                                                <p className="text-[12px] text-gray-500 font-medium truncate">{t("nav.view_profile")}</p>
                                            </div>
                                            <div className="w-7 h-7 rounded-full bg-white/50 flex items-center justify-center text-gray-400 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                                                <ChevronRight size={16} />
                                            </div>
                                        </Link>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
