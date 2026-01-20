// ============================================
// Vehicle Types - Shared across frontend/backend
// ============================================

export interface VehiclePhoto {
    id?: number;
    vehicle_id?: number;
    photo_url: string;
    position_order?: number;
}

export interface Seller {
    id?: number;
    username?: string | null;
    name?: string | null;
    email?: string | null;
    phone_number?: string | null;
    avatar?: string | null;
}

/**
 * Base vehicle interface shared across auctions, direct sales, and showroom.
 */
export interface Vehicle {
    id: number;
    make: string;
    model: string;
    year: number;
    mileage: number;
    transmission: string;
    fuel_type: string;
    vehicle_condition: string | null;
    location: string;
    description?: string | null;
    engine_size?: number | null;
    doors?: number | null;
    exterior_color?: string | null;
    interior_color?: string | null;
    photos: string[];
    image: string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
}

/**
 * Auction vehicle with auction-specific fields.
 */
export interface AuctionVehicle extends Vehicle {
    auction_id: number | null;
    starting_price: number | null;
    startingPrice?: number | null; // alias
    auction_start_date: string | null;
    auction_end_date: string | null;
    seller?: Seller | null;
    user_id?: number;
}

/**
 * Direct sale vehicle with sale-specific fields.
 */
export interface DirectSaleVehicle extends Vehicle {
    user_id?: number;
    price: number | null;
    sale_status?: 'available' | 'sold' | 'pending';
    verification_status?: 'pending' | 'approved' | 'rejected';
    seller?: Seller | null;
    service_history_url?: string | null;
}

/**
 * Karkey Cars vehicle (dealership inventory).
 */
export interface KarkeyCar extends Vehicle {
    price: number | null;
    is_active?: boolean;
    vin?: string | null;
}
