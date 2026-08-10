import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { connectDB } from "./db/connect";
import { env } from "./config/env";

connectDB().catch((err) => console.error("[server] DB Connection error:", err));

const app = createApp();

if (process.env.NODE_ENV !== "test") {
    serve({ fetch: app.fetch, port: env.PORT }, (info) => {
        console.log(`[server] API running at http://localhost:${info.port}`);
    });
}

export default app;