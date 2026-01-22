"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { User, LayoutGrid, Heart, Store, BarChart, ChevronDown, Plus, Info, BadgeCheck, Car } from "lucide-react";
import {
    DROPDOWN_ITEM_CLASS, CREATE_BTN_CLASS, GUIDE_BTN_CLASS, EXPANDED_ACTIONS_CLASS,
    HeaderUserSnapshot
} from "./types";
import { normalizePhotoUrl } from "./utils";

interface UserMenuProps {
    language: string;
    t: any; // Using any to avoid complex translation key union mismatches
    serverUser: HeaderUserSnapshot;
    authUser: any;
    profileDropdownOpen: boolean;
    setProfileDropdownOpen: (open: boolean) => void;
    handleCreateClick: (path: string) => void;
    handleFullLogout: () => void;
    expandedSellItem: string | null;
    setExpandedSellItem: (item: string | null) => void;
    dropdownRef: React.RefObject<HTMLDivElement>;
    stablePicRef: React.MutableRefObject<string | null>;
    localProfilePic: string | null;
    setLocalProfilePic: (val: string | null) => void;
    effectiveInitial: string | null;
    effectiveName: string | null;
    effectiveUser: HeaderUserSnapshot | null;
    isAuthenticated: boolean;
    setNotifOpen: (open: boolean) => void;
    router: any;
    isRTL: boolean;
    getStoredProfilePic: () => string | null;
}

// Reusable Icons
const PlusIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const LogoutIcon = () => (
    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
    </svg>
);

