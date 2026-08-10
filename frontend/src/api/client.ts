/// <reference types="vite/client" />

import type { AuthResponse, CreateOrderInput, Order, OrderListResponse } from "./types";

const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem("onway_token");
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string>),
    };
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (!res.ok) {
        let errorMsg = "Request failed";
        try {
            const body = await res.json();
            if (body?.error?.message) {
                errorMsg = body.error.message;
            } else if (body?.message) {
                errorMsg = body.message;
            }
        } catch {}
        throw new ApiError(res.status, errorMsg);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
}

export const api = {
    login: (email: string, password: string) => request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    listOrders: (params: { page?: number; limit?: number; status?: string; search?: string } = {}) => {
        const qs = new URLSearchParams();
        if (params.page) qs.set("page", String(params.page));
        if (params.limit) qs.set("limit", String(params.limit));
        if (params.status) qs.set("status", params.status);
        if (params.search) qs.set("search", params.search);
        return request<OrderListResponse>("/orders?" + qs.toString());
    },
    getOrder: (id: string) => request<Order>("/orders/" + id),
    createOrder: (input: CreateOrderInput) =>
        request<Order>("/orders", { method: "POST", body: JSON.stringify(input) }),
    updateStatus: (id: string, status: string) =>
        request<Order>("/orders/" + id + "/status", { method: "PATCH", body: JSON.stringify({ status }) }),
    deleteOrder: (id: string) => request<void>("/orders/" + id, { method: "DELETE" }),
};
