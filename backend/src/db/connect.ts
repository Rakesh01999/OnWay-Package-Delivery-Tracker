import mongoose from "mongoose";
import { env } from "../config/env";

export async function connectDB(uri?: string): Promise<void> {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri ?? env.MONGODB_URI);
    console.log("[db] MongoDB connected");

    try {
        const { User } = await import("./models/User");
        const bcrypt = (await import("bcryptjs")).default;
        const count = await User.countDocuments();
        if (count === 0) {
            const email = process.env.SEED_EMAIL ?? "staff@onway.com";
            const password = process.env.SEED_PASSWORD ?? "password123";
            const passwordHash = await bcrypt.hash(password, 10);
            await User.create({ email, passwordHash });
            console.log(`[db] Auto-seeded staff user: ${email}`);
        }
    } catch (err) {
        console.error("[db] Seed check failed:", err);
    }
}

export async function disconnectDB(): Promise<void> {
    await mongoose.disconnect();
    console.log("[db] MongoDB disconnected");
}