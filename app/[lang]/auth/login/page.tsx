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

export default function LoginPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
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
                return;
            }

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

            router.replace(callbackUrl);
            router.refresh();
        } catch (err: any) {
            console.error("[login] error:", err);
            setError(t("auth.login.network_error"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
            {/* Logo Link - Top Left (Forced Upwards) */}
            <div className="absolute top-0 left-6 md:left-12 z-50 -mt-6">
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
            </div>

            {/* Subtle decorative background shine - Adjusted to Green/Gold */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-yellow-50 to-transparent opacity-50 blur-3xl pointer-events-none" />

            {/* Main container */}
            <div className="w-full max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-24 relative z-10">

                {/* Left side - Animated Car */}
                <div className="w-full max-w-xl lg:w-3/5 flex items-center justify-center order-2 lg:order-1 perspective-1000">
                    <AnimatedCar
                        isPasswordVisible={showPassword}
                        className="w-full max-w-[750px] h-[450px] drop-shadow-2xl"
                    />
                </div>

                {/* Right side - Login Form */}
                <div className="w-full max-w-md lg:w-2/5 order-1 lg:order-2">
                    <div className="mb-10 text-center lg:text-start">
                        {/* Optional: Second smaller logo or brand element above title for emphasis */}
                        <div className="lg:hidden mb-8 flex justify-center">
                            <Image
                                src="/logo.png"
                                alt="Karkey Logo"
                                width={220}
                                height={90}
                                className="h-28 w-auto object-contain"
                            />
                        </div>

                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#103090] mb-3 tracking-tight">
                            {t("auth.login.title")}
                        </h1>
                        <p className="text-[#B8071C] text-lg font-sans font-medium opacity-90">
                            {t("auth.login.subtitle")}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <Alert className="bg-red-50 border-1 border-red-100/50 rounded-xl animate-in fade-in slide-in-from-top-4 shadow-sm">
                                <AlertDescription className="text-red-800 text-center font-medium font-sans">
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-6">
                            {/* Email Field - Clean Luxury Style */}
                            <div className="space-y-2 group">
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
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2 group">
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
                            </div>
                        </div>

                        {/* Login Button - Karkey Gradient (Blue -> Red interaction or pure Blue) */}
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-[#103090] to-[#081848] hover:from-[#B8071C] hover:to-[#900515] text-white rounded-lg h-14 text-lg font-bold tracking-wide transition-all duration-500 hover:scale-[1.01] hover:shadow-lg hover:shadow-red-900/20 active:scale-[0.99] mt-8 font-sans uppercase"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {t("common.loading")}...
                                </span>
                            ) : (
                                t("auth.login.submit")
                            )}
                        </Button>

                        {/* Sign Up Link */}
                        <div className="text-center pt-4 border-t border-gray-50 mt-6">
                            <p className="text-[#888] font-sans text-sm">
                                {t("auth.login.no_account")}{" "}
                                <Link
                                    href="/auth/register"
                                    className="text-[#103090] font-bold hover:text-[#b8071c] transition-colors ml-1 uppercase text-xs tracking-wide"
                                >
                                    {t("auth.login.signup")}
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
