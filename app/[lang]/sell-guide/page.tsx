import { Suspense } from "react";
import SellGuideClient from "./sell-guide-client";
import { Loader2 } from "lucide-react";

export default async function SellGuidePage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;

    return (
        <Suspense fallback={
            <div className="min-h-screen grid place-items-center bg-gray-50">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        }>
            <SellGuideClient lang={lang} />
        </Suspense>
    );
}
