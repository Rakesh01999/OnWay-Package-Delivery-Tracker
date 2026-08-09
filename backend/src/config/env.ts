import "dotenv/config";

const requiredVars = ["MONGODB_URI", "JWT_SECRET"] as const;

for (const v of requiredVars) {
    if (!process.env[v]) {
        throw new Error(`Missing required environment variable: ${v}`);
    }
}

export const env = {
    NODE_ENV: process.env.NODE_ENV ?? "development",
    PORT: Number(process.env.PORT) || 3000,
    MONGODB_URI: process.env.MONGODB_URI as string,
    JWT_SECRET: process.env.JWT_SECRET as string,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "1d",
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
};