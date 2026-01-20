import { NextRequest, NextResponse } from "next/server"
import { getAdminFromCookie } from "@/lib/admin-auth"
import prisma from "@/lib/prisma"
import { error as logError } from "@/lib/logger"
import fs from "fs/promises"
import path from "path"
import { maybeApplyWatermark, getContentTypeFromExt } from "@/lib/image-processing"
import { KarkeyCarUpdateSchema, IdParamSchema } from "@/lib/schemas"
import { errorResponse, ErrorCode } from "@/lib/errors"

function sanitizeFilename(name: string) {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

export const dynamic = "force-dynamic"

// GET - Fetch a single Karkey car by ID (admin only)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminFromCookie()
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: idParam } = await params
        const idResult = IdParamSchema.safeParse({ id: idParam })
        if (!idResult.success) {
            return NextResponse.json({ error: { code: ErrorCode.VALIDATION_ERROR, message: "Invalid car ID" } }, { status: 400 })
        }
        const id = idResult.data.id

        const car = await prisma.karkey_cars.findUnique({
            where: { id },
            include: {
                photos: {
                    orderBy: { position_order: "asc" },
                },
                inquiries: {
                    orderBy: { created_at: "desc" },
                    take: 10,
                },
                _count: {
                    select: { inquiries: true },
                },
            },
        })

        if (!car) {
            return NextResponse.json({ error: "Car not found" }, { status: 404 })
        }

        return NextResponse.json({ success: true, car })
    } catch (err) {
        logError("[admin karkey-cars/:id GET] Error:", err)
        return NextResponse.json(errorResponse(err), { status: 500 })
    }
}

