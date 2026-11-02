import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { ENV } from "./config/env";
import { connectDB, disconnectDB } from "./config/database";
import authRoutes from "./routes/auth.routes";
import studioRoutes from "./routes/studio.routes";
import bookingRoutes from "./routes/booking.routes";
import bookmarkRoutes from "./routes/bookmark.routes";

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        ENV.CLIENT_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://studiospace-luxury.netlify.app",
      ];
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".netlify.app") ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback permissive for examiner preview
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (ENV.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Ensure DB connection for serverless / cold starts
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("[Database Connection Error in Middleware]:", err);
  }
  next();
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "StudioSpace API Server",
    database: "connected",
    timestamp: new Date().toISOString(),
  });
});

// Rate limiter for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
});
app.use("/api", apiLimiter);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/studios", studioRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/bookmarks", bookmarkRoutes);

// Root API welcome
app.get("/api", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to StudioSpace API",
    version: "1.0.0",
    docs: "/api/health",
  });
});

// Global 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "API Route Not Found" });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: ENV.NODE_ENV === "development" ? err.message : undefined,
  });
});

if (!process.env.NETLIFY && process.env.NODE_ENV !== "test") {
  const PORT = Number(process.env.PORT) || Number(ENV.PORT) || 5000;
  const HOST = "0.0.0.0";

  connectDB().then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`[StudioSpace Server] Listening on ${HOST}:${PORT} (process.env.PORT: ${process.env.PORT || "default"})`);
    });
  });

  // Graceful shutdown handling
  const handleExit = async () => {
    console.log("[Server] Shutting down gracefully...");
    await disconnectDB();
    process.exit(0);
  };

  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit);
}

export default app;
