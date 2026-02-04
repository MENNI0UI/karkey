
import { normalizePhotoUrl } from "./index";

/**
 * Shared vehicle mapper
 */
export function mapVehicle(item: any): any {
    const photos = Array.isArray(item.direct_sale_photos)
        ? item.direct_sale_photos.map((p: any) => normalizePhotoUrl(p.photo_url)).filter(Boolean) as string[]
        : [];

    const seller = item.users_direct_sales_user_idTousers ? {
        id: item.users_direct_sales_user_idTousers.id,
        name: item.users_direct_sales_user_idTousers.username ?? item.users_direct_sales_user_idTousers.first_name ?? null,
        avatar: item.users_direct_sales_user_idTousers.profile_picture ?? null,
        email: item.users_direct_sales_user_idTousers.email ?? null,
    } : null;

    return {
        id: item.id,
        auction_id: item.id, // compatibility
        make: item.make,
        model: item.model,
        year: item.year,
        mileage: item.mileage,
        transmission: item.transmission,
        fuel_type: item.fuel_type,
        vehicle_condition: item.vehicle_condition,
        location: item.location,
        price: item.price ? Number(item.price) : null,
        current_bid: item.auction_current_bid ? Number(item.auction_current_bid) : null,
        starting_price: item.auction_starting_price ? Number(item.auction_starting_price) : null,
        startingPrice: item.auction_starting_price ? Number(item.auction_starting_price) : null,
        auction_start_date: item.auction_start_date ? new Date(item.auction_start_date).toISOString() : null,
        auction_end_date: item.auction_end_date ? new Date(item.auction_end_date).toISOString() : null,
        photos,
        image: photos[0] || null,
        type: item.auction_mode ? "auction" : "direct_sale",
        user_id: item.user_id,
        seller,
        engine_size: item.engine_size ?? null,
        doors: item.doors ?? null,
        created_at: item.created_at,
        description: item.description,
    };
}
