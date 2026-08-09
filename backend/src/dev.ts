import { MongoMemoryServer } from "mongodb-memory-server";
import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { connectDB, disconnectDB } from "./db/connect";
import { env } from "./config/env";

let mongo: MongoMemoryServer;

async function main(): Promise<void> {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    console.log(`[dev] In-memory MongoDB started: ${uri}`);

    await connectDB(uri);
    const app = createApp();

    serve({ fetch: app.fetch, port: env.PORT }, (info) => {
        console.log(`[server] API running at http://localhost:${info.port}`);
    });
}

async function shutdown(): Promise<void> {
    console.log("\n[dev] Shutting down...");
    await disconnectDB();
    await mongo?.stop();
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((err) => {
    console.error("[server] Failed to start:", err);
    process.exit(1);
});