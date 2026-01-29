"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

interface AnimatedCarProps {
    isPasswordVisible: boolean;
    isHoveringSubmit?: boolean;
    loginStatus?: "idle" | "loading" | "success" | "error";
    className?: string;
}

export function AnimatedCar({ isPasswordVisible, isHoveringSubmit = false, loginStatus = "idle", className = "" }: AnimatedCarProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Web Audio API State
    const audioCtxRef = useRef<AudioContext | null>(null);
    const mainOscRef = useRef<OscillatorNode | null>(null);
    const subOscRef = useRef<OscillatorNode | null>(null);
    const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const noiseGainRef = useRef<GainNode | null>(null);
    const filterNodeRef = useRef<BiquadFilterNode | null>(null);

    const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
    const [isAwake, setIsAwake] = useState(false);
    const [isEngineStarted, setIsEngineStarted] = useState(true);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    // Track precise position before launch
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

    // Track when success started to sync smoke burst
    const successStartTimeRef = useRef<number | null>(null);

    // Initial wakeup
    useEffect(() => {
        setMounted(true);
        const timer = setTimeout(() => setIsAwake(true), 500);

        // Visibility API Integration
        const handleVisibility = () => {
            setIsVisible(document.visibilityState === 'visible');
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    // Capture precise position before launch
    useEffect(() => {
        if (loginStatus === "success" && containerRef.current) {
            setAnchorRect(containerRef.current.getBoundingClientRect());
            successStartTimeRef.current = performance.now();
        } else if (loginStatus !== "success") {
            setAnchorRect(null);
            successStartTimeRef.current = null;
        }
    }, [loginStatus]);

    const initEngine = () => {
        if (typeof window === "undefined" || isUnlocked) return;
        try {
            if (!audioCtxRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioCtxRef.current = new AudioContextClass();
            }
            if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
            if (!mainOscRef.current) {
                const ctx = audioCtxRef.current;
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();
                const nGain = ctx.createGain();

                const osc1 = ctx.createOscillator(); osc1.type = 'sawtooth'; osc1.frequency.setValueAtTime(68, ctx.currentTime);
                const osc2 = ctx.createOscillator(); osc2.type = 'triangle'; osc2.frequency.setValueAtTime(34, ctx.currentTime);

                const bufferSize = 2 * ctx.sampleRate;
                const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const output = noiseBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
                const noise = ctx.createBufferSource(); noise.buffer = noiseBuffer; noise.loop = true;

                nGain.gain.setValueAtTime(0, ctx.currentTime);
                filter.type = 'lowpass'; filter.frequency.setValueAtTime(250, ctx.currentTime); filter.Q.setValueAtTime(2, ctx.currentTime);
                gain.gain.setValueAtTime(0, ctx.currentTime);

                osc1.connect(filter); osc2.connect(filter); noise.connect(nGain); nGain.connect(filter);
                filter.connect(gain); gain.connect(ctx.destination);

                osc1.start(); osc2.start(); noise.start();
                mainOscRef.current = osc1; subOscRef.current = osc2; noiseNodeRef.current = noise; gainNodeRef.current = gain; noiseGainRef.current = nGain; filterNodeRef.current = filter;
            }
            if (gainNodeRef.current && isEngineStarted) gainNodeRef.current.gain.linearRampToValueAtTime(0.4, audioCtxRef.current.currentTime + 1);
            setIsUnlocked(true);
        } catch (e) {
            console.error("Audio engine initialization failed:", e);
        }
    };

    useEffect(() => {
        const handleInteraction = () => { if (!isUnlocked) initEngine(); else if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume(); };
        window.addEventListener('mousedown', handleInteraction); window.addEventListener('keydown', handleInteraction); window.addEventListener('scroll', handleInteraction);
        return () => { window.removeEventListener('mousedown', handleInteraction); window.removeEventListener('keydown', handleInteraction); window.removeEventListener('scroll', handleInteraction); };
    }, [isUnlocked]);

    useEffect(() => () => { if (audioCtxRef.current) audioCtxRef.current.close(); }, []);

    const toggleEngine = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isUnlocked) { initEngine(); return; }
        const nextState = !isEngineStarted;
        setIsEngineStarted(nextState);
        if (gainNodeRef.current && audioCtxRef.current) {
            const now = audioCtxRef.current.currentTime;
            gainNodeRef.current.gain.linearRampToValueAtTime(nextState ? 0.4 : 0, now + 0.5);
        }
    };

    // --- ENERGETIC SPIRALING EMERALD MIST SYSTEM ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        let animationFrameId: number;
        const particles: any[] = [];

        const updateSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', updateSize);
        updateSize();

        class SmokeParticle {
            x: number; y: number; size: number; speedX: number; speedY: number;
            opacity: number; life: number; maxLife: number; color: string;

            constructor(x: number, y: number, isExpolsive: boolean = false) {
                this.x = x;
                this.y = y;
                this.size = Math.random() * (isExpolsive ? 45 : 15) + (isExpolsive ? 15 : 5);
                this.speedX = (Math.random() - 0.5) * (isExpolsive ? 28 : 3);
                this.speedY = (Math.random() - 0.5) * (isExpolsive ? 22 : 3) - (isExpolsive ? 8 : 1);
                this.color = "0, 166, 81";
                this.opacity = 0.03 + Math.random() * 0.06;
                this.maxLife = Math.random() * 250 + 400;
                this.life = this.maxLife;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (loginStatus === "success") {
                    this.size += 0.75;
                    this.opacity = Math.min(0.55, this.opacity + 0.005);
                } else {
                    this.life--;
                    this.opacity = (this.life / this.maxLife) * 0.18;
                }
                this.speedX *= 0.985;
                this.speedY *= 0.985;
            }

            draw() {
                if (!ctx) return;
                ctx.globalAlpha = this.opacity;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgb(${this.color})`;
                ctx.fill();
            }
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;

            if (loginStatus === "success" && successStartTimeRef.current) {
                const elapsed = performance.now() - successStartTimeRef.current;
                if (elapsed > 450) {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                        const carX = rect.left + rect.width / 2;
                        const carY = rect.top + rect.height * 0.7;
                        const spawnCount = elapsed > 1000 ? 5 : 3;
                        for (let i = 0; i < spawnCount; i++) {
                            particles.push(new SmokeParticle(carX + (Math.random() - 0.5) * 200, carY, true));
                        }
                    }
                }
            }

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                if (particles[i].life <= 0 && loginStatus !== "success") {
                    particles.splice(i, 1);
                    i--;
                }
            }

            const max = loginStatus === "success" ? 1000 : 250;
            if (particles.length > max) particles.splice(0, particles.length - max);
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();
        return () => {
            window.removeEventListener('resize', updateSize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [loginStatus]);

    // Visibility & Recovery Audio Sync
    useEffect(() => {
        if (!mainOscRef.current || !subOscRef.current || !audioCtxRef.current || !gainNodeRef.current || !filterNodeRef.current || !noiseGainRef.current) return;
        const now = audioCtxRef.current.currentTime;

        // 1. Tab Visibility (Global Pause)
        if (!isVisible) {
            gainNodeRef.current.gain.linearRampToValueAtTime(0, now + 0.3);
            return;
        }

        // 2. Password Visibility (Stealth Mode)
        if (isPasswordVisible) {
            gainNodeRef.current.gain.linearRampToValueAtTime(0, now + 0.3);
            return;
        }

        if (loginStatus === "success" && isEngineStarted && isUnlocked) {
            mainOscRef.current.frequency.setValueAtTime(400, now + 0.1);
            mainOscRef.current.frequency.linearRampToValueAtTime(650, now + 0.3);
            mainOscRef.current.frequency.exponentialRampToValueAtTime(1000, now + 1.2);
            gainNodeRef.current.gain.linearRampToValueAtTime(1.0, now + 0.4);
            gainNodeRef.current.gain.linearRampToValueAtTime(0, now + 1.8);
        } else if (loginStatus === "error" && isEngineStarted && isUnlocked) {
            const stallDuration = 1.3;
            mainOscRef.current.frequency.setValueAtTime(240, now);
            mainOscRef.current.frequency.exponentialRampToValueAtTime(12, now + stallDuration);
            filterNodeRef.current.type = 'lowpass';
            filterNodeRef.current.Q.setValueAtTime(8, now);
            filterNodeRef.current.frequency.setValueAtTime(400, now);
            filterNodeRef.current.frequency.exponentialRampToValueAtTime(40, now + stallDuration);
            gainNodeRef.current.gain.setValueAtTime(0.8, now);
            gainNodeRef.current.gain.exponentialRampToValueAtTime(0.1, now + 0.2);
            gainNodeRef.current.gain.exponentialRampToValueAtTime(0.7, now + 0.35);
            gainNodeRef.current.gain.exponentialRampToValueAtTime(0.05, now + 0.55);
            gainNodeRef.current.gain.exponentialRampToValueAtTime(0.5, now + 0.7);
            gainNodeRef.current.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
            gainNodeRef.current.gain.exponentialRampToValueAtTime(0.2, now + 1.0);
            gainNodeRef.current.gain.linearRampToValueAtTime(0, now + stallDuration);
        } else if (loginStatus === "idle" && isEngineStarted && isUnlocked) {
            // 3. ROBUST VOLUME RECOVERY & RESONANCE RESET
            filterNodeRef.current.type = 'lowpass';
            filterNodeRef.current.Q.setTargetAtTime(2, now, 0.3);
            filterNodeRef.current.frequency.setTargetAtTime(250, now, 0.3);
            mainOscRef.current.frequency.exponentialRampToValueAtTime(isHoveringSubmit ? 150 : 68, now + 0.5);
            gainNodeRef.current.gain.linearRampToValueAtTime(isHoveringSubmit ? 0.7 : 0.4, now + 0.5);
            noiseGainRef.current.gain.setTargetAtTime(0, now, 0.1);
        } else if (loginStatus === "loading" && isEngineStarted && isUnlocked) {
            mainOscRef.current.frequency.exponentialRampToValueAtTime(120, now + 0.3);
            gainNodeRef.current.gain.linearRampToValueAtTime(0.5, now + 0.3);
        } else {
            gainNodeRef.current.gain.linearRampToValueAtTime(0, now + 0.5);
        }
    }, [isHoveringSubmit, isEngineStarted, isUnlocked, loginStatus, isPasswordVisible, isVisible]);

    // Interaction Physics
    const springX = useSpring(0, { stiffness: 100, damping: 15 });
    const springY = useSpring(0, { stiffness: 100, damping: 15 });
    const tiltX = useTransform(springY, [-8, 8], [2, -2]);
    const tiltY = useTransform(springX, [-8, 8], [-1, 1]);
    const reflectionOffset = useTransform(springX, [-8, 8], [-15, 15]);

    useEffect(() => {
        if (isPasswordVisible || loginStatus === "success") return;
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(-8, Math.min(8, (e.clientX - (rect.left + rect.width / 2)) / 20));
            const y = Math.max(-8, Math.min(8, (e.clientY - (rect.top + rect.height * 0.6)) / 20));
            setEyeOffset({ x, y: y * 0.5 }); springX.set(x); springY.set(y);
        };
        window.addEventListener("mousemove", handleMouseMove); return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [isPasswordVisible, loginStatus, springX, springY]);

    // CAR CONTENT COMPONENT
    const carContent = (
        <motion.svg
            viewBox="0 0 500 350"
            className="w-full h-full pointer-events-none"
            style={{
                zIndex: loginStatus === 'success' ? 2000000 : 100,
                filter: loginStatus === 'success' ? "none" : "drop-shadow(0 40px 60px rgba(0,0,0,0.3))",
                rotateX: loginStatus === "success" ? 0 : tiltX,
                rotateY: loginStatus === "success" ? 0 : tiltY,
                transformStyle: "preserve-3d",
                willChange: "transform, opacity"
            }}
            variants={{
                idle: { opacity: 1, scale: 1, x: 0, y: 0 },
                error: { x: [0, -5, 5, -5, 5, 0], transition: { duration: 0.4 } },
                success: {
                    y: [0, -60, 0, 15, 1800],
                    scale: [1, 1.15, 1, 0.9, 30],
                    opacity: [1, 1, 1, 1, 0],
                    transition: { duration: 1.5, times: [0, 0.15, 0.25, 0.35, 0.85], ease: "easeIn" }
                }
            }}
            initial="idle"
            animate={loginStatus}
        >
            <defs>
                <linearGradient id="bodyHighGloss" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#800000" /><stop offset="15%" stopColor="#D90A2C" /><stop offset="35%" stopColor="#B8071C" /><stop offset="60%" stopColor="#700000" /><stop offset="100%" stopColor="#200000" />
                </linearGradient>
                <linearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#4a4a4a" /><stop offset="100%" stopColor="#000" /></linearGradient>
                <linearGradient id="chromeReflect" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#fff" stopOpacity="0.8" /><stop offset="100%" stopColor="#fff" stopOpacity="0" /></linearGradient>
                <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                <filter id="redAlertGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="blur" /><feFlood floodColor="#ff0000" floodOpacity="0.5" /><feComposite in2="blur" operator="in" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                <radialGradient id="beamGradient" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ffffe0" stopOpacity="1" /><stop offset="100%" stopColor="#DEB735" stopOpacity="0" /></radialGradient>
            </defs>

            <motion.ellipse
                cx="250" cy="285" rx="190" ry="12" fill="black" opacity="0.6" filter="blur(15px)"
                animate={{ rx: loginStatus === "success" ? 1200 : isHoveringSubmit ? [190, 215, 190] : [190, 200, 190], opacity: loginStatus === "success" ? 0 : 0.6 }}
                transition={{ duration: isHoveringSubmit ? 0.6 : 3.0, repeat: loginStatus === "success" ? 0 : Infinity }}
            />

            <motion.g
                initial={{ y: 20 }}
                animate={{
                    y: (isHoveringSubmit && isEngineStarted && isUnlocked) ? [0, -10, 0] : [0, -4, 0],
                    x: (isHoveringSubmit && isEngineStarted && isUnlocked) ? [0, 0.4, -0.4, 0] : 0
                }}
                transition={{
                    y: { duration: (isHoveringSubmit && isEngineStarted && isUnlocked) ? 0.5 : 3.5, repeat: Infinity, ease: "easeInOut" },
                    x: { duration: 0.1, repeat: Infinity }
                }}
            >
                <path d="M 45 220 L 35 270 L 100 270 L 110 220 Z" fill="#121212" />
                <path d="M 390 220 L 400 270 L 465 270 L 455 220 Z" fill="#121212" />
                <rect x="100" y="240" width="300" height="30" fill="#050505" />

                <path d="M 250 115 C 140 120, 70 165, 45 205 C 35 235, 35 255, 55 265 C 95 275, 405 275, 445 265 C 465 255, 465 235, 455 205 C 430 165, 360 120, 250 115 Z" fill="url(#bodyHighGloss)" />
                <path d="M 125 155 L 165 95 Q 250 85 335 95 L 375 155 Q 250 165 125 155 Z" fill="url(#glassGradient)" />
                <motion.path d="M 135 150 L 365 150 L 335 95 L 165 95 Z" fill="url(#chromeReflect)" opacity="0.1" style={{ x: reflectionOffset }} />
                <image href="/logo.png" x="215" y="225" height="35" width="70" />
                <path d="M 130 255 L 145 270 L 355 270 L 370 255 Q 250 248 130 255 Z" fill="#101010" />

                <g transform="translate(85, 205)">
                    <path d="M 0 5 Q 30 -5, 75 10 L 65 25 Q 30 15, 0 5 Z" fill="#020202" />
                    <motion.path d="M 5 10 Q 30 5, 60 15" fill="none" stroke={loginStatus === "error" ? "#ff0000" : "#DEB735"} strokeWidth="2.5" animate={isAwake ? { opacity: loginStatus === "success" ? [1, 0, 1, 0, 1] : loginStatus === "error" ? [1, 0.4, 1] : (isHoveringSubmit && isEngineStarted && isUnlocked) ? [0.8, 1, 0.8] : 0.8 } : { opacity: 0 }} transition={{ duration: loginStatus === "success" ? 0.2 : loginStatus === "error" ? 0.1 : 0.4, repeat: (loginStatus === "success") ? 2 : (loginStatus === "error" || (isHoveringSubmit && isEngineStarted && isUnlocked)) ? Infinity : 0 }} />
                    <g transform={`translate(${35 + eyeOffset.x}, ${12 + eyeOffset.y})`}>
                        {!isPasswordVisible && isAwake && (
                            <motion.g filter={loginStatus === "error" || loginStatus === "success" ? "none" : "url(#goldGlow)"} animate={{ scale: (isHoveringSubmit && isEngineStarted && isUnlocked) ? [1, 1.25, 1] : 1, opacity: loginStatus === "error" ? [1, 0, 1] : (loginStatus === "success" ? [1, 0, 1, 0, 1] : 1) }} transition={{ duration: 0.15, repeat: (loginStatus === "error" || (isHoveringSubmit && isEngineStarted && isUnlocked)) ? Infinity : (loginStatus === "success" ? 2 : 0) }}><circle r="14" fill={loginStatus === "error" ? "#ff0000" : "url(#beamGradient)"} opacity={loginStatus === "error" ? 0.8 : 1} /><circle r="5" fill="#fff" /></motion.g>
                        )}
                    </g>
                </g>
                <g transform="translate(340, 205)">
                    <path d="M 75 5 Q 45 -5, 0 10 L 10 25 Q 45 15, 75 5 Z" fill="#020202" />
                    <motion.path d="M 70 10 Q 45 5, 15 15" fill="none" stroke={loginStatus === "error" ? "#ff0000" : "#DEB735"} strokeWidth="2.5" animate={isAwake ? { opacity: loginStatus === "success" ? [1, 0, 1, 0, 1] : loginStatus === "error" ? [1, 0.4, 1] : (isHoveringSubmit && isEngineStarted && isUnlocked) ? [0.8, 1, 0.8] : 0.8 } : { opacity: 0 }} transition={{ duration: loginStatus === "success" ? 0.2 : loginStatus === "error" ? 0.1 : 0.4, repeat: (loginStatus === "success") ? 2 : (loginStatus === "error" || (isHoveringSubmit && isEngineStarted && isUnlocked)) ? Infinity : 0 }} />
                    <g transform={`translate(${40 + eyeOffset.x}, ${12 + eyeOffset.y})`}>
                        {!isPasswordVisible && isAwake && (
                            <motion.g filter={loginStatus === "error" || loginStatus === "success" ? "none" : "url(#goldGlow)"} animate={{ scale: (isHoveringSubmit && isEngineStarted && isUnlocked) ? [1, 1.25, 1] : 1, opacity: loginStatus === "error" ? [1, 0, 1] : (loginStatus === "success" ? [1, 0, 1, 0, 1] : 1) }} transition={{ duration: 0.15, repeat: (loginStatus === "error" || (isHoveringSubmit && isEngineStarted && isUnlocked)) ? Infinity : (loginStatus === "success" ? 2 : 0) }}><circle r="14" fill={loginStatus === "error" ? "#ff0000" : "url(#beamGradient)"} opacity={loginStatus === "error" ? 0.8 : 1} /><circle r="5" fill="#fff" /></motion.g>
                        )}
                    </g>
                </g>
            </motion.g>
        </motion.svg>
    );

    return (
        <div ref={containerRef} className={`relative perspective-1000 ${className}`}>
            {/* Audio Toggle Relocation */}
            {mounted && (
                <div className="absolute top-2 right-2 z-[200]">
                    <motion.button
                        type="button"
                        onClick={toggleEngine}
                        className={`h-9 w-9 rounded-full shadow-md border backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${isEngineStarted && isUnlocked ? 'bg-red-50/80 border-red-200' : 'bg-white/80 border-gray-100'}`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        {isEngineStarted && isUnlocked ? <Volume2 className="w-4 h-4 text-[#B8071C]" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
                    </motion.button>
                </div>
            )}

            {mounted && typeof document !== "undefined" && (
                <>
                    {createPortal(
                        <canvas
                            ref={canvasRef}
                            className="fixed inset-0 pointer-events-none z-[1000000]"
                            style={{ mixBlendMode: 'normal' }}
                        />,
                        document.body
                    )}
                    {loginStatus === 'success' && anchorRect ? createPortal(
                        <AnimatePresence>
                            <div className="fixed pointer-events-none z-[2000000]" style={{ top: anchorRect.top, left: anchorRect.left, width: anchorRect.width, height: anchorRect.height }}>
                                {carContent}
                            </div>
                        </AnimatePresence>,
                        document.body
                    ) : (
                        loginStatus !== 'success' && carContent
                    )}
                </>
            )}
        </div>
    );
}
