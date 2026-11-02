"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const mongoUri_1 = require("../utils/mongoUri");
const state = {
    isConnected: false,
};
async function connectDB() {
    if (state.isConnected && mongoose_1.default.connection.readyState === 1) {
        return mongoose_1.default;
    }
    const rawUri = process.env.MONGODB_URI ||
        process.env.MONGO_URI ||
        process.env.MONGODB_URL ||
        env_1.ENV.MONGODB_URI;
    const sanitizedUri = (0, mongoUri_1.sanitizeMongoUri)(rawUri);
    try {
        mongoose_1.default.set("strictQuery", false);
        console.log(`[MongoDB Atlas] Attempting connection to: ${(0, mongoUri_1.maskMongoUri)(sanitizedUri)}`);
        const conn = await mongoose_1.default.connect(sanitizedUri, {
            dbName: "studiospace",
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            autoIndex: true,
        });
        state.isConnected = true;
        console.log(`[MongoDB Atlas] Connected successfully to database: ${conn.connection.db?.databaseName || "studiospace"}`);
        mongoose_1.default.connection.on("error", (err) => {
            console.error("[MongoDB Atlas] Runtime error:", err.message);
        });
        mongoose_1.default.connection.on("disconnected", () => {
            console.warn("[MongoDB Atlas] Disconnected from database");
            state.isConnected = false;
        });
        return conn;
    }
    catch (error) {
        // Never expose connection credentials in logs
        console.error("[MongoDB Atlas] Connection failed:", error.name || "Error", error.message ? (0, mongoUri_1.maskMongoUri)(error.message) : "");
        state.isConnected = false;
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
