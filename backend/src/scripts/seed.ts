import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../db/connect";
import { User } from "../db/models/User";

async function seed(): Promise<void> {
    await connectDB();

    const email = process.env.SEED_EMAIL ?? "staff@onway.com";
    const password = process.env.SEED_PASSWORD ?? "password123";

    const existing = await User.findOne({ email });
    if (!existing) {
        const passwordHash = await bcrypt.hash(password, 10);
        await User.create({ email, passwordHash });
        console.log(`[seed] Created staff user: ${email}`);
    } else {
        console.log(`[seed] Staff user already exists: ${email}`);
    }

    await disconnectDB();
}

seed().catch((err) => {
    console.error("[seed] Failed:", err);
    process.exit(1);
});