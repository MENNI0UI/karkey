import React from "react"
export const dynamic = "force-dynamic"
import KarkeyCarsPageClient from "@/components/karkey-cars-page-client"
import { getApprovedKarkeyCars } from "@/app/actions"

export default async function KarkeyCarsPage() {
    let initialCars: any[] = []
    try {
        const res = await getApprovedKarkeyCars(12)
        if (res.success && res.cars) {
            initialCars = res.cars
        }
    } catch (err) {
        console.error("Failed to fetch initial karkey cars", err)
    }

    return <KarkeyCarsPageClient initialCars={initialCars} />
}
