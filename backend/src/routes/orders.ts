import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
    createOrder,
    getOrderById,
    listOrders,
    softDeleteOrder,
    updateOrderStatus,
    validateOrderId,
} from "../services/orderService";
import {
    createOrderSchema,
    listOrdersQuerySchema,
    updateStatusSchema,
} from "../validators/order";
import { authMiddleware } from "../middleware/auth";
import { rethrowValidationErrors } from "../utils/validation";

export const orderRoutes = new Hono();

orderRoutes.post(
    "/",
    zValidator("json", createOrderSchema, rethrowValidationErrors),
    async (c) => {
        const input = c.req.valid("json");
        const order = await createOrder(input);
        return c.json(order, 201);
    });

orderRoutes.get(
    "/",
    zValidator("query", listOrdersQuerySchema, rethrowValidationErrors),
    async (c) => {
        const query = c.req.valid("query");
        const result = await listOrders({
            page: query.page,
            limit: query.limit,
            status: query.status,
            search: query.search,
        });
        return c.json(result);
    });

orderRoutes.get("/:id", async (c) => {
    const id = c.req.param("id");
    validateOrderId(id);
    const order = await getOrderById(id);
    return c.json(order);
});

orderRoutes.patch(
    "/:id/status",
    authMiddleware,
    zValidator("json", updateStatusSchema, rethrowValidationErrors),
    async (c) => {
        const id = c.req.param("id") as string;
        validateOrderId(id);
        const { status } = c.req.valid("json");
        const order = await updateOrderStatus(id, status);
        return c.json(order);
    }
);

orderRoutes.delete("/:id", (c) => {
    const id = c.req.param("id");
    validateOrderId(id);
    return softDeleteOrder(id).then(() => c.body(null, 204));
});