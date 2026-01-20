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
        <div className={`bg-white rounded-xl shadow-sm ${className}`}>
            {(title || stepIndicator) && (
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between font-serif">
                    <div>
                        {title && (
                            <h2 className="text-xl font-bold text-[#103090] font-serif">{title}</h2>
                        )}
                        {subtitle && (
                            <p className="text-base text-gray-500 mt-1">{subtitle}</p>
                        )}
                    </div>
                    {stepIndicator && (
                        <span className="text-sm font-bold text-gray-400 bg-gray-50 px-4 py-1.5 rounded-full">
                            {stepIndicator}
                        </span>
                    )}
                </div>
            )}
            <div className="p-8">{children}</div>
        </div>
    );
}
