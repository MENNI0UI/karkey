"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "@/lib/i18n-context";
import { m } from "framer-motion";

export interface WizardStep {
    id: string;
    label: string;
    description?: string;
}

interface WizardLayoutProps {
    readonly steps: readonly WizardStep[];
    readonly currentStep: number;
    readonly children: React.ReactNode;
    readonly title: string;
    readonly subtitle?: string;
    readonly onStepNav?: (step: number) => void;
}

export function WizardLayout({
    steps,
    currentStep,
    children,
    title,
    subtitle,
}: WizardLayoutProps) {
    const { dir, t } = useTranslation();
    const isRtl = dir === "rtl";

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-serif overflow-x-hidden">
            {/* Cinematic Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-50/30 rounded-full blur-[120px] -translate-y-1/2" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-red-50/20 rounded-full blur-[150px] translate-y-1/2" />
            </div>

            <div className="relative z-10 w-full pt-[85px] lg:pt-8 pb-20 mx-auto px-4 lg:px-6 max-w-[1400px]">
                {/* Header Section */}
                <m.div
                    initial={{ opacity: 0, y: -10, filter: "blur(5px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-8 text-center"
                >
                    <h1 className="text-2xl lg:text-3xl font-bold text-[#103090] font-serif tracking-tight mb-2">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-sm text-gray-500 max-w-2xl mx-auto font-sans leading-relaxed text-balance">
                            {subtitle}
                        </p>
                    )}
                </m.div>

                {/* Horizontal Stepper - The centerpiece */}
                <m.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mb-16 hidden lg:block"
                >
                    <div className="relative max-w-7xl mx-auto px-10">
                        {/* Connector Line Track (Background) */}
                        <div className="absolute top-[22px] left-[62px] right-[62px] h-[2px] z-0">
                            {/* Track Background */}
                            <div className="absolute inset-0 bg-gray-200/40 backdrop-blur-sm rounded-full" />

                            {/* Active Progress Segment */}
                            <m.div
                                className="absolute inset-y-0 bg-[#103090] rounded-full shadow-sm"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    [isRtl ? "right" : "left"]: 0,
                                    transformOrigin: isRtl ? "right" : "left"
                                }}
                            />
                        </div>

                        <div className="relative flex justify-between items-start w-full">
                            {steps.map((step, index) => {
                                const stepNumber = index + 1;
                                const isCompleted = stepNumber < currentStep;
                                const isCurrent = stepNumber === currentStep;

                                return (
                                    <div
                                        key={step.id}
                                        className="relative flex flex-col items-center"
                                        style={{ width: '44px' }} // Width of the node circle
                                    >
                                        {/* Node Indicator & content node */}
                                        <div className="relative z-10 flex flex-col items-center">
                                            {/* Node Indicator */}
                                            <div className="relative mb-4 group cursor-default">
                                                {isCompleted ? (
                                                    <m.div
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="w-11 h-11 rounded-full bg-[#103090] flex items-center justify-center shadow-md shadow-blue-900/10 relative"
                                                    >
                                                        <Check className="w-5 h-5 text-white stroke-[3px]" />
                                                    </m.div>
                                                ) : isCurrent ? (
                                                    <m.div
                                                        initial={{ scale: 0.9 }}
                                                        animate={{ scale: 1 }}
                                                        className="relative"
                                                    >
                                                        <div className="w-11 h-11 rounded-full bg-white border-[3px] border-[#B8071C] flex items-center justify-center shadow-lg shadow-red-500/5 relative z-10">
                                                            <span className="text-[#B8071C] font-black font-serif text-lg">{stepNumber}</span>
                                                        </div>
                                                    </m.div>
                                                ) : (
                                                    <div className="w-11 h-11 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center group-hover:border-gray-200 transition-all duration-300">
                                                        <span className="text-gray-300 font-bold font-serif text-lg group-hover:text-gray-400">{stepNumber}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Step Labels */}
                                            <div className="text-center absolute top-14 left-1/2 -translate-x-1/2 w-[160px]">
                                                <span
                                                    className={`block text-[10px] uppercase tracking-[0.2em] mb-1.5 transition-colors duration-500 ${isCurrent ? "text-[#103090]" : isCompleted ? "text-gray-500" : "text-gray-400"
                                                        } ${isRtl ? "font-bold" : "font-medium"}`}
                                                >
                                                    {step.label}
                                                </span>
                                                {step.description && isCurrent && (
                                                    <m.p
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="text-[10px] text-gray-400 font-sans leading-tight px-2 mx-auto"
                                                    >
                                                        {step.description}
                                                    </m.p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </m.div>

                {/* Mobile Stepper - Simplified Premium */}
                <div className="lg:hidden fixed top-[76px] left-0 right-0 bg-white/98 backdrop-blur-xl border-b border-gray-100 z-[9995] px-6 py-4 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-[#B8071C] uppercase tracking-[0.2em] mb-0.5">
                            {t("wizard.progress.step_of", { current: currentStep, total: steps.length })}
                        </span>
                        <h2 className="text-base font-bold text-[#103090] font-serif">
                            {steps[currentStep - 1]?.label}
                        </h2>
                    </div>
                    {/* Progress Fill */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-50">
                        <m.div
                            className="h-full bg-gradient-to-r from-[#103090] to-[#B8071C]"
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="relative flex flex-col items-center">
                    {/* Content Section */}
                    <m.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full max-w-7xl"
                    >
                        {children}
                    </m.div>
                </div>
            </div >
        </div >
    );
}
