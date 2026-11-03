"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudioSchema = exports.createStudioSchema = exports.hourlyRateValidation = exports.studioTitleValidation = void 0;
const zod_1 = require("zod");
/**
 * Studio Title Validation:
 * Accept ANY studio title entered by the user (short, long, brand, numbers, symbols, random text).
 * Only reject empty or whitespace-only titles.
 */
exports.studioTitleValidation = zod_1.z
    .string({ required_error: "Studio title is required" })
    .refine((val) => typeof val === "string" && val.trim().length > 0, "Studio title cannot be empty or whitespace only");
exports.hourlyRateValidation = zod_1.z
    .number({ invalid_type_error: "Price per hour must be a number" })
    .min(1, "Hourly rate must be at least $1/hr")
    .max(10000, "Hourly rate cannot exceed $10,000/hr");
exports.createStudioSchema = zod_1.z.object({
    title: exports.studioTitleValidation,
    slug: zod_1.z.string().optional(),
    description: zod_1.z
        .string()
        .optional()
        .transform((val) => val && val.trim().length > 0
        ? val.trim()
        : "Modern creative studio equipped for photo, film, audio, and visual productions."),
    category: zod_1.z
        .enum(["photography", "film", "recording", "podcast", "dance", "art"])
        .default("photography"),
    amenities: zod_1.z.array(zod_1.z.string()).default(["High-Speed Fiber WiFi", "Natural Daylight"]),
    pricePerHour: exports.hourlyRateValidation.default(100),
    price: exports.hourlyRateValidation.optional(),
    securityDeposit: zod_1.z.number().min(0).default(0).optional(),
    defaultBookingDuration: zod_1.z.number().min(1).default(8).optional(),
    defaultBookingHours: zod_1.z.number().min(1).optional(),
    hostName: zod_1.z.string().optional(),
    hostEmail: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().optional(),
    location: zod_1.z
        .union([
        zod_1.z.string().transform((str) => ({
            address: str.split(",")[0]?.trim() || str,
            city: str.split(",")[0]?.trim() || "New York",
            country: str.split(",")[1]?.trim() || "United States",
            postalCode: "10001",
        })),
        zod_1.z.object({
            address: zod_1.z.string().optional().default("100 Studio Way"),
            city: zod_1.z.string().optional().default("New York"),
            country: zod_1.z.string().optional().default("United States"),
            postalCode: zod_1.z.string().optional(),
            coordinates: zod_1.z
                .object({
                lat: zod_1.z.number(),
                lng: zod_1.z.number(),
            })
                .optional(),
        }),
    ])
        .default({
        address: "100 Studio Way",
        city: "New York",
        country: "United States",
    }),
    images: zod_1.z.array(zod_1.z.string()).default([]).optional(),
    image: zod_1.z.string().optional(),
    capacity: zod_1.z.number().min(1).default(10),
    squareFeet: zod_1.z.number().min(1).default(800),
    area: zod_1.z.number().optional(),
    rating: zod_1.z.number().min(1).max(5).optional(),
    reviewCount: zod_1.z.number().min(0).optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    rules: zod_1.z.array(zod_1.z.string()).optional(),
    featured: zod_1.z.boolean().default(false).optional(),
});
exports.updateStudioSchema = exports.createStudioSchema.partial();
