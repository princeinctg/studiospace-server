import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { ENV } from "./config/env";

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: [ENV.CLIENT_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (ENV.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "StudioSpace API Server",
    timestamp: new Date().toISOString(),
  });
});

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

if (process.env.NODE_ENV !== "test") {
  app.listen(ENV.PORT, () => {
    console.log(`[StudioSpace Server] Listening on port ${ENV.PORT}`);
  });
}

export default app;
