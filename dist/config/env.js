"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const mongoUri_1 = require("../utils/mongoUri");
dotenv_1.default.config();
exports.ENV = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || "development",
    MONGODB_URI: (0, mongoUri_1.sanitizeMongoUri)(process.env.MONGODB_URI ||
        process.env.MONGO_URI ||
        process.env.MONGODB_URL ||
        "mongodb://localhost:27017/studiospace"),
    JWT_SECRET: process.env.JWT_SECRET || "studiospace_default_jwt_secret_change_in_production",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
    CLIENT_URL: process.env.CLIENT_URL || "https://studiospace-client-nine.vercel.app",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ||
        "199695232756-9b1its7cgdvpc03e1uo875fcc1ccvu8d.apps.googleusercontent.com",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL ||
        "https://studiospace-server.onrender.com/api/auth/google/callback",
};
