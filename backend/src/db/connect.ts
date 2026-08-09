import mongoose from "mongoose";
import { env } from "../config/env";

export async function connectDB(uri?: string): Promise<void> {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri ?? env.MONGODB_URI);
    console.log("[db] MongoDB connected");
}

export async function disconnectDB(): Promise<void> {
    await mongoose.disconnect();
    console.log("[db] MongoDB disconnected");
}