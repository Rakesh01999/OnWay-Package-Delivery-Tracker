import "dotenv/config";

function getMongoUri(): string {
    const raw = process.env.MONGODB_URI;
    if (raw && !raw.includes("<") && !raw.includes("CLUSTER") && !raw.includes("127.0.0.1") && !raw.includes("localhost")) {
        return raw;
    }
    return "mongodb+srv://onwayUser:onwayPass@cluster0.uuibjb3.mongodb.net/onway-delivery-tracker";
}

export const env = {
    NODE_ENV: process.env.NODE_ENV ?? "production",
    PORT: Number(process.env.PORT) || 3000,
    MONGODB_URI: getMongoUri(),
    JWT_SECRET:
        process.env.JWT_SECRET ||
        "dev-secret-change-me-in-production-8f3a1c9b7e2d4f6a",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "1d",
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
};