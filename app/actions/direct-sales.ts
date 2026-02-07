"use server"

import path from "path"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/mysql-auth"
import { maybeApplyWatermark, getContentTypeFromExt, generateTinyPlaceholder } from "@/lib/image-processing"
import { parseOrThrow, CreateDirectSaleSchema } from "@/lib/schemas"
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

        // Validate data using Zod
        const rawData = Object.fromEntries(formData)
        // Handle fields that might be missing in Object.fromEntries if empty
        const validatedData = parseOrThrow(CreateDirectSaleSchema, rawData)

        const {
            make, model, year, mileage, transmission, fuel_type,
            engine_size, doors, interior_color, exterior_color,
            is_original_paint, condition, location, description,
            special_features, price,
            auction_consent, auction_starting_price, auction_reserve_price
        } = validatedData

        const isOriginalPaint = is_original_paint === "true"
        const hasAuctionConsent = auction_consent === "true"

        // optional docs
        const carteGriseFile = formData.get("carte_grise") as File | null
        const serviceFiles = formData.getAll("service_docs") as File[]

        // photos
        // We now support two modes:
        // 1. Legacy: File[] in 'photos' (processed on server) -- KEPT FOR COMPATIBILITY
        // 2. Optimistic: 'photo_urls' + 'photo_blurhashes' (already on R2) -- NEW FAST PATH

        const photosFiles = formData.getAll("photos") as File[]
        const photoUrls = formData.getAll("photo_urls") as string[]
        const photoBlurhashes = formData.getAll("photo_blurhashes") as string[]

        const hasOptimisticPhotos = photoUrls.length > 0
        const hasLegacyPhotos = photosFiles.length > 0 && photosFiles[0].size > 0

        // basic server-side validation
        if ((!hasOptimisticPhotos && !hasLegacyPhotos) || (hasOptimisticPhotos && photoUrls.length < 5) || (hasLegacyPhotos && photosFiles.length < 5)) {
            // If mixing both? We assume wizard uses one or the other.
            // If optimistic, we trust the count.
            return { success: false, error: "At least 5 photos are required" }
        }

        // Price check is now handled by Zod (min 10000)
        // Year/Mileage checks are handled by Zod

        // OPTIMISTIC DOCUMENTS (Fast Path)
        const carteGriseUrlOptimistic = formData.get("carte_grise_url") as string | null
        const serviceDocUrlsOptimistic = formData.getAll("service_doc_urls") as string[]

        // save carte grise if present
        let carte_grise_url: string | null = null

        if (carteGriseUrlOptimistic) {
            carte_grise_url = carteGriseUrlOptimistic
            // Using optimistic carte_grise
        } else if (carteGriseFile && carteGriseFile.size > 0) {
            // Legacy slow path
            // Processing carte_grise (legacy path)
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
                // carte_grise uploaded
            } catch (e) {
                console.warn("[direct-sales] Carte grise upload failed:", e)
            }
        }

        const serviceDocPaths: string[] = []

        if (serviceDocUrlsOptimistic.length > 0) {
            // Using optimistic service docs
            serviceDocPaths.push(...serviceDocUrlsOptimistic)
        } else if (serviceFiles && serviceFiles.length > 0) {
            // Legacy slow path
            // Processing service docs (legacy path)
            for (let i = 0; i < serviceFiles.length; i++) {
                const f = serviceFiles[i]
                if (f.size === 0) continue

                // Processing service doc
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
                    // Service doc uploaded
                } catch (e) {
                    console.warn(`[direct-sales] Service doc ${i + 1} failed:`, e)
                }
            }
        }

        const service_history_url: string | null = serviceDocPaths.length > 0 ? serviceDocPaths[0] : null
        // We also store them in photos table for carousel support, but the main column is important for admin/profile views.
        // Logic below maps to separate table.


        // Create direct sale using Prisma
        const newDirectSale = await prisma.direct_sales.create({
            data: {
                user_id: userId,
                make,
                model,
                year,
                mileage,
                transmission: mapTransmission(transmission),
                fuel_type: mapFuelType(fuel_type),
                engine_size: engine_size || null,
                doors: doors || null,
                interior_color: interior_color || null,
                exterior_color: exterior_color || null,
                is_original_paint: isOriginalPaint,
                vehicle_condition: mapCondition(condition),
                location,
                description: description || "",
                special_features: special_features || null,
                price: price,
                carte_grise_url,
                service_history_url,
                verification_status: "pending",
                sale_status: "available",
                // Auction consent fields
                auction_consent: hasAuctionConsent,
                auction_starting_price: auction_starting_price ? Number(auction_starting_price) : null,
                auction_reserve_price: auction_reserve_price ? Number(auction_reserve_price) : null,
            }
        })

        const directSaleId = newDirectSale.id

        // Create Vehicle and Sale in parallel with photo processing
        // But we need the ID first for photos, so we create the record first.

        // Process photos sequentially to avoid server overload
        const photoPaths: { url: string; blurhash: string | null }[] = []

        if (hasOptimisticPhotos) {
            // Using optimistic photos
            photoUrls.forEach((url, i) => {
                photoPaths.push({
                    url,
                    blurhash: photoBlurhashes[i] || null
                })
            })
        } else {
            // FALLBACK: Legacy Monolithic Upload
            const photos = photosFiles
            // Batched processing of photos

            // Process photos in batches of 3 to speed up but avoid crashing server
            for (let i = 0; i < photos.length; i += 3) {
                const batch = photos.slice(i, i + 3)
                const batchPromises = batch.map(async (f, index) => {
                    const globalIndex = i + index
                    if (f.size === 0) return null

                    // Processing photo
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

                        // Generate Placeholder (BlurHash equivalent)
                        const blurhash = await generateTinyPlaceholder(buffer)

                        await R2.send(new PutObjectCommand({
                            Bucket: process.env.R2_BUCKET_NAME,
                            Key: key,
                            Body: buffer,
                            ContentType: f.type || contentType || 'application/octet-stream',
                        }))

                        const url = `${process.env.R2_PUBLIC_DOMAIN}/${key}`
                        // Photo uploaded
                        return { url, blurhash }
                    } catch (e) {
                        console.warn(`[direct-sales] Photo ${globalIndex + 1} failed:`, e)
                        return null
                    }
                })

                const batchResults = await Promise.all(batchPromises)
                batchResults.forEach(res => {
                    if (res) photoPaths.push(res)
                })
            }
        }



        // Save photos to DB
        const validPhotos = photoPaths.filter(p => p !== null)
        const validServiceDocs = serviceDocPaths.filter(p => p !== null) as string[]

        const allPhotos = [...validPhotos]

        if (allPhotos.length > 0) {
            await prisma.direct_sale_photos.createMany({
                data: allPhotos.map((item, index) => {
                    // Handle both string URLs (legacy/service docs) and object {url, blurhash}
                    if (typeof item === 'string') {
                        return {
                            direct_sale_id: directSaleId,
                            photo_url: item,
                            position_order: index,
                            blurhash: null
                        }
                    } else {
                        return {
                            direct_sale_id: directSaleId,
                            photo_url: item.url,
                            position_order: index,
                            blurhash: item.blurhash
                        }
                    }
                })
            })
        }

        // ISR revalidation
        // ISR revalidation
        // @ts-ignore
        revalidateTag("direct-sales", "max")
        // @ts-ignore
        revalidateTag("filters", "max")

        return { success: true, directSaleId }

    } catch (err) {
        console.error("createDirectSale Action Error:", err)
        return { success: false, error: (err as Error).message }
    }
}
