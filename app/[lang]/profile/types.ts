export interface UserProfile {
    id: number;
    username: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone_number: string | null;
    user_type: string;
    profile_picture: string | null;
    is_profile_complete: boolean;
    created_at: Date | string; // allowing string for serialized date
    updated_at: Date | string;
}

export interface AuctionItem {
    id: number;
    title: string;
    starting_price: number | null;
    startingPrice: number | null; // deprecated, keeping for compatibility
    current_price: number | null;
    image_url: string | null;
    status: string; // "none", "cancelled", etc.
    start_date: Date | null;
    end_date: Date | null;
    vehicle_id: number;
    created_at: Date;
    type: "auction";
}

export interface DirectSaleItem {
    id: number;
    title: string; // "Make Model Year" or similar
    starting_price: number | null;
    startingPrice: number | null; // deprecated
    current_price: null; // Direct sales don't have current bids typically
    image_url: string | null;
    status: string; // "active", "completed", "pending"
    start_date: Date | null; // created_at usually
    end_date: null;
    vehicle_id: null;
    created_at: Date;
    type: "direct_sale";
}

export type ListingItem = AuctionItem | DirectSaleItem;

export interface ListingPerformance {
    id: number;
    title: string;
    image_url: string | null;
    price: number;
    status: string;
    views: number;
    saves: number;
    contacts: number;
    created_at: Date;
}

export interface UserStatistics {
    totalViews: number;
    totalSaves: number;
    totalContacts: number;
    activeListings: number;
    soldListings: number;
    approvedListings: number;
    pendingListings: number;
    totalListings: number;
    listingPerformance: ListingPerformance[];
}

export interface StatisticsResponse {
    success: boolean;
    error?: string;
    statistics: UserStatistics;
}
