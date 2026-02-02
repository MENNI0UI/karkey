"use client"

import React, { useState } from "react"
import { useTranslation } from "@/lib/i18n-context"
import {
    MessageCircle,
    CheckCircle2
} from "lucide-react"
import KarkeyInquiryModal from "@/components/karkey-inquiry-modal"
import UnifiedCarLayout, { type CarData } from "@/components/unified-car-layout"

interface KarkeyCarPhoto {
    id: number
    photo_url: string
    position_order: number
}

interface KarkeyCar {
    id: number
    make: string
    model: string
    year: number
    mileage: number
    transmission: string
    fuel_type: string
    engine_size?: string | null
    doors?: string | null
    vehicle_condition: string
    location: string
    description: string
    special_features?: string | null
    price: string | number
    photos: KarkeyCarPhoto[]
}

interface KarkeyCarDetailClientProps {
    car: KarkeyCar
}

export default function KarkeyCarDetailClient({ car }: KarkeyCarDetailClientProps) {
    const { t } = useTranslation()
    const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false)

    const normalizePhotoUrl = (p: string | null | undefined) => {
        if (!p) return "/placeholder-car.jpg"
        const s = String(p).trim()
        if (s.startsWith("data:") || s.startsWith("http://") || s.startsWith("https://")) return s

        // Extract filename if it's already a path
        let filename = s
        if (s.includes("/")) {
            filename = s.split("/").pop() || s
        }

        return `https://img.karkey.space/vehicles/${filename}`
    }

    const carData: CarData = {
        id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.price,
        mileage: car.mileage,
        transmission: car.transmission,
        fuel_type: car.fuel_type,
        condition: car.vehicle_condition,
        location: car.location,
        description: car.description,
        special_features: car.special_features || undefined,
        engine_size: car.engine_size || undefined,
        doors: car.doors || undefined,
        photos: (car.photos || []).map(p => ({
            id: p.id,
            url: normalizePhotoUrl(p.photo_url)
        }))
    }

    const contactAction = (
        <div className="sticky bottom-6 lg:relative lg:bottom-0 py-6 lg:py-0">
            <button
                onClick={() => setIsInquiryModalOpen(true)}
                className="w-full bg-[#B8071C] hover:bg-[#910515] text-white font-black text-base py-3 px-4 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg shadow-[#B8071C]/20 active:scale-[0.98]"
            >
                <MessageCircle className="w-8 h-8" />
                {t("karkey_cars.contact") || "Contact Karkey"}
            </button>
            <div className="flex items-center justify-center gap-2 mt-4 text-[#DEB735] text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#DEB735]" />
                {t("karkey_cars.verified_tag" as any) || "Verified and Exclusive to Karkey"}
            </div>
        </div>
    )

    return (
        <>
            <UnifiedCarLayout
                car={carData}
                action={contactAction}
            />

            <KarkeyInquiryModal
                car={car}
                isOpen={isInquiryModalOpen}
                onClose={() => setIsInquiryModalOpen(false)}
            />
        </>
    )
}
