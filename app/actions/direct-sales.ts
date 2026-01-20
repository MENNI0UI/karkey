"use server"

import path from "path"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/mysql-auth"
import { maybeApplyWatermark, getContentTypeFromExt } from "@/lib/image-processing"
import { Prisma } from "@prisma/client"
import { revalidateTag } from "next/cache"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const R2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
})

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

function mapCondition(value: string): "excellent" | "good" | "fair" | "poor" {
    const v = value.toLowerCase().trim()
    if (v === "excellent") return "excellent"
    if (v === "fair") return "fair"
    if (v === "poor") return "poor"
    return "good"
}

export async function createDirectSale(prevState: any, formData: FormData) {
    try {
        const user = await getCurrentUser()

        if (!user || !user.userId) {
            return { success: false, error: "Unauthorized" }
        }

        const userId = Number(user.userId)

        const make = String(formData.get("make") ?? "")
        const model = String(formData.get("model") ?? "")
        const year = Number(formData.get("year") ?? null) || null
        const mileage = Number(formData.get("mileage") ?? null) || null
        const transmission = String(formData.get("transmission") ?? "")
        const fuel_type = String(formData.get("fuel_type") ?? "")
        const engine_size = String(formData.get("engine_size") ?? "") || null
        const doors = String(formData.get("doors") ?? "") || null
        const interior_color = String(formData.get("interior_color") ?? "") || null
        const exterior_color = String(formData.get("exterior_color") ?? "") || null
        const is_original_paint = formData.get("is_original_paint") === "true"
        const vehicle_condition = String(formData.get("condition") ?? "")
        const location = String(formData.get("location") ?? "")
        const description = String(formData.get("description") ?? "")
        const special_features = String(formData.get("special_features") ?? "") || null
        const price = Number(formData.get("price") ?? null) || null

        // Auction consent fields
        const auction_consent = formData.get("auction_consent") === "true"
        const auction_starting_price = auction_consent ? Number(formData.get("auction_starting_price") ?? null) || null : null
        const auction_reserve_price = auction_consent ? Number(formData.get("auction_reserve_price") ?? null) || null : null

        // optional docs
        const carteGriseFile = formData.get("carte_grise") as File | null
        const serviceFiles = formData.getAll("service_docs") as File[]

        // photos
        const photos = formData.getAll("photos") as File[]

        // basic server-side validation
        if (!photos || photos.length < 5) {
            return { success: false, error: "At least 5 photos are required" }
        }

        if (!price || price < 10000) {
            return { success: false, error: "Price must be at least 10,000 MAD" }
        }

        if (!year || !mileage) {
            return { success: false, error: "Year and mileage are required" }
        }

        // save carte grise if present
        let carte_grise_url: string | null = null
        if (carteGriseFile && carteGriseFile.size > 0) {
            console.log(`[direct-sales] Processing carte_grise: ${carteGriseFile.name} (${carteGriseFile.size} bytes)`)
            const name = sanitizeFilename(carteGriseFile.name || `carte_${Date.now()}`)
            const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${name}`
            const key = `direct-sales/${filename}`

            try {
                const arrayBuffer = await carteGriseFile.arrayBuffer()
                let buffer = Buffer.from(arrayBuffer)
                const ext = (carteGriseFile.name.split('.').pop() || '').toLowerCase()
                const contentType = getContentTypeFromExt(ext) || 'application/octet-stream'

                if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
                    const { data } = await maybeApplyWatermark(buffer, contentType, filename)
                    buffer = Buffer.from(data)
                }

                await R2.send(new PutObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: key,
                    Body: buffer,
                    ContentType: contentType
                }))

                carte_grise_url = `${process.env.R2_PUBLIC_DOMAIN}/${key}`
                console.log(`[direct-sales] carte_grise uploaded: ${carte_grise_url}`)
            } catch (e) {
                console.warn("[direct-sales] Carte grise upload failed:", e)
            }
        }

        const service_history_url: string | null = null

        // Create direct sale using Prisma
        const newDirectSale = await prisma.direct_sales.create({
            data: {
                user_id: userId,
                make,
                model,
                year: year!,
                mileage: mileage!,
                transmission: mapTransmission(transmission),
                fuel_type: mapFuelType(fuel_type),
                engine_size,
                doors,
                interior_color,
                exterior_color,
                is_original_paint,
                vehicle_condition: mapCondition(vehicle_condition),
                location,
                description,
                special_features,
                price: new Prisma.Decimal(price),
                carte_grise_url,
                service_history_url,
                verification_status: "pending",
                sale_status: "available",
                // Auction consent fields
                auction_consent,
                auction_starting_price: auction_starting_price ? new Prisma.Decimal(auction_starting_price) : null,
                auction_reserve_price: auction_reserve_price ? new Prisma.Decimal(auction_reserve_price) : null,
            }
        })

        const directSaleId = newDirectSale.id

        // Create Vehicle and Sale in parallel with photo processing
        // But we need the ID first for photos, so we create the record first.

        // Process photos sequentially to avoid server overload
        const photoPaths: string[] = []
        console.log(`[direct-sales] Starting batched processing of ${photos.length} photos (concurrency: 3)`)

        // Process photos in batches of 3 to speed up but avoid crashing server
        for (let i = 0; i < photos.length; i += 3) {
            const batch = photos.slice(i, i + 3)
            const batchPromises = batch.map(async (f, index) => {
                const globalIndex = i + index
                if (f.size === 0) return null

                console.log(`[direct-sales] Processing photo ${globalIndex + 1}/${photos.length}: ${f.name}`)
                const startTime = Date.now()
                const name = sanitizeFilename(f.name || `photo_${globalIndex}`)
                const ext = path.extname(name)
                const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${name}`
                const key = `direct-sales/${filename}`

                try {
                    const arrayBuffer = await f.arrayBuffer()
                    let buffer = Buffer.from(arrayBuffer)
                    const contentType = getContentTypeFromExt(ext.replace('.', ''))

                    // Apply watermark if image
                    const { data } = await maybeApplyWatermark(buffer, contentType, filename)
                    buffer = Buffer.from(data)

                    await R2.send(new PutObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: key,
                        Body: buffer,
                        ContentType: f.type || contentType || 'application/octet-stream',
                    }))

                    const url = `${process.env.R2_PUBLIC_DOMAIN}/${key}`
                    console.log(`[direct-sales] Photo ${globalIndex + 1} uploaded in ${Date.now() - startTime}ms`)
                    return url
                } catch (e) {
                    console.warn(`[direct-sales] Photo ${globalIndex + 1} failed:`, e)
                    return null
                }
            })

            const batchResults = await Promise.all(batchPromises)
            batchResults.forEach(url => {
                if (url) photoPaths.push(url)
            })
        }

        const serviceDocPaths: string[] = []
        if (serviceFiles && serviceFiles.length > 0) {
            console.log(`[direct-sales] Processing ${serviceFiles.length} service docs`)
            for (let i = 0; i < serviceFiles.length; i++) {
                const f = serviceFiles[i]
                if (f.size === 0) continue

                console.log(`[direct-sales] Processing service doc ${i + 1}/${serviceFiles.length}: ${f.name}`)
                const name = sanitizeFilename(f.name || `service_${i}`)
                const ext = path.extname(name)
                const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${name}`
                const key = `direct-sales/${filename}`

                try {
                    const arrayBuffer = await f.arrayBuffer()
                    let buffer = Buffer.from(arrayBuffer)
                    const contentType = getContentTypeFromExt(ext.replace('.', ''))

                    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext.replace('.', '').toLowerCase())) {
                        const { data } = await maybeApplyWatermark(buffer, contentType, filename)
                        buffer = Buffer.from(data)
                    }

                    await R2.send(new PutObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: key,
                        Body: buffer,
                        ContentType: f.type || contentType || 'application/octet-stream',
                    }))

                    const url = `${process.env.R2_PUBLIC_DOMAIN}/${key}`
                    serviceDocPaths.push(url)
                    console.log(`[direct-sales] Service doc ${i + 1} uploaded: ${url}`)
                } catch (e) {
                    console.warn(`[direct-sales] Service doc ${i + 1} failed:`, e)
                }
            }
        }

        // Save photos to DB
        const validPhotos = photoPaths.filter(p => p !== null) as string[]
        const validServiceDocs = serviceDocPaths.filter(p => p !== null) as string[]

        const allPhotos = [...validPhotos, ...validServiceDocs]

        if (allPhotos.length > 0) {
            await prisma.direct_sale_photos.createMany({
                data: allPhotos.map((url, index) => ({
                    direct_sale_id: directSaleId,
                    photo_url: url,
                    position_order: index
                }))
            })
        }

        // ISR revalidation
        revalidateTag("direct-sales")
        revalidateTag("filters")

        return { success: true, directSaleId }

    } catch (err) {
        console.error("createDirectSale Action Error:", err)
        return { success: false, error: (err as Error).message }
    }
}
