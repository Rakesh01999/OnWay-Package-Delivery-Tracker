import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        env: {
            NODE_ENV: "test",
            MONGODB_URI: "mongodb://localhost:27017/onway-test",
            JWT_SECRET: "test-secret",
            JWT_EXPIRES_IN: "1h",
            CORS_ORIGIN: "*",
        },
    },
});