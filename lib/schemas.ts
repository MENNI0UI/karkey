import { z, ZodSchema } from 'zod';

// ============================================
// Reusable Zod Schemas for Server Actions
// ============================================

/**
 * Search filters schema for vehicle queries.
 * Supports single value or array for multi-select filters.
 */
export const SearchFiltersSchema = z.object({
    make: z.union([z.string(), z.array(z.string())]).optional(),
    model: z.union([z.string(), z.array(z.string())]).optional(),
    year: z.union([z.string(), z.array(z.string())]).optional(),
    location: z.union([z.string(), z.array(z.string())]).optional(),
    fuel_type: z.union([z.string(), z.array(z.string())]).optional(),
    transmission: z.union([z.string(), z.array(z.string())]).optional(),
    vehicle_condition: z.union([z.string(), z.array(z.string())]).optional(),
    exterior_color: z.union([z.string(), z.array(z.string())]).optional(),
    q: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    minMileage: z.coerce.number().optional(),
    maxMileage: z.coerce.number().optional(),
    minYear: z.coerce.number().optional(),
    maxYear: z.coerce.number().optional(),
}).passthrough(); // Allow unknown keys for flexibility

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;

/**
 * Pagination schema with sensible defaults.
 */
export const PaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
});

export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * Direct Sales search filters (extends base with price/condition specifics).
 */
export const DirectSalesFiltersSchema = SearchFiltersSchema.extend({
    sale_status: z.enum(['available', 'sold', 'pending']).optional(),
});

export type DirectSalesFilters = z.infer<typeof DirectSalesFiltersSchema>;

// ============================================
// Parse Helper - Clean Validation in Actions
// ============================================

export interface ValidationError {
    code: 'VALIDATION_ERROR';
    issues: z.typeToFlattenedError<any>;
}

/**
 * Parse and validate data against a Zod schema.
 * Throws a structured ValidationError on failure.
 * 
 * @example
 * const filters = parseOrThrow(SearchFiltersSchema, rawFilters);
 */
export function parseOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new Error(JSON.stringify({
            code: 'VALIDATION_ERROR',
            issues: result.error.flatten(),
        }));
    }
    return result.data;
}

/**
 * Safe parse that returns a Result-like object instead of throwing.
 */
export function safeParse<T>(schema: ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: ValidationError } {
    const result = schema.safeParse(data);
    if (!result.success) {
        return {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                issues: result.error.flatten(),
            },
        };
    }
    return { success: true, data: result.data };
}

// ============================================
// Auth Schemas
// ============================================

/**
 * Login credentials schema.
 */
