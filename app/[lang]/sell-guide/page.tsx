import { Suspense } from "react";
import SellGuideClient from "./sell-guide-client";
import { LuxuryLoader } from "@/components/ui/luxury-loader";

export default async function SellGuidePage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;

    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white/50 backdrop-blur-sm">
                <LuxuryLoader size="lg" />
            </div>
        }>
            <SellGuideClient lang={lang} />
        </Suspense>
    );
}
