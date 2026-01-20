"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n-context";
import { ChevronDown } from "lucide-react";

interface AlternatingCTAButtonsProps {
    onSellClick: () => void;
    isSellMenuOpen: boolean;
}

/**
 * Alternating CTA Buttons Component
 * Smoothly alternates between "Sell Your Car" and "Sign In" buttons every 3 seconds
 * with a professional fade/slide transition
 */
export default function AlternatingCTAButtons({ onSellClick, isSellMenuOpen }: AlternatingCTAButtonsProps) {
    const { language, t } = useTranslation();
    const [activeButton, setActiveButton] = useState<'sell' | 'signin'>('sell');
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Pause alternation when sell menu is open
    const shouldAlternate = !isSellMenuOpen;

    const transition = useCallback(() => {
        setIsTransitioning(true);
        // Wait for fade-out, then switch
        setTimeout(() => {
            setActiveButton(prev => prev === 'sell' ? 'signin' : 'sell');
            setIsTransitioning(false);
        }, 300); // Match CSS transition duration
    }, []);

    useEffect(() => {
        if (!shouldAlternate) return;

        const interval = setInterval(() => {
            transition();
        }, 3000);

        return () => clearInterval(interval);
    }, [shouldAlternate, transition]);

    // Reset to sell button when menu opens
    useEffect(() => {
        if (isSellMenuOpen) {
            setActiveButton('sell');
            setIsTransitioning(false);
        }
    }, [isSellMenuOpen]);

    const sellButtonText = t("sell_menu.sell_your_car") || 'Sell Your Car';
    const signInText = t("nav.signin") || 'Sign In';

    return (
        <div className="relative h-[40px] w-[140px] sm:w-[160px]">
            {/* Sell Your Car Button */}
            <button
                onClick={onSellClick}
                className={`
                    absolute inset-0 flex items-center justify-center gap-2 px-6 py-2.5 rounded-full 
                    bg-[#B8071C] hover:bg-[#9C0618] text-white 
                    font-medium text-[13px] sm:text-[14px] shadow-sm
                    transition-all duration-300 ease-in-out
                    ${activeButton === 'sell' && !isTransitioning 
                        ? 'opacity-100 translate-y-0 scale-100' 
                        : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}
                    ${isSellMenuOpen ? "ring-4 ring-[#B8071C]/20" : ""}
                `}
            >
                <span className="whitespace-nowrap">{sellButtonText}</span>
                <ChevronDown 
                    size={14} 
                    className={`opacity-80 transition-transform duration-200 ${isSellMenuOpen ? "rotate-180" : ""}`} 
                />
            </button>

            {/* Sign In Button */}
            <Link
                href={`/${language}/auth/login`}
                className={`
                    absolute inset-0 flex items-center justify-center px-6 py-2.5 rounded-full 
                    border-2 border-[#B8071C] text-[#B8071C] bg-white
                    hover:bg-[#B8071C] hover:text-white
                    font-semibold text-[13px] sm:text-[14px] shadow-sm
                    transition-all duration-300 ease-in-out
                    ${activeButton === 'signin' && !isTransitioning 
                        ? 'opacity-100 translate-y-0 scale-100' 
                        : 'opacity-0 translate-y-2 scale-95 pointer-events-none'}
                `}
            >
                <span className="whitespace-nowrap">{signInText}</span>
            </Link>
        </div>
    );
}
