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
exports.Studio = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const LocationSchema = new mongoose_1.Schema({
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, default: "United States" },
    postalCode: { type: String, default: "" },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number },
    },
}, { _id: false });
const StudioSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, "Studio title is required"],
        trim: true,
        maxlength: [120, "Title cannot exceed 120 characters"],
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        maxlength: [3000, "Description cannot exceed 3000 characters"],
    },
    category: {
        type: String,
        required: [true, "Category is required"],
        enum: ["photography", "film", "recording", "podcast", "dance", "art"],
        index: true,
    },
    amenities: {
        type: [String],
        default: [],
    },
    pricePerHour: {
        type: Number,
        required: [true, "Hourly rate is required"],
        min: [1, "Price must be at least 1"],
    },
    location: {
        type: LocationSchema,
        required: true,
    },
    images: {
        type: [String],
        required: [true, "At least one studio image is required"],
        validate: [(val) => val.length > 0, "At least one image must be provided"],
    },
    host: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    rating: {
        type: Number,
        default: 5.0,
        min: 1,
        max: 5,
    },
    reviewCount: {
        type: Number,
        default: 0,
    },
    capacity: {
        type: Number,
        default: 10,
        min: 1,
    },
    squareFeet: {
        type: Number,
        default: 800,
    },
    isAvailable: {
        type: Boolean,
        default: true,
        index: true,
    },
    featured: {
        type: Boolean,
        default: false,
        index: true,
    },
    defaultBookingDuration: {
        type: Number,
        default: 8,
    },
    tags: {
        type: [String],
        default: [],
    },
    rules: {
        type: [String],
        default: [
            "No smoking inside the studio",
            "Overtime billed at 1.5x regular hourly rate",
            "Clean up and return gear to original positions",
        ],
    },
}, {
    timestamps: true,
});
StudioSchema.index({ "location.city": 1, category: 1, pricePerHour: 1 });
StudioSchema.index({ title: "text", description: "text", tags: "text" });
exports.Studio = mongoose_1.default.models.Studio || mongoose_1.default.model("Studio", StudioSchema);
