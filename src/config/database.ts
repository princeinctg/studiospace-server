import mongoose from "mongoose";
import { ENV } from "./env";
import { sanitizeMongoUri, maskMongoUri } from "../utils/mongoUri";

interface ConnectionState {
  isConnected: boolean;
}

const state: ConnectionState = {
  isConnected: false,
};

export async function connectDB(): Promise<typeof mongoose | null> {
  if (state.isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const rawUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URL ||
    ENV.MONGODB_URI;

  const sanitizedUri = sanitizeMongoUri(rawUri);

  try {
    mongoose.set("strictQuery", false);

    console.log(`[MongoDB Atlas] Attempting connection to: ${maskMongoUri(sanitizedUri)}`);

    const conn = await mongoose.connect(sanitizedUri, {
      dbName: "studiospace",
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      autoIndex: true,
    });

    state.isConnected = true;
    console.log(`[MongoDB Atlas] Connected successfully to database: ${conn.connection.db?.databaseName || "studiospace"}`);

    mongoose.connection.on("error", (err) => {
      console.error("[MongoDB Atlas] Runtime error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[MongoDB Atlas] Disconnected from database");
      state.isConnected = false;
    });

    return conn;
  } catch (error: any) {
    // Never expose connection credentials in logs
    console.error("[MongoDB Atlas] Connection failed:", error.name || "Error", error.message ? maskMongoUri(error.message) : "");
    state.isConnected = false;
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
