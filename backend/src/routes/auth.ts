import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../db/models/User";
import { env } from "../config/env";
import { loginSchema } from "../validators/order";
import { UnauthorizedError } from "../utils/errors";
import { rethrowValidationErrors } from "../utils/validation";

export const authRoutes = new Hono();

authRoutes.post(
    "/login",
    zValidator("json", loginSchema, rethrowValidationErrors),
    async (c) => {
        const { email, password } = c.req.valid("json");

        const user = await User.findOne({ email });
        if (!user) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );
        if (!passwordMatches) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const token = jwt.sign(
            { email: user.email },
            env.JWT_SECRET,
            {
                subject: String(user._id),
                expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
            }
        );

        return c.json({ token });
    }
);