export const UserMenu: React.FC<UserMenuProps> = ({
    language,
    t,
    serverUser,
    authUser,
    profileDropdownOpen,
    setProfileDropdownOpen,
    handleCreateClick,
    handleFullLogout,
    expandedSellItem,
    setExpandedSellItem,
    dropdownRef,
    stablePicRef,
    localProfilePic,
    setLocalProfilePic,
    effectiveInitial,
    effectiveName,
    effectiveUser,
    isAuthenticated,
    setNotifOpen,
    router,
    isRTL,
    getStoredProfilePic
}) => {
    const placeholderPic = normalizePhotoUrl(null);
    const storedPic = getStoredProfilePic();
    const picFromStable = stablePicRef.current;
    const picFromLocal = localProfilePic;
    const picFromServer = serverUser?.profile_picture ? normalizePhotoUrl(serverUser.profile_picture) : null;
    const picFromStored = storedPic ? normalizePhotoUrl(storedPic) : null;
    const picToShow = picFromStable ?? picFromLocal ?? picFromServer ?? picFromStored;

    const hasRealPic = !!picToShow && String(picToShow) !== String(placeholderPic);
    const isVerified = (effectiveUser as any)?.verification_status === "approved";

    // Helper for rendering avatar image or initial
    const renderAvatar = (size: "sm" | "md") => {
        const dim = size === "sm" ? 40 : 40;
        if (hasRealPic) {
            return (
                <div className={size === "sm" ? "w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#ececec] bg-[#fffdf8] overflow-hidden" : "w-10 h-10 rounded-full overflow-hidden ring-1 ring-gray-200"}>
                    <Image
                        src={picToShow as string}
                        alt="Profile"
                        width={dim + 8}
                        height={dim + 8}
                        onError={() => { setLocalProfilePic(null) }}
                        className="rounded-full object-cover w-full h-full"
                        unoptimized
                        priority={size === "sm"}
                    />
                </div>
            );
        }
        if (effectiveInitial) {
            return (
                <div className={size === "sm" ? "w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#B8071C] text-white font-extrabold grid place-items-center md:text-xl" : "w-10 h-10 rounded-full bg-[#B8071C] text-white text-sm font-semibold grid place-items-center ring-1 ring-gray-200"}>
                    {effectiveInitial}
                </div>
            );
        }
        return (
            <div className={size === "sm" ? "w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-200 text-gray-600 font-medium grid place-items-center" : "w-10 h-10 rounded-full bg-gray-200 ring-1 ring-gray-300"} />
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className="flex items-center hover:opacity-90 transition-opacity"
                onClick={() => {
                    if (isAuthenticated) {
                        setProfileDropdownOpen(!profileDropdownOpen);
                        setNotifOpen(false);
                    } else {
                        router.push(`/${language}/auth/login`);
                    }
                }}
                aria-label="Open profile menu"
                aria-expanded={profileDropdownOpen}
                type="button"
            >
                <div className="relative">
                    {renderAvatar("sm")}
                    {isVerified && (
                        <div className="absolute -bottom-1 -right-1 md:-bottom-1.5 md:-right-1.5">
                            <BadgeCheck className="w-5 h-5 md:w-6 md:h-6 text-blue-500 fill-blue-500 stroke-white" />
                        </div>
                    )}
                </div>
            </button>

            {/* Profile Dropdown Menu - GitHub Style */}
            {profileDropdownOpen && isAuthenticated && (
                <>
                    {/* Transparent overlay for outside clicks - Sized to break out of Header transform constraint */}
                    <div
                        className="fixed z-[100001] bg-transparent"
                        style={{ top: -2000, left: -2000, right: -2000, bottom: -2000 }}
                        onClick={() => setProfileDropdownOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-1 w-[calc(100vw-2rem)] sm:w-[300px] bg-white rounded-xl shadow-lg border border-gray-200/80 overflow-hidden z-[100002]`}
                    >
                        {/* User Info Header */}
                        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-200/60">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    {renderAvatar("md")}
                                    {isVerified && (
                                        <div className="absolute -bottom-1 -right-1">
                                            <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500 stroke-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-gray-900 truncate font-serif">{effectiveName || "User"}</p>
                                    <p className="text-[12px] text-gray-500 truncate">{(serverUser as any)?.email || (authUser as any)?.email || ""}</p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Section */}
                        <div className="py-1.5">
                            <Link
                                href={`/${language}/profile?tab=personal-info`}
                                onClick={() => setProfileDropdownOpen(false)}
                                className={DROPDOWN_ITEM_CLASS}
                            >
                                <User className="w-4 h-4 text-gray-500" />
                                {t("nav.my_profile")}
                            </Link>

                            <Link
                                href={`/${language}/profile?tab=listings`}
                                onClick={() => setProfileDropdownOpen(false)}
                                className={DROPDOWN_ITEM_CLASS}
                            >
                                <LayoutGrid className="w-4 h-4 text-gray-500" />
                                {t("nav.my_listings")}
                            </Link>
                            <Link
                                href={`/${language}/profile?tab=favorites`}
                                onClick={() => setProfileDropdownOpen(false)}
                                className={DROPDOWN_ITEM_CLASS}
                            >
                                <Heart className="w-4 h-4 text-gray-500" />
                                {t("nav.my_favorites")}
                            </Link>
                            <Link
                                href={`/${language}/profile?tab=statistics`}
                                onClick={() => setProfileDropdownOpen(false)}
                                className={DROPDOWN_ITEM_CLASS}
                            >
                                <BarChart className="w-4 h-4 text-gray-500" />
                                {language === 'ar' ? 'الإحصائيات' : language === 'fr' ? 'Statistiques' : 'Statistics'}
                            </Link>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gray-200/80 mx-2" />

                        {/* Create Section */}
                        <div className="py-1.5">
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setExpandedSellItem(expandedSellItem === 'direct-sale' ? null : 'direct-sale')}
                                    className={`w-full flex items-center justify-between px-4 py-[7px] text-[13px] transition-colors font-serif ${expandedSellItem === 'direct-sale' ? 'text-[#B8071C] bg-[#B8071C]/5' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <PlusIcon className={`w-4 h-4 ${expandedSellItem === 'direct-sale' ? 'text-[#B8071C]' : 'text-gray-500'}`} />
                                        <span>{t("nav.new_direct_sale")}</span>
                                    </div>
                                    <ChevronDown className={`w-3 h-3 transition-transform ${expandedSellItem === 'direct-sale' ? 'rotate-180 text-[#B8071C]' : 'text-gray-400'}`} />
                                </button>

                                {expandedSellItem === 'direct-sale' && (
                                    <div className={EXPANDED_ACTIONS_CLASS}>
                                        <button
                                            type="button"
                                            onClick={() => handleCreateClick(`/${language}/direct-sales/create`)}
                                            className={CREATE_BTN_CLASS}
                                        >
                                            <PlusIcon className="w-3 h-3" />
                                            {language === 'ar' ? 'إنشاء' : language === 'fr' ? 'Créer' : 'Create'}
                                        </button>
                                        <Link
                                            href={`/${language}/sell-guide?type=direct-sale`}
                                            onClick={() => setProfileDropdownOpen(false)}
                                            className={GUIDE_BTN_CLASS}
                                        >
                                            <Info className="w-3 h-3" strokeWidth={2} />
                                            {language === 'ar' ? 'الدليل' : language === 'fr' ? 'Guide' : 'Guide'}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gray-200/80 mx-2" />

                        {/* Sign Out */}
                        <div className="py-1.5">
                            <button
                                onClick={() => {
                                    setProfileDropdownOpen(false);
                                    void handleFullLogout();
                                }}
                                className={DROPDOWN_ITEM_CLASS}
                            >
                                <LogoutIcon />
                                {t("nav.logout")}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
