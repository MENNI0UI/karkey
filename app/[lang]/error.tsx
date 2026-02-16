'use client'

import React, { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n-context";
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const params = useParams();
    const lang = (params?.lang as string) || "en";
    const { t } = useTranslation();

    useEffect(() => {
        // Log error details for debugging
        console.error("[ErrorBoundary] Caught error:", error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 px-4 bg-white">
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <div className="p-6 bg-red-50 rounded-full text-red-600 mb-2">
                    <AlertCircle size={48} strokeWidth={1.5} />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {t('error.page_title' as any)}
                    </h1>
                    <p className="text-gray-500 text-lg">
                        {t('error.page_desc' as any)}
                    </p>
                    {error.digest && (
                        <p className="text-xs text-gray-400 font-mono mt-4">
                            ID: {error.digest}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button
                    onClick={() => reset()}
                    size="lg"
                    className="rounded-full px-8 bg-primary hover:opacity-90"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('error.page_button' as any)}
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                    <Link href={`/${lang}`}>
                        <Home className="mr-2 h-4 w-4" />
                        {t('notfound.page_button' as any)}
                    </Link>
                </Button>
            </div>

            <div className="mt-12 opacity-10">
                <img src="/logo.png" alt="Karkey" className="h-8 grayscale" />
            </div>
        </div>
    )
}
