"use client";

import { m, AnimatePresence } from "framer-motion";
import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

interface LuxuryLoaderProps {
    size?: "sm" | "md" | "lg";
    className?: string;
    progress?: number; // Optional progress value to show
}

export function LuxuryLoader({ size = "md", className = "", progress }: LuxuryLoaderProps) {
    const dimensions = {
        sm: "w-10 h-10",
        md: "w-24 h-24",
        lg: "w-40 h-40",
    };

    const d = dimensions[size];

    // Generate tick marks for the speedometer
    const ticks = useMemo(() => {
        return Array.from({ length: 21 }).map((_, i) => ({
            id: i,
            rotation: -120 + i * 12, // From -120deg to 120deg (240deg arc)
            isLarge: i % 5 === 0,
        }));
    }, []);

    return (
        <div className={cn("relative flex items-center justify-center", d, className)}>
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white/20 rounded-full blur-[2px] opacity-20" />

            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                {/* Main Gauge Arc Background */}
                <path
                    d="M 43.7 132.5 A 65 65 0 1 1 156.3 132.5"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="opacity-20"
                />

                {/* Active Progress Arc (Shimmering) */}
                <m.path
                    d="M 43.7 132.5 A 65 65 0 1 1 156.3 132.5"
                    fill="none"
                    stroke="url(#speedoGradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: [0, 0.9, 0.7, 1, 0] }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "circInOut",
                    }}
                />

                {/* Ticks - Professional Scale */}
                {ticks.map((tick) => (
                    <line
                        key={tick.id}
                        x1="100"
                        y1="40"
                        x2="100"
                        y2={tick.isLarge ? "55" : "50"}
                        stroke={tick.isLarge ? "#64748b" : "#94a3b8"}
                        strokeWidth={tick.isLarge ? "2.5" : "1"}
                        transform={`rotate(${tick.rotation} 100 100)`}
                        className="opacity-60"
                    />
                ))}

                {/* Needle with "Motion Blur" effect */}
                <m.g
                    initial={{ rotate: -120 }}
                    animate={{ rotate: [-120, 96, 48, 120, -120] }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "circInOut",
                    }}
                    style={{ transformOrigin: "100px 100px" }}
                >
                    {/* Shadow Needle */}
                    <path
                        d="M 100 100 L 100 45"
                        stroke="black"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="opacity-5 blur-[1px] translate-x-1 translate-y-1"
                    />
                    {/* Main Needle */}
                    <path
                        d="M 100 100 L 100 45"
                        stroke="#B8071C"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_10px_rgba(184,7,28,0.5)]"
                    />
                    {/* Hub Cap */}
                    <circle cx="100" cy="100" r="12" fill="#0f172a" />
                    <circle cx="100" cy="100" r="5" fill="#B8071C" className="animate-pulse" />
                </m.g>

                <defs>
                    <linearGradient id="speedoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="50%" stopColor="#eab308" />
                        <stop offset="100%" stopColor="#B8071C" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Dash Meter Text */}
            <div className="absolute top-[62%] left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <m.div
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                    <span
                        className="block text-[#0f172a] font-medium tracking-[0.3em] uppercase font-serif"
                        style={{ fontSize: size === "sm" ? "6px" : size === "md" ? "8px" : "11px" }}
                    >
                        {progress !== undefined ? `${Math.round(progress)}%` : "KM/H"}
                    </span>
                    <div className="h-[2px] w-4 bg-[#B8071C] mx-auto mt-0.5 rounded-full" />
                </m.div>
            </div>
        </div>
    );
}
