"use client"

import React from "react"
import { useTranslation } from "@/lib/i18n-context"

export default function FinancePage() {
    const { t } = useTranslation()

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#103090] animate-pulse">
                {t("common.soon")}
            </h1>
        </div>
    )
}
