"use client";

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { FileQuestion, Home } from "lucide-react"
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n-context";

export default function NotFound() {
    const params = useParams();
    const lang = (params?.lang as string) || "en";
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 px-4 bg-white">
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <div className="p-6 bg-red-50 rounded-full text-red-600 mb-2">
                    <FileQuestion size={48} strokeWidth={1.5} />
                </div>

                <div className="space-y-2">
                    <h1 className="text-6xl font-bold text-gray-900 tracking-tight">
                        {t('notfound.page_title' as any)}
                    </h1>
                    <h2 className="text-2xl font-semibold text-gray-800">
                        {t('notfound.page_subtitle' as any)}
                    </h2>
                    <p className="text-gray-500 text-lg">
                        {t('notfound.page_desc' as any)}
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                    <Link href={`/${lang}`}>
                        <Home className="mr-2 h-4 w-4" />
                        {t('notfound.page_button' as any)}
                    </Link>
                </Button>
                <Button asChild size="lg" className="rounded-full px-8 bg-primary hover:opacity-90">
                    <Link href={`/${lang}/direct-sales`}>
                        {t('nav.explore' as any)}
                    </Link>
                </Button>
            </div>

            {/* Subtle brand watermark */}
            <div className="mt-12 opacity-10">
                <img src="/logo.png" alt="Karkey" className="h-8 grayscale" />
            </div>
        </div>
    )
}
