"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n-context";
import { Eye, EyeOff } from "lucide-react";
import { AnimatedCar } from "@/components/auth/animated-car";
import { motion } from "framer-motion";

export default function LoginPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loginStatus, setLoginStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [showPassword, setShowPassword] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [isHoveringSubmit, setIsHoveringSubmit] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setLoginStatus("loading");
        setError(null);
        try {
            const form = new FormData(e.target as HTMLFormElement);
            const email = String(form.get("email") ?? "").trim();
            const password = String(form.get("password") ?? "");

            const { signIn } = await import("next-auth/react");
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(t("auth.login.failed"));
                setLoginStatus("error");
                // Reset to idle after animation
                setTimeout(() => setLoginStatus("idle"), 2000);
                return;
            }

            setLoginStatus("success");

            try {
                localStorage.removeItem("auth:disabled");
                localStorage.removeItem("auth:logout");
                if (typeof window !== "undefined") {
                    delete (window as any).__preventAuthSync;
                }
            } catch { }

            try {
                window.dispatchEvent(
                    new CustomEvent("auth:changed", {
                        detail: { action: "login" }
                    })
                );
            } catch { }

            // Strategic delay to allow the car "Emerald Ultra-Launch" cinematic to play
            setTimeout(() => {
                router.replace(callbackUrl);
                router.refresh();
            }, 2500);
        } catch (err: any) {
            console.error("[login] error:", err);
            setError(t("auth.login.network_error"));
            setLoginStatus("error");
            setTimeout(() => setLoginStatus("idle"), 2000);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
            {/* Premium Dynamic Background (Silk Effect) */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    className="absolute -top-[20%] -right-[10%] w-[80%] h-[80%] bg-gradient-radial from-yellow-50/40 via-transparent to-transparent blur-[120px]"
                    animate={{
                        scale: [1, 1.1, 1],
                        x: [0, 30, 0],
                        y: [0, -20, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute -bottom-[10%] -left-[10%] w-[70%] h-[70%] bg-gradient-radial from-blue-50/30 via-transparent to-transparent blur-[100px]"
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, -40, 0],
                        y: [0, 30, 0]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                />
            </div>

            {/* Logo Link - Centered on Mobile using flex for RTL robustness */}
            <motion.div
                className="absolute top-0 inset-x-0 flex justify-center lg:inset-x-auto lg:left-12 lg:justify-start z-50 -mt-6"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <Link href="/" className="block transition-transform hover:scale-105 duration-300">
                    <Image
                        src="/logo.png"
                        alt="Karkey Logo"
                        width={380}
                        height={150}
                        className="h-40 w-auto object-contain"
                        priority
                    />
                </Link>
            </motion.div>

            {/* Main container - Added extra PT on mobile to avoid overlap with centered logo */}
            <div className="w-full max-w-7xl mx-auto px-6 pt-32 pb-12 lg:py-12 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-24 relative z-10">

                {/* Left side - Animated Car (HIDDEN ON MOBILE) */}
                <motion.div
                    className={`hidden lg:flex w-full max-w-xl lg:w-3/5 items-center justify-center order-2 lg:order-1 perspective-1000 ${loginStatus === 'success' ? 'z-[2000000]' : 'relative z-10'}`}
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    <AnimatedCar
                        isPasswordVisible={showPassword}
                        isHoveringSubmit={isHoveringSubmit}
                        loginStatus={loginStatus}
                        className="w-full max-w-[750px] h-[450px] drop-shadow-2xl"
                    />
                </motion.div>

                {/* Right side - Login Form */}
                <div className="w-full max-w-md lg:w-2/5 order-1 lg:order-2">
                    <motion.div
                        className="mb-10 text-center lg:text-start"
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >


                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#103090] mb-3 tracking-tight">
                            {t("auth.login.title")}
                        </h1>
                        <p className="text-[#B8071C] text-lg font-sans font-medium opacity-90">
                            {t("auth.login.subtitle")}
                        </p>
                    </motion.div>

                    <motion.form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    >
                        {error && (
                            <Alert className="bg-red-50 border-1 border-red-100/50 rounded-xl animate-in fade-in slide-in-from-top-4 shadow-sm">
                                <AlertDescription className="text-red-800 text-center font-medium font-sans">
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-6">
                            {/* Email Field - Clean Luxury Style */}
                            <motion.div
                                className="space-y-2 group"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <label
                                    htmlFor="email"
                                    className="text-xs uppercase tracking-widest font-bold text-[#103090] font-sans ml-1"
                                >
                                    {t("auth.login.email_placeholder")}
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="client@example.com"
                                    name="email"
                                    required
                                    className="border-b-[1.5px] border-t-0 border-x-0 border-indigo-100 bg-transparent rounded-none h-12 px-1 text-xl text-[#0a1a3a] placeholder:text-gray-300 focus:border-[#B8071C] focus:ring-0 transition-all duration-300 font-sans"
                                />
                            </motion.div>

                            {/* Password Field */}
                            <motion.div
                                className="space-y-2 group"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                <label
                                    htmlFor="password"
                                    className="text-xs uppercase tracking-widest font-bold text-[#103090] font-sans ml-1"
                                >
                                    {t("auth.login.password_placeholder")}
                                </label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        name="password"
                                        required
                                        onFocus={() => setIsPasswordFocused(true)}
                                        onBlur={() => setIsPasswordFocused(false)}
                                        className="border-b-[1.5px] border-t-0 border-x-0 border-indigo-100 bg-transparent rounded-none h-12 px-1 pe-12 text-xl text-[#0a1a3a] placeholder:text-gray-300 focus:border-[#B8071C] focus:ring-0 transition-all duration-300 font-sans"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute end-1 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#B8071c] transition-colors duration-300 p-2"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </motion.div>
                        </div>

                        {/* Login Button with linkage to Car "Revving" */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            onMouseEnter={() => setIsHoveringSubmit(true)}
                            onMouseLeave={() => setIsHoveringSubmit(false)}
                        >
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#103090] to-[#081848] hover:from-[#B8071C] hover:to-[#900515] text-white rounded-lg h-14 text-lg font-bold tracking-wide transition-all duration-500 hover:scale-[1.01] hover:shadow-lg hover:shadow-red-900/20 active:scale-[0.99] mt-8 font-sans uppercase overflow-hidden relative group"
                                disabled={loading}
                            >
                                {/* Glass shine effect on button */}
                                <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-25deg] -translate-x-full group-hover:animate-shine pointer-events-none" />

                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {t("common.loading")}...
                                    </span>
                                ) : (
                                    t("auth.login.submit")
                                )}
                            </Button>
                        </motion.div>

                        {/* Sign Up Link */}
                        <motion.div
                            className="text-center pt-4 border-t border-gray-50 mt-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                        >
                            <p className="text-[#888] font-sans text-sm">
                                {t("auth.login.no_account")}{" "}
                                <Link
                                    href="/auth/register"
                                    className="text-[#103090] font-bold hover:text-[#b8071c] transition-colors ml-1 uppercase text-xs tracking-wide"
                                >
                                    {t("auth.login.signup")}
                                </Link>
                            </p>
                        </motion.div>
                    </motion.form>
                </div>
            </div>
        </div>
    );
}