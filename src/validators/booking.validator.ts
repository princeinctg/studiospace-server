import { z } from "zod";

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const createBookingSchema = z
  .object({
    studioId: z.string().min(1, "Studio ID is required"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
    startTime: z.string().regex(timeRegex, "Invalid start time format (HH:mm)"),
    endTime: z.string().regex(timeRegex, "Invalid end time format (HH:mm)"),
    guestCount: z.number().int().min(1, "At least 1 guest required").default(1),
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      const [startH, startM] = data.startTime.split(":").map(Number);
      const [endH, endM] = data.endTime.split(":").map(Number);
      return endH * 60 + endM > startH * 60 + startM;
    },
    {
      message: "End time must be later than start time",
      path: ["endTime"],
    }
  );

const bookingStatusEnum = z.enum([
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
]);

const paymentStatusEnum = z.enum([
  "UNPAID",
  "PAID",
  "VOIDED",
  "unpaid",
  "paid",
  "voided",
  "refunded",
  "REFUNDED",
]);

export const updateBookingStatusSchema = z.object({
  status: bookingStatusEnum.optional(),
  paymentStatus: paymentStatusEnum.optional(),
  cancellationReason: z.string().optional(),
});

export const updateBookingSchema = z
  .object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format").optional(),
    startTime: z.string().regex(timeRegex, "Invalid start time format (HH:mm)").optional(),
    endTime: z.string().regex(timeRegex, "Invalid end time format (HH:mm)").optional(),
    guestCount: z.number().int().min(1, "At least 1 guest required").optional(),
    notes: z.string().max(1000).optional(),
    status: bookingStatusEnum.optional(),
    paymentStatus: paymentStatusEnum.optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        const [startH, startM] = data.startTime.split(":").map(Number);
        const [endH, endM] = data.endTime.split(":").map(Number);
        return endH * 60 + endM > startH * 60 + startM;
      }
      return true;
    },
    {
      message: "End time must be later than start time",
      path: ["endTime"],
    }
  );
