export const ORDER_STATUSES = [
    "pending",
    "picked_up",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Fixed state machine:
 *   pending → picked_up → in_transit → out_for_delivery → delivered
 *   cancelled is allowed from any state BEFORE delivered.
 *   delivered and cancelled are terminal states.
 */
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    pending: ["picked_up", "cancelled"],
    picked_up: ["in_transit", "cancelled"],
    in_transit: ["out_for_delivery", "cancelled"],
    out_for_delivery: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
};

export function isOrderStatus(value: string): value is OrderStatus {
    return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function canTransition(
    from: OrderStatus,
    to: OrderStatus
): { allowed: boolean; reason?: string } {
    if (!isOrderStatus(from) || !isOrderStatus(to)) {
        return { allowed: false, reason: `Unknown status value` };
    }

    if (from === to) {
        return { allowed: false, reason: `Order is already "${from}"` };
    }

    if (!TRANSITIONS[from].includes(to)) {
        return {
            allowed: false,
            reason: `Cannot move from "${from}" to "${to}"`,
        };
    }

    return { allowed: true };
}