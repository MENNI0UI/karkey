
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import path from "path";
import { IdParamSchema } from "@/lib/schemas";
import { errorResponse, ErrorCode } from "@/lib/errors";

function normalizePhotoUrl(p: any) {
    if (!p) return null;
    const s = String(p).trim();
    if (!s) return null;
    if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) return s;
    return `/uploads/vehicles/${path.basename(s)}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;

        // Validate ID parameter with Zod
        const parsed = IdParamSchema.safeParse({ id: idParam });
        if (!parsed.success) {
            return NextResponse.json({
                success: false,
                error: { code: ErrorCode.VALIDATION_ERROR, message: "Invalid id", details: parsed.error.flatten() }
            }, { status: 400 });
        }
        const id = parsed.data.id;

        // Fetch direct sale item joined with user (seller) and photos
        const item = await prisma.direct_sales.findUnique({
            where: { id },
            include: {
                users_direct_sales_user_idTousers: {
                    select: {
                        id: true,
                        username: true,
                        first_name: true,
                        last_name: true,
                        profile_picture: true,

                        phone_number: true,
                    }
                },
                direct_sale_photos: {
                    orderBy: { position_order: 'asc' },
                    select: { photo_url: true }
                }
            }
        });

        if (!item) {
            return NextResponse.json({ success: false, error: { code: ErrorCode.NOT_FOUND, message: "Direct sale item not found" } }, { status: 404 });
        }

        // normalize photos
        let photos = item.direct_sale_photos.map((r) => normalizePhotoUrl(r.photo_url)).filter(Boolean) as string[];
        // backward compatibility: carte_grise_url or service_history_url as photos? 
        // Usually these are docs, but if they are images user might expect them. 
        // Approved route adds service_history_url if not present. Let's consistency do that.
        if (item.service_history_url) {
            const sh = normalizePhotoUrl(item.service_history_url);
            if (sh && !photos.includes(sh)) photos.push(sh);
        }
        // If no photos, use placeholder
        if (photos.length === 0) photos = ["/placeholder.svg"];

        const safeNumber = (v: any) => {
            if (v === null || v === undefined || v === "") return null
            try { return Number(v) } catch { return null }
        }

        const result = {
            success: true,
            direct_sale: {
                id: Number(item.id),
                user_id: Number(item.user_id),
                make: item.make ?? null,
                model: item.model ?? null,
                year: safeNumber(item.year ?? null),
                mileage: safeNumber(item.mileage ?? null),
                transmission: item.transmission ?? null,
                fuel_type: item.fuel_type ?? null,
                engine_size: safeNumber(item.engine_size ?? null),
                doors: safeNumber(item.doors ?? null),
                condition: item.vehicle_condition ?? null,
                location: item.location ?? null,
                description: item.description ?? null,
                exterior_color: item.exterior_color ?? null,
                interior_color: item.interior_color ?? null,
                is_original_paint: item.is_original_paint ?? null,
                special_features: item.special_features ?? null,
                price: safeNumber(item.price),
                sale_status: item.sale_status,
                verification_status: item.verification_status,
                created_at: item.created_at ? new Date(item.created_at).toISOString() : null,
                updated_at: item.updated_at ? new Date(item.updated_at).toISOString() : null,
                photos,
                // map to common field names for frontend compatibility (ShowroomCard etc)
                vehicle_condition: item.vehicle_condition ?? null,
                displayPrice: safeNumber(item.price),
            },
            seller: {
                id: item.users_direct_sales_user_idTousers?.id ?? null,
                username: item.users_direct_sales_user_idTousers?.username ?? null,
                first_name: item.users_direct_sales_user_idTousers?.first_name ?? null,
                last_name: item.users_direct_sales_user_idTousers?.last_name ?? null,
                profile_picture: item.users_direct_sales_user_idTousers?.profile_picture ?? null,

                phone_number: item.users_direct_sales_user_idTousers?.phone_number ?? null,
            },
            server_time: new Date().toISOString(),
        };

        return NextResponse.json(result);
    } catch (err) {
        console.error("[api/direct-sales/[id]] error:", err);
        return NextResponse.json(errorResponse(err), { status: 500 });
    }
}
