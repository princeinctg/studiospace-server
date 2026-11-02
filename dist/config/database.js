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
    try {
        const conn = await mongoose_1.default.connect(env_1.ENV.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            autoIndex: true,
        });
        state.isConnected = true;
        console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
        mongoose_1.default.connection.on("error", (err) => {
            console.error("[MongoDB] Runtime error:", err);
        });
        mongoose_1.default.connection.on("disconnected", () => {
            console.warn("[MongoDB] Disconnected from database");
            state.isConnected = false;
        });
        return conn;
    }
    catch (error) {
        console.error("[MongoDB] Initial connection error:", error);
        // Don't crash process in dev/test; allow server to run and retry
        return null;
    }
}
async function disconnectDB() {
    if (state.isConnected) {
        await mongoose_1.default.disconnect();
        state.isConnected = false;
        console.log("[MongoDB] Connection closed gracefully");
    }
}
