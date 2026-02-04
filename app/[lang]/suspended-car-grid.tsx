import { Suspense } from "react"
import HomePageClient from "@/components/home-page-client"
import { getApprovedKarkeyCars, getHomeCitiesData } from "@/app/actions/vehicles"
import { loadTranslations } from "@/lib/translations"

// Internal component that suspends
async function CarGrid({ lang }: { lang: string }) {
    const [resultKC, resultCities] = await Promise.all([
        getApprovedKarkeyCars(8),
        getHomeCitiesData(),
    ]);

    const initialKarkeyCars = resultKC?.success && Array.isArray(resultKC.cars) ? resultKC.cars : [];
    const initialCities = resultCities?.success && Array.isArray(resultCities.cities) ? resultCities.cities : [];

    return (
        <HomePageClient
            initialKarkeyCars={initialKarkeyCars}
            initialCities={initialCities}
        />
    )
}

function CarGridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-gray-100 dark:bg-white/5 rounded-2xl" />
            ))}
        </div>
    )
}

export default async function SuspendedCarGrid({ lang }: { lang: string }) {
    return (
        <Suspense fallback={<CarGridSkeleton />}>
            <CarGrid lang={lang} />
        </Suspense>
    )
}
