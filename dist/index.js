"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const studio_routes_1 = __importDefault(require("./routes/studio.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const bookmark_routes_1 = __importDefault(require("./routes/bookmark.routes"));
const app = (0, express_1.default)();
// Security and utility middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            env_1.ENV.CLIENT_URL,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://studiospace-luxury.netlify.app",
            "https://studiospace-client-nine.vercel.app",
        ];
        if (allowedOrigins.includes(origin) ||
            origin.endsWith(".netlify.app") ||
            origin.endsWith(".vercel.app")) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
if (env_1.ENV.NODE_ENV !== "test") {
    app.use((0, morgan_1.default)("dev"));
}
// Ensure DB connection for cold starts & auto-reconnect
app.use(async (_req, _res, next) => {
    if (mongoose_1.default.connection.readyState !== 1 && mongoose_1.default.connection.readyState !== 2) {
        try {
            await (0, database_1.connectDB)();
        }
        catch {
            // Controller level handles production vs dev errors
        }
    }
    next();
});
// Root server status
app.get("/", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "StudioSpace API Server",
        database: mongoose_1.default.connection.readyState === 1 ? "connected" : "connecting",
        docs: "/api",
        health: "/health",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
    });
});
// Health check endpoint
app.get("/health", (_req, res) => {
    const isConnected = mongoose_1.default.connection.readyState === 1;
    res.status(isConnected ? 200 : 200).json({
        status: isConnected ? "ok" : "degraded",
        service: "StudioSpace API Server",
        database: isConnected ? "connected" : "connecting",
        databaseName: mongoose_1.default.connection.db?.databaseName || "studiospace",
        timestamp: new Date().toISOString(),
    });
});
// Rate limiter for API routes
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests from this IP, please try again after 15 minutes" },
});
app.use("/api", apiLimiter);
// API Routes
app.use("/api/auth", auth_routes_1.default);
app.use("/api/studios", studio_routes_1.default);
app.use("/api/bookings", booking_routes_1.default);
app.use("/api/bookmarks", bookmark_routes_1.default);
// Root API welcome
app.get("/api", (_req, res) => {
    res.status(200).json({
        message: "Welcome to StudioSpace API",
        version: "1.0.0",
        docs: "/api/health",
    });
});
// Global 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: "API Route Not Found" });
});
// Global error handler
app.use((err, _req, res, _next) => {
    console.error("Unhandled Server Error:", err);
    res.status(500).json({
        error: "Internal Server Error",
        message: env_1.ENV.NODE_ENV === "development" ? err.message : undefined,
    });
});
if (!process.env.NETLIFY && process.env.NODE_ENV !== "test") {
    const PORT = Number(process.env.PORT) || Number(env_1.ENV.PORT) || 5000;
    const HOST = "0.0.0.0";
    (0, database_1.connectDB)().finally(() => {
        app.listen(PORT, HOST, () => {
            console.log(`[StudioSpace Server] Listening on ${HOST}:${PORT} (process.env.PORT: ${process.env.PORT || "default"})`);
        });
    });
    // Graceful shutdown handling
    const handleExit = async () => {
        console.log("[Server] Shutting down gracefully...");
        await (0, database_1.disconnectDB)();
        process.exit(0);
    };
    process.on("SIGINT", handleExit);
    process.on("SIGTERM", handleExit);
}
exports.default = app;
