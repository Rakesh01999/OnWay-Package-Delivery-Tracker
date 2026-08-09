import type { MiddlewareHandler } from "hono";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UnauthorizedError } from "../utils/errors";

export interface JwtPayload {
    sub: string;
    email: string;
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Missing or malformed Authorization header");
    }

    const token = authHeader.slice("Bearer ".length).trim();

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        c.set("user", decoded);
    } catch {
        throw new UnauthorizedError("Invalid or expired token");
    }

    await next();
};