import mongoose from "mongoose";
import { ENV } from "./env";
import { sanitizeMongoUri, maskMongoUri } from "../utils/mongoUri";

interface ConnectionState {
  isConnected: boolean;
  lastError: string | null;
  targetUri: string;
}

const state: ConnectionState = {
  isConnected: false,
  lastError: null,
  targetUri: "",
};

export function getResolvedMongoUri(): string {
  const rawUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URL ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL ||
    process.env.DB_URI ||
    process.env.MONGODB_CONNECTION_STRING ||
    ENV.MONGODB_URI;

  return sanitizeMongoUri(rawUri);
}

export function getDatabaseStatus() {
  const uri = getResolvedMongoUri();
  return {
    isConnected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    status: mongoose.connection.readyState === 1 ? "connected" : mongoose.connection.readyState === 2 ? "connecting" : "disconnected",
    databaseName: mongoose.connection.db?.databaseName || "studiospace",
    target: maskMongoUri(uri),
    hasEnvVar: Boolean(
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      process.env.MONGODB_URL ||
      process.env.MONGO_URL ||
      process.env.DATABASE_URL
    ),
    lastError: state.lastError,
  };
}

let lastConnectionAttempt = 0;
const RECONNECT_COOLDOWN_MS = 20000; // 20 seconds cooldown if connection failed

export async function connectDB(force = false): Promise<typeof mongoose | null> {
  if (state.isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
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
    if (ENV.NODE_ENV === "production") {
      console.error("[MongoDB Atlas] CRITICAL: No MONGODB_URI provided in production. Localhost fallback disabled.");
    }
    return null;
  }

  try {
    mongoose.set("strictQuery", false);

    console.log(`[MongoDB Atlas] Attempting connection to: ${maskMongoUri(sanitizedUri)}`);

    const conn = await mongoose.connect(sanitizedUri, {
      dbName: "studiospace",
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      autoIndex: true,
    });

    state.isConnected = true;
    state.lastError = null;
    console.log(`[MongoDB Atlas] Connected successfully to database: ${conn.connection.db?.databaseName || "studiospace"}`);

    mongoose.connection.on("error", (err) => {
      console.error("[MongoDB Atlas] Runtime error:", err.message);
      state.lastError = err.message;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[MongoDB Atlas] Disconnected from database");
      state.isConnected = false;
    });

    return conn;
  } catch (error: any) {
    state.isConnected = false;
    state.lastError = error.message ? maskMongoUri(error.message) : "Unknown error";
    // Never expose connection credentials in logs
    console.error("[MongoDB Atlas] Connection failed:", error.name || "Error", state.lastError);
    return null;
  }
}

export async function disconnectDB(): Promise<void> {
  if (state.isConnected || mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    state.isConnected = false;
    console.log("[MongoDB Atlas] Connection closed gracefully");
  }
}
