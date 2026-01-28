"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCarProps {
    isPasswordVisible: boolean;
    className?: string;
}

export function AnimatedCar({ isPasswordVisible, className = "" }: AnimatedCarProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
    const [isBlinking, setIsBlinking] = useState(false);

    // Track cursor position
    useEffect(() => {
        if (isPasswordVisible) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height * 0.6;

            const deltaX = e.clientX - centerX;
            const deltaY = e.clientY - centerY;

            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxOffset = 8; // Slightly increased range for larger car

            if (distance > 0) {
                const normalizedX = (deltaX / distance) * Math.min(distance * 0.1, maxOffset);
                const normalizedY = (deltaY / distance) * Math.min(distance * 0.1, maxOffset);
                setEyeOffset({
                    x: normalizedX,
                    y: normalizedY * 0.5,
                });
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [isPasswordVisible]);

    // Privacy Mode (Look down)
    useEffect(() => {
        if (isPasswordVisible) {
            setEyeOffset({ x: 0, y: 8 });
        }
    }, [isPasswordVisible]);

    // Occasional flicker
    useEffect(() => {
        const blinkInterval = setInterval(() => {
            if (Math.random() > 0.7) {
                setIsBlinking(true);
                setTimeout(() => setIsBlinking(false), 100);
            }
        }, 4000);

        return () => clearInterval(blinkInterval);
    }, []);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <svg
                viewBox="0 0 500 300"
                className="w-full h-full"
                style={{ filter: "drop-shadow(0 60px 80px rgba(0,0,0,0.5))" }}
            >
                <defs>
                    {/* Metallic Red Body */}
                    <linearGradient id="bodyHighGloss" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#800000" />
                        <stop offset="15%" stopColor="#D90A2C" />
                        <stop offset="35%" stopColor="#B8071C" />
                        <stop offset="60%" stopColor="#700000" />
                        <stop offset="85%" stopColor="#400000" />
                        <stop offset="100%" stopColor="#200000" />
                    </linearGradient>

                    {/* Realistic Glass Gradient (Grey/Reflective) */}
                    <linearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#4a4a4a" /> {/* Lighter grey top */}
                        <stop offset="40%" stopColor="#222" />    {/* Horizon line */}
                        <stop offset="50%" stopColor="#111" />
                        <stop offset="100%" stopColor="#000" />
                    </linearGradient>

                    {/* Chrome Reflection */}
                    <linearGradient id="chromeReflect" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
                        <stop offset="45%" stopColor="#ccc" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#fff" stopOpacity="0" /> {/* Sharp cut */}
                        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                    </linearGradient>

                    {/* Gold Glow for Lights */}
                    <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Headlight Beam (White/Gold) */}
                    <radialGradient id="beamGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffe0" stopOpacity="1" /> {/* Light Yellow/White */}
                        <stop offset="30%" stopColor="#fff8d0" stopOpacity="0.8" />
                        <stop offset="70%" stopColor="#DEB735" stopOpacity="0.2" /> {/* Gold Fade */}
                        <stop offset="100%" stopColor="#DEB735" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Floor Shadow */}
                <ellipse cx="250" cy="285" rx="190" ry="12" fill="black" opacity="0.6" filter="blur(15px)" />

                {/* Visible Sports Tires - Wide & Low */}
                <path
                    d="M 45 220 
                       L 35 270 
                       L 100 270 
                       L 110 220 Z"
                    fill="#151515"
                /> {/* Left Tire */}
                <path
                    d="M 390 220 
                       L 400 270 
                       L 465 270 
                       L 455 220 Z"
                    fill="#151515"
                /> {/* Right Tire */}

                {/* Undercarriage Shadow connecting tires */}
                <rect x="100" y="240" width="300" height="30" fill="#050505" />


                {/* === MAIN BODY === */}
                <path
                    d="M 250 115 
             C 140 120, 70 165, 45 205
             C 35 235, 35 255, 55 265
             C 95 275, 405 275, 445 265
             C 465 255, 465 235, 455 205
             C 430 165, 360 120, 250 115
             Z"
                    fill="url(#bodyHighGloss)"
                />

                {/* Gloss Highlight */}
                <path
                    d="M 250 120 
             C 320 125, 380 150, 420 180
             Q 400 160, 250 140
             Q 100 160, 80 180
             C 120 150, 180 125, 250 120 Z"
                    fill="white"
                    opacity="0.12"
                    filter="blur(3px)"
                />

                {/* Windshield - Grey/Glassy Tint */}
                <path
                    d="M 125 155
               L 165 95 
               Q 250 85 335 95
               L 375 155
               Q 250 165 125 155 Z"
                    fill="url(#glassGradient)"
                    stroke="#444"
                    strokeWidth="1.5"
                />

                {/* Windshield Reflection */}
                <path d="M 135 150 L 365 150 L 335 95 L 165 95 Z" fill="url(#chromeReflect)" opacity="0.3" />

                {/* Hood Lines */}
                <path d="M 250 170 L 190 230" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" fill="none" />
                <path d="M 250 170 L 310 230" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" fill="none" />

                {/* HOOD LOGO - Real Image */}
                <image
                    href="/logo.png"
                    x="215"
                    y="225"
                    height="35"
                    width="70"
                    preserveAspectRatio="xMidYMid meet"
                    transform="rotate(0, 250, 240)"
                    style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }}
                />

                {/* Grille */}
                <path
                    d="M 130 255 
               L 145 270 
               L 355 270 
               L 370 255 
               Q 250 248 130 255 Z"
                    fill="#101010"
                />
                <path d="M 145 262 L 355 262" stroke="#222" strokeWidth="1" strokeDasharray="3 3" />

                {/* === HEADLIGHTS (Royale Gold/Green Accent) === */}

                {/* LEFT ACCENT */}
                <g transform="translate(85, 205)">
                    {/* Housing */}
                    <path d="M 0 5 Q 30 -5, 75 10 L 65 25 Q 30 15, 0 5 Z" fill="#020202" stroke="#222" strokeWidth="0.5" />

                    {/* Angel Eye / DRL - Royal Gold */}
                    <path d="M 5 10 Q 30 5, 60 15" fill="none" stroke="#DEB735" strokeWidth="2.5" filter="url(#goldGlow)" opacity="0.8" />

                    {/* PROJECTOR */}
                    <g transform={`translate(${35 + eyeOffset.x}, ${12 + eyeOffset.y})`}>
                        {isPasswordVisible ? (
                            <circle r="10" fill="#111" stroke="#222" />
                        ) : (
                            <g filter="url(#goldGlow)">
                                <circle r="14" fill="url(#beamGradient)" opacity={isBlinking ? 0.6 : 1} />
                                <circle r="5" fill="#fff" opacity={isBlinking ? 0.4 : 1} />
                            </g>
                        )}
                    </g>
                </g>

                {/* RIGHT ACCENT */}
                <g transform="translate(340, 205)">
                    {/* Housing */}
                    <path d="M 75 5 Q 45 -5, 0 10 L 10 25 Q 45 15, 75 5 Z" fill="#020202" stroke="#222" strokeWidth="0.5" />

                    {/* Angel Eye / DRL - Royal Gold */}
                    <path d="M 70 10 Q 45 5, 15 15" fill="none" stroke="#DEB735" strokeWidth="2.5" filter="url(#goldGlow)" opacity="0.8" />

                    {/* PROJECTOR */}
                    <g transform={`translate(${40 + eyeOffset.x}, ${12 + eyeOffset.y})`}>
                        {isPasswordVisible ? (
                            <circle r="10" fill="#111" stroke="#222" />
                        ) : (
                            <g filter="url(#goldGlow)">
                                <circle r="14" fill="url(#beamGradient)" opacity={isBlinking ? 0.6 : 1} />
                                <circle r="5" fill="#fff" opacity={isBlinking ? 0.4 : 1} />
                            </g>
                        )}
                    </g>
                </g>

            </svg>
        </div>
    );
}
