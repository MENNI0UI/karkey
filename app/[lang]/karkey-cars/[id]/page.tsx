import React from "react"
import { notFound } from "next/navigation"
import KarkeyCarDetailClient from "@/components/karkey-car-detail-client"

export const revalidate = 60 // ISR: revalidate every 60 seconds

async function getCar(id: string) {
    try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const response = await fetch(`${siteUrl}/api/karkey-cars/${id}`, {
            next: { revalidate: 60 }
        })

        if (!response.ok) {
            try {
                const body = await response.text()
                console.error("[karkey-cars page] API returned", response.status, body)
            } catch (e) {
                console.error("[karkey-cars page] API returned", response.status)
            }
            return null
        }
        const data = await response.json()
        return data
    } catch (err) {
        console.error("Error fetching car details:", err)
        return null
    }
}

export default async function KarkeyCarDetailsPage({ params }: { params: Promise<{ id: string, lang: string }> }) {
    const { id } = await params
    const car = await getCar(id)

    if (!car) {
        notFound()
    }

    return <KarkeyCarDetailClient car={car} />
}
