"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n-context";
import Link from "next/link";
import { LogIn, UserPlus, ArrowLeft } from "lucide-react";

interface RouteProtectionProps {
    redirectType: 'auction' | 'direct-sale';
}

export default function RouteProtection({ redirectType }: RouteProtectionProps) {
    const { user, isLoaded } = useAuth();
    const loading = !isLoaded;
    const router = useRouter();
    const { language, t } = useTranslation();
    const [showAuthRequired, setShowAuthRequired] = useState(false);

    useEffect(() => {
        if (loading) return;

        // Not Logged In -> Show auth required message
        if (!user) {
            setShowAuthRequired(true);
            return;
        }

        // User is logged in - allow access
        setShowAuthRequired(false);
    }, [user, loading]);

    // Show loader while checking auth
    if (loading) {
        return (
            <div className="fixed inset-0 bg-white z-[99999] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#B8071C]"></div>
            </div>
        );
    }

    // Show auth required screen if not logged in
    if (showAuthRequired) {
        return (
            <div className="fixed inset-0 bg-gradient-to-b from-gray-50 to-white z-[99999] flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center">
                    {/* Icon */}
                    <div className="mb-6">
                        <div className="w-20 h-20 mx-auto bg-[#B8071C]/10 rounded-full flex items-center justify-center">
                            <LogIn className="w-10 h-10 text-[#B8071C]" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 font-serif">
                        {t("auth.required.title")}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg text-gray-600 mb-2">
                        {t("auth.required.subtitle")}
                    </p>

                    {/* Description */}
                    <p className="text-gray-500 mb-8">
                        {t("auth.required.description")}
                    </p>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Link
                            href={`/${language}/auth/login?redirect=/${language}/${redirectType === 'direct-sale' ? 'direct-sales' : 'auctions'}/create`}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#B8071C] text-white font-semibold rounded-xl hover:bg-[#910515] transition-colors shadow-lg shadow-[#B8071C]/20"
                        >
                            <LogIn className="w-5 h-5" />
                            {t("auth.required.signin")}
                        </Link>

                        <Link
                            href={`/${language}/auth/register?redirect=/${language}/${redirectType === 'direct-sale' ? 'direct-sales' : 'auctions'}/create`}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-[#B8071C] hover:text-[#B8071C] transition-colors"
                        >
                            <UserPlus className="w-5 h-5" />
                            {t("auth.required.signup")}
                        </Link>

                        <button
                            onClick={() => router.back()}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t("auth.required.back")}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
