import { z } from "zod";

export const createStudioSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().min(20, "Description must be at least 20 characters").max(3000),
  category: z.enum(["photography", "film", "recording", "podcast", "dance", "art"]),
  amenities: z.array(z.string()).default([]),
  pricePerHour: z.number().min(1, "Price per hour must be at least 1"),
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
