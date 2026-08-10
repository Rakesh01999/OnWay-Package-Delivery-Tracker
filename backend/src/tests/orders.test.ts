import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createApp } from "../app";
import { User } from "../db/models/User";

const JWT_SECRET = "test-secret";

let mongoServer: MongoMemoryServer;
const app = createApp();

const validOrder = {
    customerName: "John Doe",
    pickupAddress: "123 Pickup St",
    dropoffAddress: "456 Dropoff Ave",
    packageWeight: 5.5,
};

async function createOrder(body: object = validOrder) {
    return app.request("/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

async function getToken() {
    return jwt.sign({ email: "staff@test.com", sub: "user1" }, JWT_SECRET, {
        expiresIn: "1h",
    });
}

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.JWT_SECRET = JWT_SECRET;
    await mongoose.connect(mongoServer.getUri());
}, 120000);

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

beforeEach(async () => {
    await mongoose.connection.dropDatabase();
});

describe("POST /orders", () => {
    it("creates an order with default pending status + initial history", async () => {
        const res = await createOrder();
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.customerName).toBe("John Doe");
        expect(body.status).toBe("pending");
        expect(body.statusHistory).toHaveLength(1);
        expect(body.statusHistory[0].status).toBe("pending");
        expect(body.statusHistory[0].timestamp).toBeTruthy();
    });

    it("rejects invalid payload with 400", async () => {
        const res = await createOrder({ customerName: "" });
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error.message).toBe("Validation failed");
    });
});

describe("GET /orders", () => {
    it("lists orders with pagination", async () => {
        await createOrder();
        await createOrder({ ...validOrder, customerName: "Jane" });

        const res = await app.request("/orders?page=1&limit=10");
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.data).toHaveLength(2);
        expect(body.total).toBe(2);
        expect(body.totalPages).toBe(1);
    });

    it("filters by status", async () => {
        await createOrder(); // pending
        await createOrder({ ...validOrder, status: "picked_up" });

        const res = await app.request("/orders?status=pending");
        const body = await res.json();
        expect(body.data).toHaveLength(1);
        expect(body.data[0].status).toBe("pending");
    });

    it("excludes soft-deleted orders", async () => {
        const created = await createOrder();
        const { id } = await created.json();

        const delRes = await app.request(`/orders/${id}`, { method: "DELETE" });
        expect(delRes.status).toBe(204);

        const res = await app.request("/orders");
        const body = await res.json();
        expect(body.data).toHaveLength(0);
    });

    it("searches by customer name, pickup, and dropoff address", async () => {
        await createOrder(); // John Doe / 123 Pickup St / 456 Dropoff Ave
        await createOrder({
            ...validOrder,
            customerName: "Jane Smith",
            pickupAddress: "789 Warehouse Rd",
            dropoffAddress: "101 Terminal Blvd",
        });
        await createOrder({
            ...validOrder,
            customerName: "Bob Jones",
            pickupAddress: "222 Pickup St",
            dropoffAddress: "333 Dropoff Ave",
        });

        // By customer name
        const byName = await app.request("/orders?search=jane");
        const nameBody = await byName.json();
        expect(nameBody.data).toHaveLength(1);
        expect(nameBody.data[0].customerName).toBe("Jane Smith");

        // By pickup address
        const byPickup = await app.request("/orders?search=warehouse");
        const pickupBody = await byPickup.json();
        expect(pickupBody.data).toHaveLength(1);
        expect(pickupBody.data[0].pickupAddress).toBe("789 Warehouse Rd");

        // By dropoff address
        const byDropoff = await app.request("/orders?search=Terminal");
        const dropoffBody = await byDropoff.json();
        expect(dropoffBody.data).toHaveLength(1);
        expect(dropoffBody.data[0].dropoffAddress).toBe("101 Terminal Blvd");
    });

    it("combines search and status filter", async () => {
        await createOrder(); // John Doe / pending
        await createOrder({
            ...validOrder,
            customerName: "Jane Smith",
            status: "picked_up",
        });

        // Only John Doe's pending order should match "john"
        const byName = await app.request("/orders?search=john");
        const nameBody = await byName.json();
        expect(nameBody.data).toHaveLength(1);

        // Combining a search term and a status filter narrows results
        const res = await app.request("/orders?search=john&status=picked_up");
        const body = await res.json();
        expect(body.data).toHaveLength(0);

        // Jane Smith's picked-up order matches both the term and filter
        const res2 = await app.request("/orders?search=jane&status=picked_up");
        const body2 = await res2.json();
        expect(body2.data).toHaveLength(1);
    });
});

describe("GET /orders/:id", () => {
    it("returns order with full status history", async () => {
        const created = await createOrder();
        const { id } = await created.json();

        const res = await app.request(`/orders/${id}`);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.id).toBe(id);
        expect(body.statusHistory).toHaveLength(1);
    });

    it("returns 404 for unknown id", async () => {
        const res = await app.request("/orders/000000000000000000000000");
        expect(res.status).toBe(404);
    });

    it("returns 400 for invalid id format", async () => {
        const res = await app.request("/orders/not-an-id");
        expect(res.status).toBe(400);
    });
});

describe("PATCH /orders/:id/status", () => {
    it("rejects unauthenticated request with 401", async () => {
        const created = await createOrder();
        const { id } = await created.json();

        const res = await app.request(`/orders/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "picked_up" }),
        });
        expect(res.status).toBe(401);
    });

    it("updates status and logs history entry", async () => {
        const created = await createOrder();
        const { id } = await created.json();
        const token = await getToken();

        const res = await app.request(`/orders/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "picked_up" }),
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.status).toBe("picked_up");
        expect(body.statusHistory).toHaveLength(2);
    });

    it("returns 409 on illegal transition", async () => {
        const created = await createOrder();
        const { id } = await created.json();
        const token = await getToken();

        const res = await app.request(`/orders/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "delivered" }),
        });
        expect(res.status).toBe(409);
    });
});

describe("DELETE /orders/:id", () => {
    it("soft deletes the order", async () => {
        const created = await createOrder();
        const { id } = await created.json();

        const res = await app.request(`/orders/${id}`, { method: "DELETE" });
        expect(res.status).toBe(204);

        const getRes = await app.request(`/orders/${id}`);
        expect(getRes.status).toBe(404);
    });
});

describe("POST /auth/login", () => {
    it("returns a token for valid credentials", async () => {
        const passwordHash = await bcrypt.hash("password123", 10);
        await User.create({ email: "staff@test.com", passwordHash });

        const res = await app.request("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "staff@test.com",
                password: "password123",
            }),
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.token).toBeTruthy();
    });

    it("rejects invalid credentials with 401", async () => {
        const res = await app.request("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "x@y.com", password: "wrong123" }),
        });
        expect(res.status).toBe(401);
    });
});