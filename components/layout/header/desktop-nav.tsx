"use client";

import React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface DesktopNavProps {
    language: string;
    t: any;
    pathname: string;
    handleSellMouseEnter: () => void;
    handleSellMouseLeave: () => void;
    sellDropdownOpen: boolean;
    isSellActive: boolean;
    isAuctionsActive: boolean;
}

export const DesktopNav: React.FC<DesktopNavProps> = ({
    language,
    t,
    pathname,
    handleSellMouseEnter,
    handleSellMouseLeave,
    sellDropdownOpen,
    isSellActive,
    isAuctionsActive
}) => {
    return (
        <nav className="hidden md:flex items-stretch h-full ms-4">
            {/* Buy - Direct Link to Direct Sales */}
            <Link
                href={`/${language}/direct-sales`}
                className={`
                flex items-center justify-center px-6 text-[17px] font-serif transition-colors h-full tracking-wide
                ${pathname.startsWith(`/${language}/direct-sales`) && !pathname.includes('/create') ? "text-[#B8071C]" : "text-[#1e2a5e] hover:text-[#B8071C]"}
            `}
            >
                {t("nav.buy") || "Buy"}
            </Link>

            {/* Sell - Mega Menu Trigger */}
            <div
                className="relative flex items-stretch h-full"
                onMouseEnter={handleSellMouseEnter}
                onMouseLeave={handleSellMouseLeave}
            >
                <button
                    className={`
                    flex items-center justify-center px-6 gap-1.5 transition-colors h-full
                    text-[17px] font-serif tracking-wide
                    ${(sellDropdownOpen || isSellActive) ? "text-[#B8071C]" : "text-[#1e2a5e] hover:text-[#B8071C]"}
                `}
                    onClick={(e) => {
                        e.preventDefault();
                    }}
                >
                    {t("nav.sell") || "Sell"}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${sellDropdownOpen ? "rotate-180" : ""}`} />
                </button>
            </div>

            {/* Auctions - Direct Link (no create option) */}
            <Link
                href={`/${language}/auctions`}
                className={`
                flex items-center justify-center px-6 text-[17px] font-serif transition-colors h-full tracking-wide
                ${isAuctionsActive ? "text-[#B8071C]" : "text-[#1e2a5e] hover:text-[#B8071C]"}
            `}
            >
                {t("nav.auctions") || "Auctions"}
            </Link>

            <Link
                href={`/${language}/karkey-cars`}
                className={`
                flex items-center justify-center px-6 text-[17px] font-serif transition-colors h-full tracking-wide
                ${pathname.startsWith(`/${language}/karkey-cars`) ? "text-[#B8071C]" : "text-[#1e2a5e] hover:text-[#B8071C]"}
            `}
            >
                {t("nav.karkey_cars") || "Karkey Cars"}
            </Link>

            <Link
                href={`/${language}/finance`}
                className={`
                flex items-center justify-center px-6 text-[17px] font-serif transition-colors h-full tracking-wide
                ${pathname.startsWith(`/${language}/finance`) ? "text-[#B8071C]" : "text-[#1e2a5e] hover:text-[#B8071C]"}
            `}
            >
                {t("nav.finance")}
            </Link>
        </nav>
    );
};
