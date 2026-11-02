import { z } from "zod";

/**
 * Studio Title Validation:
 * Accept ANY studio title entered by the user (short, long, brand, numbers, symbols, random text).
 * Only reject empty or whitespace-only titles.
 */
export const studioTitleValidation = z
  .string({ required_error: "Studio title is required" })
  .refine(
    (val) => typeof val === "string" && val.trim().length > 0,
    "Studio title cannot be empty or whitespace only"
  );

export const hourlyRateValidation = z
  .number({ invalid_type_error: "Price per hour must be a number" })
  .min(1, "Hourly rate must be at least $1/hr")
  .max(10000, "Hourly rate cannot exceed $10,000/hr");

export const createStudioSchema = z.object({
  title: studioTitleValidation,
  description: z
    .string()
    .optional()
    .transform((val) =>
      val && val.trim().length > 0
        ? val.trim()
        : "Modern creative studio equipped for photo, film, audio, and visual productions."
    ),
  category: z
    .enum(["photography", "film", "recording", "podcast", "dance", "art"])
    .default("photography"),
  amenities: z.array(z.string()).default(["High-Speed Fiber WiFi", "Natural Daylight"]),
  pricePerHour: hourlyRateValidation.default(100),
  securityDeposit: z.number().min(0).default(0).optional(),
  defaultBookingDuration: z.number().min(1).default(8).optional(),
  hostName: z.string().optional(),
  hostEmail: z.string().optional(),
  imageUrl: z.string().optional(),
  location: z
    .object({
      address: z.string().optional().default("100 Studio Way"),
      city: z.string().optional().default("New York"),
      country: z.string().optional().default("United States"),
      postalCode: z.string().optional(),
      coordinates: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .optional(),
    })
    .default({
      address: "100 Studio Way",
      city: "New York",
      country: "United States",
    }),
  images: z.array(z.string()).default([]).optional(),
  capacity: z.number().min(1).default(10),
  squareFeet: z.number().min(1).default(800),
  tags: z.array(z.string()).default([]),
  rules: z.array(z.string()).optional(),
  featured: z.boolean().default(false).optional(),
});

export const updateStudioSchema = createStudioSchema.partial();
