"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
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
    try {
        mongoose_1.default.set("strictQuery", false);
        const conn = await mongoose_1.default.connect(rawUri, {
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
        console.error("[MongoDB Atlas] Connection failed:", error.name || "Error", error.message ? error.message.replace(/mongodb\+srv:\/\/[^@]+@/, "mongodb+srv://***:***@") : "");
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
