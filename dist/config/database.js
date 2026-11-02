"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResolvedMongoUri = getResolvedMongoUri;
exports.getDatabaseStatus = getDatabaseStatus;
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const mongoUri_1 = require("../utils/mongoUri");
const state = {
    isConnected: false,
    lastError: null,
    targetUri: "",
};
function getResolvedMongoUri() {
    const rawUri = process.env.MONGODB_URI ||
        process.env.MONGO_URI ||
        process.env.MONGODB_URL ||
        process.env.MONGO_URL ||
        process.env.DATABASE_URL ||
        process.env.DB_URI ||
        process.env.MONGODB_CONNECTION_STRING ||
        env_1.ENV.MONGODB_URI;
    return (0, mongoUri_1.sanitizeMongoUri)(rawUri);
}
function getDatabaseStatus() {
    const uri = getResolvedMongoUri();
    return {
        isConnected: mongoose_1.default.connection.readyState === 1,
        readyState: mongoose_1.default.connection.readyState,
        status: mongoose_1.default.connection.readyState === 1 ? "connected" : mongoose_1.default.connection.readyState === 2 ? "connecting" : "disconnected",
        databaseName: mongoose_1.default.connection.db?.databaseName || "studiospace",
        target: (0, mongoUri_1.maskMongoUri)(uri),
        hasEnvVar: Boolean(process.env.MONGODB_URI ||
            process.env.MONGO_URI ||
            process.env.MONGODB_URL ||
            process.env.MONGO_URL ||
            process.env.DATABASE_URL),
        lastError: state.lastError,
    };
}
let lastConnectionAttempt = 0;
const RECONNECT_COOLDOWN_MS = 20000; // 20 seconds cooldown if connection failed
async function connectDB(force = false) {
    if (state.isConnected && mongoose_1.default.connection.readyState === 1) {
        return mongoose_1.default;
    }
    const now = Date.now();
    if (!force && now - lastConnectionAttempt < RECONNECT_COOLDOWN_MS && state.lastError) {
        return null;
    }
    lastConnectionAttempt = now;
    const sanitizedUri = getResolvedMongoUri();
    state.targetUri = sanitizedUri;
    if (!sanitizedUri) {
        state.isConnected = false;
        state.lastError = "MONGODB_URI is not configured";
        if (env_1.ENV.NODE_ENV === "production") {
            console.error("[MongoDB Atlas] CRITICAL: No MONGODB_URI provided in production. Localhost fallback disabled.");
        }
        return null;
    }
    try {
        mongoose_1.default.set("strictQuery", false);
        console.log(`[MongoDB Atlas] Attempting connection to: ${(0, mongoUri_1.maskMongoUri)(sanitizedUri)}`);
        const conn = await mongoose_1.default.connect(sanitizedUri, {
            dbName: "studiospace",
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            autoIndex: true,
        });
        state.isConnected = true;
        state.lastError = null;
        console.log(`[MongoDB Atlas] Connected successfully to database: ${conn.connection.db?.databaseName || "studiospace"}`);
        mongoose_1.default.connection.on("error", (err) => {
            console.error("[MongoDB Atlas] Runtime error:", err.message);
            state.lastError = err.message;
        });
        mongoose_1.default.connection.on("disconnected", () => {
            console.warn("[MongoDB Atlas] Disconnected from database");
            state.isConnected = false;
        });
        return conn;
    }
    catch (error) {
        state.isConnected = false;
        state.lastError = error.message ? (0, mongoUri_1.maskMongoUri)(error.message) : "Unknown error";
        // Never expose connection credentials in logs
        console.error("[MongoDB Atlas] Connection failed:", error.name || "Error", state.lastError);
        return null;
    }
}
async function disconnectDB() {
    if (state.isConnected || mongoose_1.default.connection.readyState !== 0) {
        await mongoose_1.default.disconnect();
        state.isConnected = false;
        console.log("[MongoDB Atlas] Connection closed gracefully");
    }
}