// PUT - Update a Karkey car (admin only)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminFromCookie()
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: idParam } = await params
        const id = parseInt(idParam)
        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid car ID" }, { status: 400 })
        }

        const contentType = request.headers.get("content-type") || ""
        let body: any = {}
        let photoFiles: File[] = []
        let existingPhotos: string[] | null = null

        if (contentType.includes("application/json")) {
            body = await request.json()
        } else if (contentType.includes("multipart/form-data")) {
            const form = await request.formData()
            body = {
                make: form.get("make"),
                model: form.get("model"),
                year: form.get("year"),
                mileage: form.get("mileage"),
                transmission: form.get("transmission"),
                fuel_type: form.get("fuel_type"),
                engine_size: form.get("engine_size"),
                doors: form.get("doors"),
                vehicle_condition: form.get("vehicle_condition"),
                location: form.get("location"),
                description: form.get("description"),
                price: form.get("price"),
                is_active: form.get("is_active") === "true" ? true : form.get("is_active") === "false" ? false : undefined,
            }
            photoFiles = form.getAll("photos") as File[]
            const existingStr = form.get("existingPhotos")
            if (existingStr) {
                try {
                    existingPhotos = JSON.parse(existingStr as string)
                } catch (e) {
                    existingPhotos = null
                }
            }
        }

        const {
            make,
            model,
            year,
            mileage,
            transmission,
            fuel_type,
            engine_size,
            doors,
            vehicle_condition,
            location,
            description,
            price,
            is_active,
            photos, // Used in JSON case
        } = body

        // Check if car exists
        const carExists = await prisma.karkey_cars.findUnique({
            where: { id },
        })

        if (!carExists) {
            return NextResponse.json({ error: "Car not found" }, { status: 404 })
        }

        // Update car data
        const updateData: any = { updated_at: new Date() }
        if (make !== null && make !== undefined) updateData.make = String(make)
        if (model !== null && model !== undefined) updateData.model = String(model)
        if (year !== null && year !== undefined) updateData.year = parseInt(String(year))
        if (mileage !== null && mileage !== undefined) updateData.mileage = parseInt(String(mileage))
        if (transmission !== null && transmission !== undefined) updateData.transmission = transmission as any
        if (fuel_type !== null && fuel_type !== undefined) updateData.fuel_type = fuel_type as any
        if (engine_size !== undefined) updateData.engine_size = engine_size === "null" ? null : engine_size
        if (doors !== undefined) updateData.doors = doors === "null" ? null : doors
        if (vehicle_condition !== null && vehicle_condition !== undefined) updateData.vehicle_condition = vehicle_condition as any
        if (location !== null && location !== undefined) updateData.location = String(location)
        if (description !== null && description !== undefined) updateData.description = String(description)
        if (price !== null && price !== undefined) updateData.price = parseFloat(String(price))
        if (is_active !== undefined) updateData.is_active = !!is_active

        await prisma.karkey_cars.update({
            where: { id },
            data: updateData,
        })

        // Handle photos update
        if (contentType.includes("multipart/form-data")) {
            // Remove photos not in existingPhotos
            if (existingPhotos !== null) {
                await prisma.karkey_car_photos.deleteMany({
                    where: {
                        karkey_car_id: id,
                        NOT: { photo_url: { in: existingPhotos } }
                    },
                })

                // Update position_order for remaining existing photos
                for (let i = 0; i < existingPhotos.length; i++) {
                    await prisma.karkey_car_photos.updateMany({
                        where: { karkey_car_id: id, photo_url: existingPhotos[i] },
                        data: { position_order: i }
                    })
                }
            } else {
                // If it's a full replace
                await prisma.karkey_car_photos.deleteMany({ where: { karkey_car_id: id } })
            }

            // Save and add new photo files
            if (photoFiles && photoFiles.length > 0) {
                const uploadsDir = path.join(process.cwd(), "public", "uploads", "karkey-cars")
                await fs.mkdir(uploadsDir, { recursive: true })

                const currentCount = existingPhotos?.length || 0

                for (let i = 0; i < photoFiles.length; i++) {
                    const f = photoFiles[i]
                    if (!f.size) continue

                    const name = sanitizeFilename(f.name || `photo_${i}`)
                    const ext = path.extname(name)
                    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
                    const outPath = path.join(uploadsDir, filename)

                    let buffer: Uint8Array = Buffer.from(await f.arrayBuffer())
                    const contentType = getContentTypeFromExt(ext.replace('.', ''))
                    const { data } = await maybeApplyWatermark(buffer, contentType, filename)
                    buffer = data as Uint8Array

                    await fs.writeFile(outPath, buffer)
                    const photo_url = `/uploads/karkey-cars/${filename}`

                    await prisma.karkey_car_photos.create({
                        data: {
                            karkey_car_id: id,
                            photo_url,
                            position_order: currentCount + i,
                        },
                    })
                }
            }
        } else if (photos && Array.isArray(photos)) {
            // Handle JSON photos update (legacy or specific use case)
            await prisma.karkey_car_photos.deleteMany({ where: { karkey_car_id: id } })
            if (photos.length > 0) {
                await prisma.karkey_car_photos.createMany({
                    data: photos.map((photo_url: string, index: number) => ({
                        karkey_car_id: id,
                        photo_url,
                        position_order: index,
                    })),
                })
            }
        }

        // Fetch complete car with photos
        const completeCar = await prisma.karkey_cars.findUnique({
            where: { id },
            include: {
                photos: {
                    orderBy: { position_order: "asc" },
                },
            },
        })

        return NextResponse.json({
            success: true,
            car: completeCar,
        })
    } catch (err) {
        logError("[admin karkey-cars/:id PUT] Error:", err)
        return NextResponse.json(errorResponse(err), { status: 500 })
    }
}

// DELETE - Soft delete a Karkey car (set is_active=false)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getAdminFromCookie()
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: idParam } = await params
        const idResult = IdParamSchema.safeParse({ id: idParam })
        if (!idResult.success) {
            return NextResponse.json({ error: { code: ErrorCode.VALIDATION_ERROR, message: "Invalid car ID" } }, { status: 400 })
        }
        const id = idResult.data.id

        // Check if car exists
        const existingCar = await prisma.karkey_cars.findUnique({
            where: { id },
        })

        if (!existingCar) {
            return NextResponse.json({ error: "Car not found" }, { status: 404 })
        }

        // Soft delete by setting is_active to false
        await prisma.karkey_cars.update({
            where: { id },
            data: {
                is_active: false,
                updated_at: new Date(),
            },
        })

        return NextResponse.json({
            success: true,
            message: "Car has been deactivated",
        })
    } catch (err) {
        logError("[admin karkey-cars/:id DELETE] Error:", err)
        return NextResponse.json(errorResponse(err), { status: 500 })
    }
}
