import dotenv from "dotenv";
import { sanitizeMongoUri } from "../utils/mongoUri";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: sanitizeMongoUri(
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URL ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL ||
    process.env.DB_URI ||
    process.env.MONGODB_CONNECTION_STRING ||
    (isProduction ? "" : "mongodb://localhost:27017/studiospace")
  ),
  JWT_SECRET: process.env.JWT_SECRET || "studiospace_default_jwt_secret_change_in_production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  CLIENT_URL: process.env.CLIENT_URL || "https://studiospace-luxury.netlify.app",
  GOOGLE_CLIENT_ID:
    process.env.GOOGLE_CLIENT_ID ||
    "199695232756-9b1its7cgdvpc03e1uo875fcc1ccvu8d.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_CALLBACK_URL:
    process.env.GOOGLE_CALLBACK_URL ||
    "https://studiospace-server-f9ek.onrender.com/api/auth/google/callback",
};
