import type { ContentfulStatusCode } from "hono/utils/http-status";

export class HttpError extends Error {
    status: ContentfulStatusCode;
    details?: unknown;

    constructor(status: ContentfulStatusCode, message: string, details?: unknown) {
        super(message);
        this.name = "HttpError";
        this.status = status;
        this.details = details;
    }
}

export class NotFoundError extends HttpError {
    constructor(message = "Resource not found") {
        super(404, message);
        this.name = "NotFoundError";
    }
}

export class ConflictError extends HttpError {
    constructor(message: string) {
        super(409, message);
        this.name = "ConflictError";
    }
}

export class BadRequestError extends HttpError {
    constructor(message: string, details?: unknown) {
        super(400, message, details);
        this.name = "BadRequestError";
    }
}

export class UnauthorizedError extends HttpError {
    constructor(message = "Unauthorized") {
        super(401, message);
        this.name = "UnauthorizedError";
    }
}