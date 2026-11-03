"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookingSchema = exports.updateBookingStatusSchema = exports.createBookingSchema = void 0;
const zod_1 = require("zod");
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
exports.createBookingSchema = zod_1.z
    .object({
    studioId: zod_1.z.string().min(1, "Studio ID is required"),
    date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
    startTime: zod_1.z.string().regex(timeRegex, "Invalid start time format (HH:mm)"),
    endTime: zod_1.z.string().regex(timeRegex, "Invalid end time format (HH:mm)"),
    guestCount: zod_1.z.number().int().min(1, "At least 1 guest required").default(1),
    notes: zod_1.z.string().max(1000).optional(),
})
    .refine((data) => {
    const [startH, startM] = data.startTime.split(":").map(Number);
    const [endH, endM] = data.endTime.split(":").map(Number);
    return endH * 60 + endM > startH * 60 + startM;
}, {
    message: "End time must be later than start time",
    path: ["endTime"],
});
exports.updateBookingStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["pending", "confirmed", "cancelled", "completed"]),
    cancellationReason: zod_1.z.string().optional(),
});
exports.updateBookingSchema = zod_1.z
    .object({
    date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format").optional(),
    startTime: zod_1.z.string().regex(timeRegex, "Invalid start time format (HH:mm)").optional(),
    endTime: zod_1.z.string().regex(timeRegex, "Invalid end time format (HH:mm)").optional(),
    guestCount: zod_1.z.number().int().min(1, "At least 1 guest required").optional(),
    notes: zod_1.z.string().max(1000).optional(),
    status: zod_1.z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
    paymentStatus: zod_1.z.enum(["unpaid", "paid", "refunded"]).optional(),
})
    .refine((data) => {
    if (data.startTime && data.endTime) {
        const [startH, startM] = data.startTime.split(":").map(Number);
        const [endH, endM] = data.endTime.split(":").map(Number);
        return endH * 60 + endM > startH * 60 + startM;
    }
    return true;
}, {
    message: "End time must be later than start time",
    path: ["endTime"],
});
