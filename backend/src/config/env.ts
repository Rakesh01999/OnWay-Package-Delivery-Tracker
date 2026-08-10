import "dotenv/config";

export const env = {
    NODE_ENV: process.env.NODE_ENV ?? "production",
    PORT: Number(process.env.PORT) || 3000,
    MONGODB_URI:
        process.env.MONGODB_URI ||
        "mongodb+srv://onwayUser:onwayPass@cluster0.uuibjb3.mongodb.net/onway-delivery-tracker",
    JWT_SECRET:
        process.env.JWT_SECRET ||
        "dev-secret-change-me-in-production-8f3a1c9b7e2d4f6a",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "1d",
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
};