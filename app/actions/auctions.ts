"use server"

import fs from "fs/promises"
import path from "path"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/mysql-auth"
import { maybeApplyWatermark, getContentTypeFromExt } from "@/lib/image-processing"
import { Prisma } from "@prisma/client"
import { cookies } from "next/headers"
import { revalidateTag } from "next/cache"

function sanitizeFilename(name: string) {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function mapTransmission(value: string): "manual" | "automatic" {
    const v = value.toLowerCase().trim()
    if (v === "automatic" || v === "auto") return "automatic"
    return "manual"
}

function mapFuelType(value: string): "gasoline" | "diesel" | "electric" | "hybrid" {
    const v = value.toLowerCase().trim()
    if (v === "diesel") return "diesel"
    if (v === "electric") return "electric"
    if (v === "hybrid") return "hybrid"
    return "gasoline"
}

// 🆕 النظام الجديد: يعتمد كلياً على direct_sales مع خيار auction_consent
// تم حذف createAuction القديمة لأن إنشاء المزادات أصبح حصرياً عبر البيع المباشر
export async function createAuction(prevState: any, formData: FormData) {
    return { success: false, error: "Auction creation is now only possible via Direct Sale with Auction Consent." }
}
