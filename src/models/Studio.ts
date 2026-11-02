import mongoose, { Document, Schema, Model, Types } from "mongoose";

export type StudioCategory =
  | "photography"
  | "film"
  | "recording"
  | "podcast"
  | "dance"
  | "art";

export interface ILocation {
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface IStudio extends Document {
  title: string;
  slug: string;
  description: string;
  category: StudioCategory;
  amenities: string[];
  pricePerHour: number;
  securityDeposit?: number;
  location: ILocation;
  images: string[];
  host: Types.ObjectId;
  rating: number;
  reviewCount: number;
  capacity: number;
  squareFeet: number;
  isAvailable: boolean;
  featured: boolean;
  defaultBookingDuration?: number;
  tags: string[];
  rules?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, default: "United States" },
    postalCode: { type: String, default: "" },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false }
);

const StudioSchema = new Schema<IStudio>(
  {
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
    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, "Security deposit cannot be negative"],
    },
    location: {
      type: LocationSchema,
      required: true,
    },
    images: {
      type: [String],
      required: [true, "At least one studio image is required"],
      validate: [(val: string[]) => val.length > 0, "At least one image must be provided"],
    },
    host: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

StudioSchema.index({ "location.city": 1, category: 1, pricePerHour: 1 });
StudioSchema.index({ title: "text", description: "text", tags: "text" });

export const Studio: Model<IStudio> =
  mongoose.models.Studio || mongoose.model<IStudio>("Studio", StudioSchema);
