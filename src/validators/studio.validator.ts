import { z } from "zod";

export const studioTitleValidation = z
  .string()
  .min(5, "Studio title must be at least 5 characters")
  .max(120, "Studio title cannot exceed 120 characters")
  .regex(
    /^[a-zA-Z0-9\s&',.\-]+$/,
    "Studio title may only contain letters, numbers, spaces, and standard punctuation (&, ', -, ,, .)"
  )
  .refine(
    (val) => {
      const words = val.trim().split(/\s+/).filter(Boolean);
      return words.length >= 2;
    },
    "Studio title must contain at least 2 words (e.g. 'Brooklyn Daylight Loft')"
  )
  .refine(
    (val) => {
      const words = val.trim().split(/\s+/).filter(Boolean);
      const hasVowelRegex = /[aeiouyAEIOUY]/;
      return words.every((w) => {
        const lettersOnly = w.replace(/[^a-zA-Z]/g, "");
        return !lettersOnly || hasVowelRegex.test(lettersOnly) || /^[0-9]+$/.test(w);
      });
    },
    "Studio title cannot consist of meaningless keyboard mash or random consonant sequences"
  )
  .refine(
    (val) => !/(.)\1{3,}/.test(val),
    "Studio title cannot contain repeated character sequences"
  );

export const hourlyRateValidation = z
  .number({ invalid_type_error: "Price per hour must be a number" })
  .min(20, "Hourly rate must be at least $20/hr")
  .max(5000, "Hourly rate cannot exceed $5,000/hr");

export const createStudioSchema = z.object({
  title: studioTitleValidation,
  description: z.string().min(20, "Description must be at least 20 characters").max(3000),
  category: z.enum(["photography", "film", "recording", "podcast", "dance", "art"]),
  amenities: z.array(z.string()).default([]),
  pricePerHour: hourlyRateValidation,
  location: z.object({
    address: z.string().min(3, "Address is required"),
    city: z.string().min(2, "City is required"),
    country: z.string().default("United States"),
    postalCode: z.string().optional(),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
  }),
  images: z.array(z.string().url("Each image must be a valid URL")).min(1, "At least one image is required"),
  capacity: z.number().min(1).default(10),
  squareFeet: z.number().min(50).default(800),
  tags: z.array(z.string()).default([]),
  rules: z.array(z.string()).optional(),
  featured: z.boolean().default(false).optional(),
});

export const updateStudioSchema = createStudioSchema.partial();
