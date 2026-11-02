import mongoose from "mongoose";
import { ENV } from "./env";

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

  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
      autoIndex: true,
    });

    state.isConnected = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error("[MongoDB] Runtime error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[MongoDB] Disconnected from database");
      state.isConnected = false;
    });

    return conn;
  } catch (error) {
    console.error("[MongoDB] Initial connection error:", error);
    // Don't crash process in dev/test; allow server to run and retry
    return null;
  }
}

export async function disconnectDB(): Promise<void> {
  if (state.isConnected) {
    await mongoose.disconnect();
    state.isConnected = false;
    console.log("[MongoDB] Connection closed gracefully");
  }
}
