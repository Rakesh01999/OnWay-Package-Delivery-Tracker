import { z } from "zod";
import { ORDER_STATUSES } from "../state/statusMachine";

export const createOrderSchema = z.object({
    customerName: z
        .string({ required_error: "Customer name is required" })
        .trim()
        .min(1, "Customer name cannot be empty")
        .max(120, "Customer name must be 120 characters or fewer"),
    pickupAddress: z
        .string({ required_error: "Pickup address is required" })
        .trim()
        .min(1, "Pickup address cannot be empty")
        .max(500, "Pickup address must be 500 characters or fewer"),
    dropoffAddress: z
        .string({ required_error: "Drop-off address is required" })
        .trim()
        .min(1, "Drop-off address cannot be empty")
        .max(500, "Drop-off address must be 500 characters or fewer"),
    packageWeight: z
        .number({ required_error: "Package weight is required" })
        .positive("Package weight must be greater than 0")
        .max(100000, "Package weight is unreasonably large"),
    status: z
        .enum(ORDER_STATUSES)
        .optional()
        .default("pending"),
});

export const updateStatusSchema = z.object({
    status: z.enum(ORDER_STATUSES, {
        required_error: "Status is required",
        invalid_type_error: "Invalid status value",
    }),
});

export const listOrdersQuerySchema = z.object({
    page: z.coerce
        .number()
        .int("Page must be an integer")
        .min(1, "Page must be at least 1")
        .optional()
        .default(1),
    limit: z.coerce
        .number()
        .int("Limit must be an integer")
        .min(1, "Limit must be at least 1")
        .max(100, "Limit cannot exceed 100")
        .optional()
        .default(20),
    status: z.enum(ORDER_STATUSES).optional(),
    search: z
        .string()
        .trim()
        .max(200, "Search must be 200 characters or fewer")
        .optional(),
});

export const loginSchema = z.object({
    email: z
        .string({ required_error: "Email is required" })
        .trim()
        .email("Invalid email format"),
    password: z
        .string({ required_error: "Password is required" })
        .min(8, "Password must be at least 8 characters"),
});