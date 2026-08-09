import type { Hook } from "@hono/zod-validator";

export const rethrowValidationErrors: Hook<any, any, any, any> = (result) => {
    if (!result.success) {
        throw result.error;
    }
};