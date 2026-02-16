import { Suspense } from "react"
import HomePageClient from "@/components/home-page-client"
import { getApprovedKarkeyCars, getHomeCitiesData } from "@/app/actions/vehicles"
import { CarGridSkeleton } from "@/components/ui/car-card-skeleton"

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

export default async function SuspendedCarGrid({ lang }: { lang: string }) {
    return (
        <Suspense fallback={(
            <div className="max-w-[3000px] w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-20 2xl:px-32 py-12">
                <CarGridSkeleton count={8} type="karkey" />
            </div>
        )}>
            <CarGrid lang={lang} />
        </Suspense>
    )
}
