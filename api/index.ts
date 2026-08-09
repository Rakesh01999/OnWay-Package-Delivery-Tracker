import { handle } from "hono/vercel";
import { createApp } from "../backend/src/app";
import { connectDB } from "../backend/src/db/connect";

const app = createApp();

export const config = {
    runtime: "nodejs",
};

export default async function handler(req: Request) {
    await connectDB();
    return handle(app)(req);
}
