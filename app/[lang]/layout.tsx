import "../globals.css";
import "flag-icons/css/flag-icons.min.css";
import React from "react";
import ClientLayout from '@/components/layout/ClientLayout';
import { cookies } from "next/headers";
import { I18nProvider } from "@/lib/i18n-context";
import Script from "next/script";
import { notFound } from "next/navigation";
import { Language } from "@/lib/translations";
import { DM_Sans, Noto_Sans_Arabic, DM_Serif_Display, Amiri } from "next/font/google";

const dmSans = DM_Sans({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700", "800"],
    variable: "--font-dm-sans",
    display: "swap",
});



const notoSansArabic = Noto_Sans_Arabic({
    subsets: ["arabic"],
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    variable: "--font-noto-sans-arabic",
    display: "swap",
});

const dmSerif = DM_Serif_Display({
    subsets: ["latin"],
    weight: ["400"],
    variable: "--font-dm-serif",
    display: "swap",
});

const amiri = Amiri({
    subsets: ["arabic"],
    weight: ["400", "700"],
    variable: "--font-amiri",
    display: "swap",
});

export const metadata = {
    title: "Karkey",
    description: "Vehicle auctions and marketplace",
};

const locales = ["en", "fr", "ar", "es"];

export default async function RootLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;

    if (!locales.includes(lang)) {
        notFound();
    }

    // 🆕 Smart Scheduler handles automation automatically via instrumentation.ts
    // No need for lazy automation triggers anymore

    const { auth } = await import("@/auth");
    const session = await auth();
    const isLoggedIn = !!session?.user;

    return (
        <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`${dmSans.variable} ${notoSansArabic.variable} ${dmSerif.variable} ${amiri.variable}`}>
            <head>
                <meta name="viewport" content="width=device-width,initial-scale=1" />
            </head>
            <body>
                <I18nProvider lang={lang as Language}>
                    <ClientLayout isLoggedIn={isLoggedIn}>{children}</ClientLayout>
                </I18nProvider>
            </body>
        </html>
    );
}
