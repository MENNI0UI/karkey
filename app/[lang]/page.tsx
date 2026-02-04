import SearchBar from "@/components/searchbar"
import { loadTranslations } from "@/lib/translations"
import HeroSection from "@/components/hero-section"
import SuspendedCarGrid from "./suspended-car-grid"

export const revalidate = 60
// Force dynamic to enable PPR streaming behavior efficiently
export const dynamic = "force-dynamic"

export default async function HomePage(props: { params: Promise<{ lang: "en" | "fr" | "ar" | "es" }> }) {
    const params = await props.params;
    const lang = params?.lang || "en"

    // ⚡ PPR Optimized: Only await translations (fast/static)
    // Heavy DB calls are moved to SuspendedCarGrid
    const t = await loadTranslations(lang);
    const initialOptions = {};

    return (
        <main className="min-h-screen relative overflow-hidden bg-white">
            {/* ⚡ Static Shell: Renders instantly from Edge */}
            <HeroSection
                titleStart={t["home.premium.find_your"] || "Find Your"}
                titleEnd={t["home.premium.dream_car"] || "Dream Car"}
                subtitle={t["home.premium.subtitle"] || "Discover the finest selection of vehicles across Morocco"}
            >
                <div className="flex justify-center mb-10 lg:mb-0 lg:mt-6 pt-4">
                    <SearchBar className="w-full max-w-[60rem] shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)]" options={initialOptions} />
                </div>
            </HeroSection>

            {/* ⚡ Dynamic Payload: Streams in parallel */}
            <section className="max-w-[1700px] mx-auto px-2 sm:px-4 py-2 mt-4 relative z-[1] bg-transparent">
                <div className="home-cards -mt-2">
                    <SuspendedCarGrid lang={lang} />
                </div>
            </section>
        </main>
    )
}
