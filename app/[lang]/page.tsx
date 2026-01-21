import nextDynamic from "next/dynamic"
import SearchBar from "@/components/searchbar"
import { getApprovedVehicles, getApprovedKarkeyCars, getDirectSalesFilterOptions, getHomeCitiesData } from "@/app/actions"
import { loadTranslations } from "@/lib/translations"
import { HeroHeadline } from "@/components/hero-headline"
import { ParticlesBackground } from "@/components/particles-background"

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
    const t = await loadTranslations(lang)

    let initialVehicles: any[] = []
    let initialServerTime: string | null = null
    let initialOptions: any = {}
    try {
        const result = await getApprovedVehicles(10) // 5 per row * 2 rows = 10
        if (result?.success && Array.isArray(result.vehicles)) {
            initialVehicles = result.vehicles
            if (result.server_time) initialServerTime = result.server_time
        }
    } catch (e) {
        console.error("[HomePage] Failed to fetch approved vehicles:", e)
    }

    // NEW: Fetch Karkey Cars (replaced Direct Sales)
    let initialKarkeyCars: any[] = []
    try {
        // @ts-ignore
        const resultKC = await getApprovedKarkeyCars(8) // 8 items for 2 rows in 4-col grid
        if (resultKC?.success && Array.isArray(resultKC.cars)) {
            initialKarkeyCars = resultKC.cars
        }
    } catch (e) {
        console.error("[HomePage] Failed to fetch karkey cars:", e)
    }

    // NEW: Fetch Cities Data
    let initialCities: any[] = []
    try {
        const resultCities = await getHomeCitiesData()
        if (resultCities?.success && Array.isArray(resultCities.cities)) {
            initialCities = resultCities.cities
        }
    } catch (e) {
        console.error("[HomePage] Failed to fetch cities data:", e)
    }

    try {
        const opt = await getDirectSalesFilterOptions()
        if (opt?.success && opt.options) initialOptions = opt.options
    } catch (e) {
        console.error("[HomePage] Failed to fetch filter options:", e)
    }

    return (
        // unified page background
        <main className="min-h-screen relative overflow-hidden bg-white">

            {/* Dynamic Particles Background */}
            <div className="absolute inset-0 z-0 h-[600px] pointer-events-none overflow-hidden">
                <ParticlesBackground />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white z-10" />
            </div>

            {/* Global Background Elements for "Unified" feel */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-[#00A651]/5 rounded-full blur-3xl opacity-30" />
            </div>

            {/* Search area */}
            <section className="relative pt-12 pb-4 lg:pb-10 z-50">
                <div className="max-w-[1700px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-col-reverse">
                    <div className="flex justify-center mb-10 lg:mb-0 lg:mt-6 pt-4">
                        <SearchBar className="w-full max-w-[60rem] shadow-xl shadow-[#00A651]/5" options={initialOptions} />
                    </div>

                    {/* Editorial Headline */}
                    <HeroHeadline
                        titleStart={t["home.premium.find_your"] || "Find Your"}
                        titleEnd={t["home.premium.dream_car"] || "Dream Car"}
                        subtitle={t["home.premium.subtitle"] || "Discover the finest selection of vehicles across Morocco"}
                    />
                </div>
            </section>

            {/* Card grid (grouped by make when enabled) */}
            <section className="max-w-[1700px] mx-auto px-2 sm:px-4 py-2 mt-4 relative z-10 bg-transparent">
                <div className="home-cards -mt-2">
                    {/* Disable grouping by make — render a flat grid on the client */}
                    <HomePageClient
                        initialVehicles={initialVehicles}
                        initialKarkeyCars={initialKarkeyCars}
                        initialServerTime={initialServerTime}
                        initialCities={initialCities}
                    />
                </div>
            </section>
        </main>
    )
}
