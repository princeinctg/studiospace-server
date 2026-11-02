"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBooking = createBooking;
exports.getMyBookings = getMyBookings;
exports.getHostBookings = getHostBookings;
exports.updateBookingStatus = updateBookingStatus;
const mongoose_1 = __importDefault(require("mongoose"));
const Booking_1 = require("../models/Booking");
const Studio_1 = require("../models/Studio");
const booking_validator_1 = require("../validators/booking.validator");
const dataStore_1 = require("../store/dataStore");
function toMinutes(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}
async function createBooking(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const parsed = booking_validator_1.createBookingSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: "Validation failed",
                details: parsed.error.issues.map((i) => i.message),
            });
            return;
        }
        const { studioId, date, startTime, endTime, guestCount, notes } = parsed.data;
        // Dual-Engine: If MongoDB connected, use Mongoose
        if (mongoose_1.default.connection.readyState === 1) {
            const studio = await Studio_1.Studio.findById(studioId);
            if (!studio) {
                res.status(404).json({ error: "Studio not found" });
                return;
            }
            if (!studio.isAvailable) {
                res.status(400).json({ error: "Studio is currently unavailable for bookings" });
                return;
            }
            const bookingDate = new Date(date);
            bookingDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(bookingDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const startMins = toMinutes(startTime);
            const endMins = toMinutes(endTime);
            const durationHours = (endMins - startMins) / 60;
            if (durationHours <= 0 || durationHours > 24) {
                res.status(400).json({ error: "Booking duration must be between 1 and 24 hours" });
                return;
            }
            if (studio.pricePerHour < 20 || studio.pricePerHour > 5000) {
                res.status(400).json({ error: "Studio hourly rate is out of valid bounds ($20 - $5,000/hr)" });
                return;
            }
            const totalPrice = Math.round(durationHours * studio.pricePerHour);
            // Conflict Check in MongoDB
            const existingBookings = await Booking_1.Booking.find({
                studio: studio._id,
                date: { $gte: bookingDate, $lt: nextDay },
                status: { $in: ["pending", "confirmed"] },
            });
            const hasConflict = existingBookings.some((existing) => {
                const exStart = toMinutes(existing.startTime);
                const exEnd = toMinutes(existing.endTime);
                return startMins < exEnd && endMins > exStart;
            });
            if (hasConflict) {
                res.status(409).json({
                    error: "Double-booking conflict: The selected studio time slot is already reserved.",
                    conflict: {
                        studioId,
                        date: bookingDate.toISOString().split("T")[0],
                        requestedSlot: `${startTime} - ${endTime}`,
                    },
                });
                return;
            }
            const booking = await Booking_1.Booking.create({
                guest: req.user.userId,
                studio: studio._id,
                date: bookingDate,
                startTime,
                endTime,
                durationHours,
                totalPrice,
                guestCount,
                notes: notes || "",
                status: "pending",
                paymentStatus: "unpaid",
            });
            const populatedBooking = await Booking_1.Booking.findById(booking._id)
                .populate("studio", "title images location pricePerHour")
                .populate("guest", "name email");
            res.status(201).json({
                message: "Studio booking request submitted successfully!",
                booking: populatedBooking,
            });
            return;
        }
        // Local DataStore Engine
        const studio = dataStore_1.store.getStudioById(studioId);
        if (!studio) {
            res.status(404).json({ error: "Studio not found" });
            return;
        }
        // MANDATORY DOUBLE-BOOKING CONFLICT CHECK
        const hasConflict = dataStore_1.store.checkConflict(studioId, date, startTime, endTime);
        if (hasConflict) {
            res.status(409).json({
                error: "Double-booking conflict: The selected studio time slot is already reserved.",
                conflict: {
                    studioId,
                    date,
                    requestedSlot: `${startTime} - ${endTime}`,
                },
            });
            return;
        }
        const startMins = toMinutes(startTime);
        const endMins = toMinutes(endTime);
        const durationHours = (endMins - startMins) / 60;
        if (durationHours <= 0 || durationHours > 24) {
            res.status(400).json({ error: "Booking duration must be between 1 and 24 hours" });
            return;
        }
        if (studio.pricePerHour < 20 || studio.pricePerHour > 5000) {
            res.status(400).json({ error: "Studio hourly rate is out of valid bounds ($20 - $5,000/hr)" });
            return;
        }
        const totalPrice = Math.round(durationHours * studio.pricePerHour);
        const booking = dataStore_1.store.createBooking({
            guest: req.user.userId,
            studio,
            date,
            startTime,
            endTime,
            durationHours,
            totalPrice,
            guestCount,
            notes: notes || "",
            status: "pending",
            paymentStatus: "unpaid",
        });
        res.status(201).json({
            message: "Studio booking request submitted successfully!",
            booking,
        });
    }
    catch (error) {
        console.error("Create Booking Error:", error);
        res.status(500).json({ error: "Failed to process booking" });
    }
}
async function getMyBookings(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (mongoose_1.default.connection.readyState === 1) {
            const bookings = await Booking_1.Booking.find({ guest: req.user.userId })
                .populate("studio", "title slug images location pricePerHour")
                .sort({ date: -1, startTime: -1 });
            res.status(200).json({ bookings });
            return;
        }
        const bookings = dataStore_1.store.getBookingsByGuest(req.user.userId);
        res.status(200).json({ bookings });
    }
    catch (error) {
        console.error("Get My Bookings Error:", error);
        res.status(500).json({ error: "Failed to fetch user bookings" });
    }
}
async function getHostBookings(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (mongoose_1.default.connection.readyState === 1) {
            const myStudios = await Studio_1.Studio.find({ host: req.user.userId }).select("_id");
            const studioIds = myStudios.map((s) => s._id);
            const bookings = await Booking_1.Booking.find({ studio: { $in: studioIds } })
                .populate("studio", "title slug images location pricePerHour")
                .populate("guest", "name email avatar phone")
                .sort({ date: -1 });
            res.status(200).json({ bookings });
            return;
        }
        const bookings = dataStore_1.store.getBookingsByHost(req.user.userId);
        res.status(200).json({ bookings });
    }
    catch (error) {
        console.error("Get Host Bookings Error:", error);
        res.status(500).json({ error: "Failed to fetch host incoming bookings" });
    }
}
async function updateBookingStatus(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const id = String(req.params.id);
        if (!req.body.status) {
            req.body.status = "cancelled";
        }
        const parsed = booking_validator_1.updateBookingStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: "Validation error",
                details: parsed.error.issues.map((i) => i.message),
            });
            return;
        }
        const { status, cancellationReason } = parsed.data;
        if (mongoose_1.default.connection.readyState === 1) {
            const booking = await Booking_1.Booking.findById(id).populate("studio");
            if (!booking) {
                res.status(404).json({ error: "Booking not found" });
                return;
            }
            const studio = booking.studio;
            const isGuest = booking.guest.toString() === req.user.userId;
            const isHost = studio && studio.host && studio.host.toString() === req.user.userId;
            const isAdmin = req.user.role === "admin";
            if (!isGuest && !isHost && !isAdmin) {
                res.status(403).json({ error: "Forbidden: Not authorized to update this booking." });
                return;
            }
            if (isGuest && !isHost && !isAdmin && status !== "cancelled") {
                res.status(403).json({ error: "Guests are only permitted to cancel bookings." });
                return;
            }
            booking.status = status;
            if (cancellationReason) {
                booking.cancellationReason = cancellationReason;
            }
            await booking.save();
            res.status(200).json({
                message: `Booking status updated to ${status}`,
                booking,
            });
            return;
        }
        const existingBooking = dataStore_1.store.getBookingById(id);
        if (!existingBooking) {
            res.status(404).json({ error: "Booking not found" });
            return;
        }
        const isGuest = (existingBooking.guest?.id || existingBooking.guest?._id || existingBooking.guest) === req.user.userId;
        const studioHost = existingBooking.studio?.host?.id ||
            existingBooking.studio?.host?._id ||
            existingBooking.studio?.host;
        const isHost = studioHost === req.user.userId;
        const isAdmin = req.user.role === "admin";
        if (!isGuest && !isHost && !isAdmin) {
            res.status(403).json({ error: "Forbidden: Not authorized to update this booking." });
            return;
        }
        if (isGuest && !isHost && !isAdmin && status !== "cancelled") {
            res.status(403).json({ error: "Guests are only permitted to cancel bookings." });
            return;
        }
        const updated = dataStore_1.store.updateBookingStatus(id, status, cancellationReason);
        if (!updated) {
            res.status(404).json({ error: "Booking not found" });
            return;
        }
        res.status(200).json({
            message: `Booking status updated to ${status}`,
            booking: updated,
        });
    }
    catch (error) {
        console.error("Update Booking Status Error:", error);
        res.status(500).json({ error: "Failed to update booking status" });
    }
}
