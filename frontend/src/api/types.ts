export type OrderStatus = "pending" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "cancelled";

export interface StatusHistoryEntry {
    status: OrderStatus;
    timestamp: string;
    note?: string;
}

export interface Order {
    id: string;
    customerName: string;
    pickupAddress: string;
    dropoffAddress: string;
    packageWeight: number;
    status: OrderStatus;
    statusHistory: StatusHistoryEntry[];
    createdAt: string;
    updatedAt: string;
}

export interface OrderListResponse {
    data: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CreateOrderInput {
    customerName: string;
    pickupAddress: string;
    dropoffAddress: string;
    packageWeight: number;
}

export interface AuthResponse {
    token: string;
}
