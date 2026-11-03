"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const BookingSchema = new mongoose_1.Schema({
    guest: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    studio: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Studio",
        required: true,
        index: true,
    },
    date: {
        type: Date,
        required: [true, "Booking date is required"],
        index: true,
    },
    startTime: {
        type: String,
        required: [true, "Start time is required (e.g., 09:00)"],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid 24h start time format"],
    },
    endTime: {
        type: String,
        required: [true, "End time is required (e.g., 13:00)"],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid 24h end time format"],
    },
    durationHours: {
        type: Number,
        required: true,
        min: [1, "Duration must be at least 1 hour"],
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: [
            "pending",
            "confirmed",
            "cancelled",
            "completed",
            "PENDING",
            "CONFIRMED",
            "CANCELLED",
            "COMPLETED",
        ],
        default: "pending",
        index: true,
    },
    paymentStatus: {
        type: String,
        enum: [
            "UNPAID",
            "PAID",
            "VOIDED",
            "unpaid",
            "paid",
            "voided",
            "refunded",
            "REFUNDED",
        ],
        default: "UNPAID",
        index: true,
    },
    guestCount: {
        type: Number,
        default: 1,
        min: 1,
    },
    notes: {
        type: String,
        default: "",
        maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    cancellationReason: {
        type: String,
        default: "",
    },
}, {
    timestamps: true,
});
// Compound index for fast conflict detection queries
BookingSchema.index({ studio: 1, date: 1, status: 1 });
exports.Booking = mongoose_1.default.models.Booking || mongoose_1.default.model("Booking", BookingSchema);
