"use client";

import React from "react";

interface WizardCardProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    stepIndicator?: string;
    className?: string;
}

export function WizardCard({
    children,
    title,
    subtitle,
    stepIndicator,
    className = "",
}: WizardCardProps) {
    return (
        <div className={`premium-glass-card rounded-3xl transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] ${className}`}>
            {(title || stepIndicator) && (
                <div className="px-8 lg:px-10 py-6 lg:py-7 border-b border-gray-100/60 flex items-start justify-between gap-4 bg-gradient-to-r from-white/50 to-transparent">
                    <div className="flex-1 min-w-0">
                        {title && (
                            <h2 className="text-lg lg:text-xl font-bold text-[#103090] font-serif tracking-tight leading-tight">{title}</h2>
                        )}
                        {subtitle && (
                            <p className="text-xs lg:text-sm text-gray-400 mt-1.5 font-sans leading-relaxed">{subtitle}</p>
                        )}
                    </div>
                    {stepIndicator && (
                        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#103090]/5 to-[#B8071C]/5 rounded-full border border-[#103090]/10">
                            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#103090] to-[#B8071C] animate-pulse" />
                            <span className="text-[9px] lg:text-[10px] font-black text-[#103090]/70 uppercase tracking-[0.15em] leading-none whitespace-nowrap">
                                {stepIndicator}
                            </span>
                        </div>
                    )}
                </div>
            )}
            <div className="p-8 lg:p-10">{children}</div>
        </div>
    );
}
