import { NextRequest, NextResponse } from "next/server"
import { getAdminFromCookie } from "@/lib/admin-auth"
import prisma from "@/lib/prisma"
import { error as logError } from "@/lib/logger"
import path from "path"
import { revalidateTag } from "next/cache"
import { maybeApplyWatermark, getContentTypeFromExt } from "@/lib/image-processing"
import { z } from "zod"
import { errorResponse, ErrorCode } from "@/lib/errors"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const R2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
})

const KarkeyCarSchema = z.object({
    make: z.string().min(1),
    model: z.string().min(1),
    year: z.coerce.number().int().min(1900).max(2100),
    mileage: z.coerce.number().int().min(0),
    transmission: z.string().min(1),
    fuel_type: z.string().min(1),
    vehicle_condition: z.string().min(1),
    location: z.string().min(1),
    description: z.string().min(1),
    price: z.coerce.number().positive(),
    engine_size: z.string().optional(),
    doors: z.string().optional(),
    interior_color: z.string().optional(),
    exterior_color: z.string().optional(),
    is_original_paint: z.boolean().optional(),
    special_features: z.string().optional(),
});

function sanitizeFilename(name: string) {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

export const dynamic = "force-dynamic"

// GET - List all Karkey cars (admin only)
export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminFromCookie()
        if (!admin) {
            return NextResponse.json({ error: { code: ErrorCode.UNAUTHORIZED, message: "Unauthorized" } }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const includeInactive = searchParams.get("includeInactive") === "true"
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const skip = (page - 1) * limit

        const where = includeInactive ? {} : { is_active: true }

        const [cars, total] = await Promise.all([
            prisma.karkey_cars.findMany({
                where,
                include: {
                    photos: {
                        orderBy: { position_order: "asc" },
                    },
                    _count: {
                        select: { inquiries: true },
                    },
                },
                orderBy: { created_at: "desc" },
                skip,
                take: limit,
            }),
            prisma.karkey_cars.count({ where }),
        ])

        return NextResponse.json({
            success: true,
            cars,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (err) {
        logError("[admin karkey-cars GET] Error:", err)
        return NextResponse.json(errorResponse(err), { status: 500 })
    }
}

// POST - Create a new Karkey car (admin only)
export async function POST(request: NextRequest) {
    try {
        const admin = await getAdminFromCookie()
        if (!admin) {
            return NextResponse.json({ error: { code: ErrorCode.UNAUTHORIZED, message: "Unauthorized" } }, { status: 401 })
        }

        const form = await request.formData()

        const make = String(form.get("make") ?? "")
        const model = String(form.get("model") ?? "")
        const year = String(form.get("year") ?? "")
        const mileage = String(form.get("mileage") ?? "")
        const transmission = String(form.get("transmission") ?? "")
        const fuel_type = String(form.get("fuel_type") ?? "")
        const engine_size = String(form.get("engine_size") ?? "") || null
        const doors = String(form.get("doors") ?? "") || null
        const interior_color = String(form.get("interior_color") ?? "") || null
        const exterior_color = String(form.get("exterior_color") ?? "") || null
        const is_original_paint = form.get("is_original_paint") === "true"
        const vehicle_condition = String(form.get("vehicle_condition") ?? "")
        const location = String(form.get("location") ?? "")
        const description = String(form.get("description") ?? "")
        const special_features = String(form.get("special_features") ?? "") || null
        const price = String(form.get("price") ?? "")

        const photoFiles = form.getAll("photos") as File[]

        // Validate required fields
        if (
            !make ||
            !model ||
            !year ||
            !mileage ||
            !transmission ||
            !fuel_type ||
            !vehicle_condition ||
            !location ||
            !description ||
            !price
        ) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        // Create the car
        const car = await prisma.karkey_cars.create({
            data: {
                make,
                model,
                year: parseInt(year),
                mileage: parseInt(mileage),
                transmission: transmission as any,
                fuel_type: fuel_type as any,
                engine_size,
                doors,
                interior_color,
                exterior_color,
                is_original_paint,
                vehicle_condition: vehicle_condition as any,
                location,
                description,
                special_features,
                price: parseFloat(price),
                added_by: admin.id,
                is_active: true,
            },
        })

        // Upload to Cloudflare R2
        // Upload to Cloudflare R2
        if (photoFiles && photoFiles.length > 0) {
            const uploadPromises = photoFiles.map(async (f, i) => {
                if (!f.size) return null;

                const name = sanitizeFilename(f.name || `photo_${i}`)
                const ext = path.extname(name)
                const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
                const key = `karkey-cars/${filename}`

                let buffer: Uint8Array = Buffer.from(await f.arrayBuffer())
                const contentType = getContentTypeFromExt(ext.replace('.', ''))

                // Apply watermark if needed
                try {
                    const { data } = await maybeApplyWatermark(buffer, contentType, filename)
                    buffer = data as Uint8Array
                } catch (e) {
                    console.error("Watermark failed, proceeding with original", e)
                }

                await R2.send(new PutObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: key,
                    Body: buffer,
                    ContentType: f.type || contentType || 'application/octet-stream',
                }))

                const photo_url = `${process.env.R2_PUBLIC_DOMAIN}/${key}`

                return prisma.karkey_car_photos.create({
                    data: {
                        karkey_car_id: car.id,
                        photo_url,
                        position_order: i,
                    },
                })
            })

            await Promise.all(uploadPromises)
        }

        // Fetch the complete car with photos
        const completeCar = await prisma.karkey_cars.findUnique({
            where: { id: car.id },
            include: {
                photos: {
                    orderBy: { position_order: "asc" },
                },
            },
        })

        // ISR revalidation
        // @ts-ignore
        revalidateTag("karkey-cars", "max")
        // @ts-ignore
        revalidateTag("filters", "max")

        return NextResponse.json({
            success: true,
            car: completeCar,
        })
    } catch (err) {
        logError("[admin karkey-cars POST] Error:", err)
        return NextResponse.json(errorResponse(err), { status: 500 })
    }
}
