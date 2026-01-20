"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { Gavel, Store, Car, ChevronDown, ShieldAlert, ShieldCheck, ArrowRight } from "lucide-react";

export interface SellMenuHandle {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    toggle: () => void;
}

interface SellMenuProps {
    /** Hide the main button (used when external button controls the menu) */
    hideButton?: boolean;
    /** External control of open state */
    externalOpen?: boolean;
    /** Callback when open state changes */
    onOpenChange?: (open: boolean) => void;
}

const SellMenu = forwardRef<SellMenuHandle, SellMenuProps>(function SellMenu(
    { hideButton = false, externalOpen, onOpenChange },
    ref
) {
    const [internalOpen, setInternalOpen] = useState(false);
    const { language, t } = useTranslation();
    const { user } = useAuth();
    const router = useRouter();

    // Use external control if provided, otherwise internal
    const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
    const setIsOpen = (open: boolean) => {
        if (externalOpen !== undefined) {
            onOpenChange?.(open);
        } else {
            setInternalOpen(open);
        }
    };

    // Expose handle to parent
    useImperativeHandle(ref, () => ({
        isOpen,
        setIsOpen,
        toggle: () => setIsOpen(!isOpen),
    }));

    const handleMainClick = () => {
        // Open for all users
        setIsOpen(!isOpen);
    };

    const options = [
        {
            title: t("nav.auctions") || "Auctions",
            description: t("sell_menu.auction_desc") || "Sell to the highest bidder",
            icon: Gavel,
            href: `/${language}/sell-guide?type=auction`,
        },
        {
            title: t("nav.direct_sales") || "Direct Sales",
            description: t("sell_menu.direct_sale_desc") || "Direct sale via Karkey secure service",
            icon: Car,
            href: `/${language}/sell-guide?type=direct-sale`,
        },
    ];

    return (
        <div className="relative">
            {!hideButton && (
                <button
                    onClick={handleMainClick}
                    className={`
          flex items-center gap-2.5 px-6 py-2.5 rounded-full 
          bg-[#B8071C] hover:bg-[#9C0618] text-white 
          font-medium text-[14px] shadow-sm transition-all
          ${isOpen ? "ring-4 ring-[#B8071C]/20" : ""}
        `}
                >
                    <span>{t("sell_menu.sell_your_car") || 'Sell Your Car'}</span>
                    {user && <ChevronDown size={14} className={`opacity-80 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />}
                </button>
            )}

            {/* Dropdown - Open for All Users */}
            {isOpen && (
                <>
                    {/* Invisible overlay to close dropdown when clicking/tapping outside */}
                    <div
                        className="fixed inset-0 z-[100001]"
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    />
                    <div className="absolute right-0 top-full mt-3 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden z-[100002] animate-in fade-in slide-in-from-top-2 duration-200">

                        {/* Guest Auth Section (Only for Not Logged In) */}
                        {!user && (
                            <div className="bg-gray-50 p-4 border-b border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900 mb-1">
                                    {t("sell_menu.ready_to_sell") || 'Ready to sell?'}
                                </h3>
                                <p className="text-[12px] text-gray-500 mb-3 leading-snug">
                                    {t("sell_menu.ready_to_sell_desc") || 'Log in if you have an account, or register to get started.'}
                                </p>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/${language}/auth/login`}
                                        onClick={() => setIsOpen(false)}
                                        className="flex-1 py-2 text-center rounded-lg bg-white border border-gray-200 text-[13px] font-bold text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors"
                                    >
                                        {t("nav.signin")}
                                    </Link>
                                    <Link
                                        href={`/${language}/auth/register`}
                                        onClick={() => setIsOpen(false)}
                                        className="flex-1 py-2 text-center rounded-lg bg-[#B8071C] text-[13px] font-bold text-white hover:bg-[#910515] transition-colors"
                                    >
                                        {t("nav.signup")}
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Selling Options */}
                        <div className="p-2">
                            {options.map((option, idx) => (
                                <Link
                                    key={idx}
                                    href={option.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`
                  flex items-start gap-4 p-4 rounded-lg transition-colors group text-left
                  hover:bg-gray-50 cursor-pointer
                `}
                                >
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-[#B8071C] group-hover:text-white transition-colors duration-300">
                                        <option.icon size={16} />
                                    </div>
                                    <div>
                                        <h3 className="text-[14px] font-bold text-gray-900 group-hover:text-[#B8071C] transition-colors">
                                            {option.title}
                                        </h3>
                                        <p className="text-[12px] text-gray-500 mt-0.5 font-medium">
                                            {option.description}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});

export default SellMenu;

