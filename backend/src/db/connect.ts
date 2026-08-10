import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { User } from "./models/User";

let isConnecting = false;

export async function connectDB(uri?: string): Promise<void> {
    if (mongoose.connection.readyState === 1) {
        return;
    }
    if (isConnecting) {
        return;
    }
    isConnecting = true;

    try {
        mongoose.set("strictQuery", true);
        mongoose.set("bufferCommands", false);
        await mongoose.connect(uri ?? env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
        });
        console.log("[db] MongoDB connected");

        const count = await User.countDocuments().catch(() => 0);
        if (count === 0) {
            const email = process.env.SEED_EMAIL ?? "staff@onway.com";
            const password = process.env.SEED_PASSWORD ?? "password123";
            const passwordHash = await bcrypt.hash(password, 10);
            await User.create({ email, passwordHash }).catch(() => {});
            console.log(`[db] Auto-seeded staff user: ${email}`);
        }
    } catch (err: any) {
        console.error("[db] Connection error:", err?.message || err);
        throw new Error(`Database connection failed: ${err?.message || "Failed to connect to MongoDB"}`);
    } finally {
        isConnecting = false;
    }
}

export async function disconnectDB(): Promise<void> {
    await mongoose.disconnect();
    console.log("[db] MongoDB disconnected");
}