export const LoginSchema = z.object({
    email: z.string().min(1, "Email is required").email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Registration schema with comprehensive validation.
 */
export const RegisterSchema = z.object({
    email: z.string().min(1, "Email is required").email("Invalid email format"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    username: z.string().min(3, "Username must be at least 3 characters").max(50),
    phone_number: z.string().optional(),
    full_name: z.string().optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const RegisterFormSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    phone_number: z.string().min(10, "Phone number is required"),
    prenom: z.string().min(1, "First name is required"),
    nom: z.string().min(1, "Last name is required"),
    user_type: z.enum(['individual', 'dealer']),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export const DirectSaleContactSchema = z.object({
    direct_sale_id: z.coerce.number().int().positive(),
    name: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    message: z.string().optional(),
}).refine((data) => data.name || data.email || data.phone, {
    message: "Provide name, email or phone",
    path: ["email"],
});

export const KarkeyCarInquirySchema = z.object({
    karkey_car_id: z.coerce.number().int().positive(),
    user_id: z.coerce.number().int().positive().optional(),
    name: z.string().min(1, "Name is required"),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    message: z.string().min(1, "Message is required"),
}).refine((data) => data.phone || data.email, {
    message: "Please provide at least one contact method (phone or email)",
    path: ["email"],
});

/**
 * Profile update schema.
 */
export const ProfileUpdateSchema = z.object({
    username: z.string().min(3).max(50).optional(),
    full_name: z.string().max(100).optional(),
    phone_number: z.string().optional(),
    profile_picture: z.string().url().optional(),
    bio: z.string().max(500).optional(),
});
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

/**
 * Direct Sale creation schema.
 */
export const CreateDirectSaleSchema = z.object({
    make: z.string().min(1, "Make is required"),
    model: z.string().min(1, "Model is required"),
    year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
    mileage: z.coerce.number().int().nonnegative(),
    transmission: z.string(), // We'll map this in the action
    fuel_type: z.string(),    // We'll map this in the action
    engine_size: z.string().optional().or(z.literal("")),
    doors: z.string().optional().or(z.literal("")),
    interior_color: z.string().optional().or(z.literal("")),
    exterior_color: z.string().optional().or(z.literal("")),
    is_original_paint: z.string().optional(), // "true" or "false" from FormData
    condition: z.string(),    // We'll map this in the action
    location: z.string().min(1, "Location is required"),
    description: z.string().optional().or(z.literal("")),
    special_features: z.string().optional().or(z.literal("")),
    price: z.coerce.number().positive().min(10000, "Price must be at least 10,000 MAD"),

    // Auction consent fields
    auction_consent: z.string().optional(), // "true" or "false"
    auction_starting_price: z.coerce.number().positive().optional(),
    auction_reserve_price: z.coerce.number().positive().optional(),
});
export type CreateDirectSaleInput = z.infer<typeof CreateDirectSaleSchema>;

// ============================================
// Admin Schemas
// ============================================

/**
 * Vehicle verification action schema.
 */
export const VehicleVerifySchema = z.object({
    vehicleId: z.coerce.number().int().positive(),
    action: z.enum(['approve', 'reject']),
    reason: z.string().optional(),
});
export type VehicleVerifyInput = z.infer<typeof VehicleVerifySchema>;

/**
 * Admin user search schema.
 */
export const AdminUserSearchSchema = z.object({
    query: z.string().optional(),
    role: z.enum(['user', 'admin', 'moderator']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminUserSearchInput = z.infer<typeof AdminUserSearchSchema>;

// ============================================
// Auction Schemas
// ============================================

/**
 * Auction creation schema.
 */
export const AuctionCreateSchema = z.object({
    vehicle_id: z.coerce.number().int().positive(),
    starting_price: z.coerce.number().positive("Starting price must be positive"),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime(),
    reserve_price: z.coerce.number().positive().optional(),
});
export type AuctionCreateInput = z.infer<typeof AuctionCreateSchema>;

/**
 * Bid placement schema.
 */
export const BidSchema = z.object({
    auction_id: z.coerce.number().int().positive(),
    amount: z.coerce.number().positive("Bid amount must be positive"),
});
export type BidInput = z.infer<typeof BidSchema>;

// ============================================
// ID Parameter Schema (reusable)
// ============================================

export const IdParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});
export type IdParam = z.infer<typeof IdParamSchema>;

/**
 * Support contact update schema.
 */
export const SupportContactUpdateSchema = z.object({
    processed: z.boolean(),
});
export type SupportContactUpdateInput = z.infer<typeof SupportContactUpdateSchema>;

/**
 * Karkey car update schema.
 */
export const KarkeyCarUpdateSchema = z.object({
    make: z.string().optional(),
    model: z.string().optional(),
    year: z.coerce.number().int().min(1900).optional(),
    mileage: z.coerce.number().int().nonnegative().optional(),
    transmission: z.string().optional(),
    fuel_type: z.string().optional(),
    engine_size: z.union([z.coerce.number().positive(), z.string(), z.null()]).optional(),
    doors: z.union([z.coerce.number().int().positive(), z.string(), z.null()]).optional(),
    vehicle_condition: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    price: z.coerce.number().positive().optional(),
    is_active: z.union([z.boolean(), z.string()]).transform((val) => val === true || val === 'true').optional(),
});
export type KarkeyCarUpdateInput = z.infer<typeof KarkeyCarUpdateSchema>;
