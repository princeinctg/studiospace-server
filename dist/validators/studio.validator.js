"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudioSchema = exports.createStudioSchema = exports.hourlyRateValidation = exports.studioTitleValidation = void 0;
const zod_1 = require("zod");
exports.studioTitleValidation = zod_1.z
    .string()
    .min(5, "Studio title must be at least 5 characters")
    .max(120, "Studio title cannot exceed 120 characters")
    .regex(/^[a-zA-Z0-9\s&',.\-]+$/, "Studio title may only contain letters, numbers, spaces, and standard punctuation (&, ', -, ,, .)")
    .refine((val) => {
    const words = val.trim().split(/\s+/).filter(Boolean);
    return words.length >= 2;
}, "Studio title must contain at least 2 words (e.g. 'Brooklyn Daylight Loft')")
    .refine((val) => {
    const words = val.trim().split(/\s+/).filter(Boolean);
    const hasVowelRegex = /[aeiouyAEIOUY]/;
    return words.every((w) => hasVowelRegex.test(w) || /^[0-9]+$/.test(w));
}, "Studio title cannot consist of meaningless keyboard mash or random consonant sequences")
    .refine((val) => !/(.)\1{3,}/.test(val), "Studio title cannot contain repeated character sequences");
exports.hourlyRateValidation = zod_1.z
    .number({ invalid_type_error: "Price per hour must be a number" })
    .min(20, "Hourly rate must be at least $20/hr")
    .max(5000, "Hourly rate cannot exceed $5,000/hr");
exports.createStudioSchema = zod_1.z.object({
    title: exports.studioTitleValidation,
    description: zod_1.z.string().min(20, "Description must be at least 20 characters").max(3000),
    category: zod_1.z.enum(["photography", "film", "recording", "podcast", "dance", "art"]),
    amenities: zod_1.z.array(zod_1.z.string()).default([]),
    pricePerHour: exports.hourlyRateValidation,
    location: zod_1.z.object({
        address: zod_1.z.string().min(3, "Address is required"),
        city: zod_1.z.string().min(2, "City is required"),
        country: zod_1.z.string().default("United States"),
        postalCode: zod_1.z.string().optional(),
        coordinates: zod_1.z
            .object({
            lat: zod_1.z.number(),
            lng: zod_1.z.number(),
        })
            .optional(),
    }),
    images: zod_1.z.array(zod_1.z.string().url("Each image must be a valid URL")).min(1, "At least one image is required"),
    capacity: zod_1.z.number().min(1).default(10),
    squareFeet: zod_1.z.number().min(50).default(800),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    rules: zod_1.z.array(zod_1.z.string()).optional(),
    featured: zod_1.z.boolean().default(false).optional(),
});
exports.updateStudioSchema = exports.createStudioSchema.partial();
