import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { connectDB } from "./db/connect";
import { env } from "./config/env";

async function main(): Promise<void> {
    await connectDB();
    const app = createApp();

    serve({ fetch: app.fetch, port: env.PORT }, (info) => {
        console.log(`[server] API running at http://localhost:${info.port}`);
    });
}

main().catch((err) => {
    console.error("[server] Failed to start:", err);
    process.exit(1);
});