import nextDynamic from "next/dynamic"
import SearchBar from "@/components/searchbar"
import { getApprovedVehicles, getApprovedKarkeyCars, getDirectSalesFilterOptions, getHomeCitiesData } from "@/app/actions"
import { loadTranslations } from "@/lib/translations"
import HeroSection from "@/components/hero-section"

// dynamic import to avoid "Unsupported Server Component type: undefined" when the client component
// isn't available to the server renderer (or its default export is missing).
const HomePageClient = nextDynamic(() => import("@/components/home-page-client"), {
    loading: () => <div />, // minimal placeholder during client load
})

export const revalidate = 60

export default async function HomePage(props: { params: Promise<{ lang: "en" | "fr" | "ar" | "es" }> }) {
    const params = await props.params;
    // Safe language fallback
    const lang = params?.lang || "en"
    // Parallel rendering: fetch everything simultaneously
    const [t, resultKC, resultCities, opt] = await Promise.all([
        loadTranslations(lang),
        getApprovedKarkeyCars(8),
        getHomeCitiesData(),
        getDirectSalesFilterOptions()
    ]);

    const initialKarkeyCars = resultKC?.success && Array.isArray(resultKC.cars) ? resultKC.cars : [];
    const initialCities = resultCities?.success && Array.isArray(resultCities.cities) ? resultCities.cities : [];
    const initialOptions = opt?.success && opt.options ? opt.options : {};

    return (
        // unified page background
        <main className="min-h-screen relative overflow-hidden bg-white">

            {/* Dynamic Hero Section with Particles Background and Headline */}
            <HeroSection
                titleStart={t["home.premium.find_your"] || "Find Your"}
                titleEnd={t["home.premium.dream_car"] || "Dream Car"}
                subtitle={t["home.premium.subtitle"] || "Discover the finest selection of vehicles across Morocco"}
            >
                <div className="flex justify-center mb-10 lg:mb-0 lg:mt-6 pt-4">
                    <SearchBar className="w-full max-w-[60rem] shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)]" options={initialOptions} />
                </div>
            </HeroSection>

            {/* Card grid (grouped by make when enabled) */}
            <section className="max-w-[1700px] mx-auto px-2 sm:px-4 py-2 mt-4 relative z-[1] bg-transparent">
                <div className="home-cards -mt-2">
                    {/* Disable grouping by make — render a flat grid on the client */}
                    <HomePageClient
                        initialKarkeyCars={initialKarkeyCars}
                        initialCities={initialCities}
                    />
                </div>
            </section>
        </main>
    )
}
