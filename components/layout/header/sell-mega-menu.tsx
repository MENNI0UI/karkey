"use client";

import React from "react";
import Link from "next/link";

interface SellMegaMenuProps {
    sellDropdownOpen: boolean;
    handleSellMouseEnter: () => void;
    handleSellMouseLeave: () => void;
    sellNavItems: {
        createLabel: string;
        createHref: string;
        guideLabel: string;
        guideHref: string;
    };
    setSellDropdownOpen: (open: boolean) => void;
}

export const SellMegaMenu: React.FC<SellMegaMenuProps> = ({
    sellDropdownOpen,
    handleSellMouseEnter,
    handleSellMouseLeave,
    sellNavItems,
    setSellDropdownOpen
}) => {
    return (
        <div
            className={`fixed left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-[99999] hidden lg:block transition-all duration-150 ${sellDropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
            style={{ top: 'var(--site-header-height, 76px)' }}
            onMouseEnter={handleSellMouseEnter}
            onMouseLeave={handleSellMouseLeave}
        >
            <div className="w-full px-4 lg:px-6 xl:px-8 py-4">
                <div className="max-w-7xl mx-auto flex items-center gap-6">
                    <Link
                        href={sellNavItems.createHref}
                        onClick={() => setSellDropdownOpen(false)}
                        className="text-[17px] font-serif text-[#1e2a5e] underline-offset-4 decoration-[1.5px] hover:underline hover:text-[#103090] transition-colors"
                    >
                        {sellNavItems.createLabel}
                    </Link>
                    <Link
                        href={sellNavItems.guideHref}
                        onClick={() => setSellDropdownOpen(false)}
                        className="text-[17px] font-serif text-[#1e2a5e]/70 underline-offset-4 decoration-[1.5px] hover:underline hover:text-[#103090] transition-colors"
                    >
                        {sellNavItems.guideLabel}
                    </Link>
                </div>
            </div>
        </div>
    );
};
