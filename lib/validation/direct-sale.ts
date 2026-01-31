import { z } from "zod"

// Helper regex
const NON_EMPTY_STRING = z.string().trim().min(1, "Required")

const BaseCarDetailsSchema = z.object({
    make: NON_EMPTY_STRING,
    model: NON_EMPTY_STRING,
    year: NON_EMPTY_STRING,
    mileage: z.coerce.number().min(0, "Invalid mileage"),
    condition: NON_EMPTY_STRING,
    fuel_type: NON_EMPTY_STRING,
    transmission: NON_EMPTY_STRING,
    engine_size: z.coerce.number().min(0.1, "Invalid engine size").optional().nullable(),
    doors: NON_EMPTY_STRING,
    location: NON_EMPTY_STRING,
    // Colors
    exterior_color: NON_EMPTY_STRING,
    interior_color: NON_EMPTY_STRING,
    is_original_paint: z.boolean().default(true),
    // Description
    description: z.string().trim().min(20, "Description must be at least 20 characters long"),
    special_features: z.string().optional(),
})

export const CarDetailsSchema = BaseCarDetailsSchema.refine(data => {
    if (data.fuel_type !== "Electric" && !data.engine_size) {
        return false
    }
    return true
}, {
    message: "Engine size is required for non-electric vehicles",
    path: ["engine_size"]
})

export const PhotoItemSchema = z.object({
    id: z.string(),
    url: z.string().optional(),
    status: z.enum(['pending', 'uploading', 'completed', 'error']),
})

export const PhotosSchema = z.object({
    photos: z.array(PhotoItemSchema)
        .min(5, "At least 5 photos are required")
        .max(10, "Maximum 10 photos allowed")
        .refine(
            (photos) => !photos.some(p => p.status === 'uploading' || p.status === 'error'),
            "All photos must be uploaded successfully"
        )
})

export const DocumentsSchema = z.object({
    carte_grise_url: z.string().min(1, "Registration document (Carte Grise) is required"),
    service_doc_urls: z.array(z.string()).optional(),
})

const BasePricingSchema = z.object({
    price: z.coerce.number().min(10000, "Price must be at least 10,000 MAD"),
    auction_consent: z.boolean().optional(),
    auction_starting_price: z.coerce.number().optional(),
    auction_reserve_price: z.coerce.number().optional(),
})

export const PricingSchema = BasePricingSchema.superRefine((data, ctx) => {
    if (data.auction_consent) {
        const start = data.auction_starting_price || 0
        const reserve = data.auction_reserve_price || 0

        if (start < 5000) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Starting price must be at least 5,000 MAD",
                path: ["auction_starting_price"]
            })
        }

        if (reserve <= start) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Reserve price must be higher than starting price",
                path: ["auction_reserve_price"]
            })
        }
    }
})

// Combined Schema for final submission
export const DirectSaleSubmissionSchema = BaseCarDetailsSchema
    .merge(DocumentsSchema)
    .merge(BasePricingSchema)
    .extend({
        photos: z.array(z.object({
            url: z.string(),
            blurhash: z.string().optional()
        })).min(5)
    })
