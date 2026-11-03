import mongoose, { Document, Schema, Model, Types } from "mongoose";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export type PaymentStatus =
  | "UNPAID"
  | "PAID"
  | "VOIDED"
  | "unpaid"
  | "paid"
  | "voided"
  | "refunded"
  | "REFUNDED";

export interface IBooking extends Document {
  guest: Types.ObjectId;
  studio: Types.ObjectId;
  date: Date;
  startTime: string; // "10:00"
  endTime: string;   // "14:00"
  durationHours: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  guestCount: number;
  notes?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    guest: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studio: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

// Compound index for fast conflict detection queries
BookingSchema.index({ studio: 1, date: 1, status: 1 });

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);
