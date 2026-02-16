import "../globals.css";
import "flag-icons/css/flag-icons.min.css";
import React from "react";
import ClientLayout from '@/components/layout/ClientLayout';
import { cookies } from "next/headers";
import { I18nProvider } from "@/lib/i18n-context";
import Script from "next/script";
import { notFound } from "next/navigation";
import { Language, loadTranslations } from "@/lib/translations";
import { DM_Sans, Noto_Sans_Arabic, DM_Serif_Display, Amiri } from "next/font/google";
import { auth } from "@/auth";

const dmSans = DM_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    variable: "--font-dm-sans",
    display: "swap",
});



const notoSansArabic = Noto_Sans_Arabic({
    subsets: ["arabic"],
    weight: ["300", "400", "700"],
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

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<any> {
    const { lang } = await params;
    const isAr = lang === 'ar';
    const siteName = "Karkey";

    // Core translation mapping for SEO
    // We fetch these manually here to keep generateMetadata simple and fast
    const seoData: Record<string, { title: string, description: string }> = {
        en: {
            title: "Karkey | Buy & Sell Cars in Morocco",
            description: "Discover the finest selection of vehicles across Morocco. Join our exclusive auctions or buy directly from verified owners."
        },
        fr: {
            title: "Karkey | Achat et Vente de Voitures au Maroc",
            description: "Découvrez la meilleure sélection de véhicules à travers le Maroc. Rejoignez nos enchères exclusives ou achetez directement auprès de propriétaires vérifiés."
        },
        ar: {
            title: "كاركي | بيع وشراء السيارات في المغرب",
            description: "اكتشف أفضل مجموعة من السيارات في جميع أنحاء المغرب. انضم إلى مزاداتنا الحصرية أو اشترِ مباشرة من المالكين الموثوقين."
        },
        es: {
            title: "Karkey | Compra y Vende Coches en Marruecos",
            description: "Descubra la mejor selección de vehículos en todo Marruecos. Únase a nuestras subastas exclusivas o compre directamente a propietarios verificados."
        }
    };

    const currentSeo = seoData[lang] || seoData.en;

    return {
        title: {
            default: currentSeo.title,
            template: `%s | ${siteName}`
        },
        description: currentSeo.description,
        metadataBase: new URL("https://karkey.space"),
        alternates: {
            canonical: `/${lang}`,
            languages: {
                'en-US': '/en',
                'fr-FR': '/fr',
                'ar-MA': '/ar',
                'es-ES': '/es',
            },
        },
        openGraph: {
            title: currentSeo.title,
            description: currentSeo.description,
            url: `https://karkey.space/${lang}`,
            siteName: siteName,
            locale: isAr ? 'ar_MA' : lang === 'fr' ? 'fr_FR' : 'en_US',
            type: 'website',
            images: [
                {
                    url: '/logo.png', // Assuming logo is the best fallback social image
                    width: 800,
                    height: 600,
                    alt: siteName,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: currentSeo.title,
            description: currentSeo.description,
            images: ['/logo.png'],
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

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

    const session = await auth();
    const isLoggedIn = !!session?.user;

    return (
        <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`${dmSans.variable} ${notoSansArabic.variable} ${dmSerif.variable} ${amiri.variable}`}>
            <head>
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                <link rel="preconnect" href="https://img.karkey.space" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://img.karkey.space" />
                <link rel="manifest" href="/manifest.json" />
                <link rel="apple-touch-icon" href="/logo.png" />
            </head>
            <body>
                <I18nProvider lang={lang as Language}>
                    <ClientLayout isLoggedIn={isLoggedIn}>{children}</ClientLayout>
                </I18nProvider>
            </body>
        </html>
    );
}
