import mongoose from "mongoose";
import { Order, type StatusHistoryEntry } from "../db/models/Order";
import { canTransition, type OrderStatus } from "../state/statusMachine";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors";

export interface ListOrdersParams {
    page: number;
    limit: number;
    status?: OrderStatus;
    search?: string;
}

export interface ListOrdersResult {
    data: OrderRecord[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface OrderRecord {
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

const ACTIVE_FILTER = { deletedAt: null };

function toOrderRecord(doc: Record<string, unknown>): OrderRecord {
    const history = (doc.statusHistory as StatusHistoryEntry[] | undefined) ?? [];
    return {
        id: String(doc._id),
        customerName: doc.customerName as string,
        pickupAddress: doc.pickupAddress as string,
        dropoffAddress: doc.dropoffAddress as string,
        packageWeight: doc.packageWeight as number,
        status: doc.status as OrderStatus,
        statusHistory: history
            .slice()
            .sort(
                (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime()
            ),
        createdAt: (doc.createdAt as Date).toISOString(),
        updatedAt: (doc.updatedAt as Date).toISOString(),
    };
}

export async function createOrder(input: {
    customerName: string;
    pickupAddress: string;
    dropoffAddress: string;
    packageWeight: number;
    status?: OrderStatus;
}): Promise<OrderRecord> {
    const initialStatus: OrderStatus = input.status ?? "pending";

    const order = await Order.create({
        customerName: input.customerName,
        pickupAddress: input.pickupAddress,
        dropoffAddress: input.dropoffAddress,
        packageWeight: input.packageWeight,
        status: initialStatus,
        statusHistory: [{ status: initialStatus, timestamp: new Date() }],
    });

    return toOrderRecord(order.toObject());
}

export async function listOrders(params: ListOrdersParams): Promise<ListOrdersResult> {
    const { page, limit, status, search } = params;
    const filter: Record<string, unknown> = { ...ACTIVE_FILTER };

    if (status) {
        filter.status = status;
    }

    if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");
        filter.$or = [
            { customerName: regex },
            { pickupAddress: regex },
            { dropoffAddress: regex },
        ];
    }

    const [docs, total] = await Promise.all([
        Order.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Order.countDocuments(filter),
    ]);

    return {
        data: docs.map((doc) => toOrderRecord(doc as Record<string, unknown>)),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };
}

export async function getOrderById(id: string): Promise<OrderRecord> {
    const order = await Order.findOne({ _id: id, ...ACTIVE_FILTER }).lean();

    if (!order) {
        throw new NotFoundError("Order not found");
    }

    return toOrderRecord(order as Record<string, unknown>);
}

export async function updateOrderStatus(id: string, nextStatus: OrderStatus): Promise<OrderRecord> {
    const order = await Order.findOne({ _id: id, ...ACTIVE_FILTER });

    if (!order) {
        throw new NotFoundError("Order not found");
    }

    const currentStatus = order.status as OrderStatus;

    const transition = canTransition(currentStatus, nextStatus);
    if (!transition.allowed) {
        throw new ConflictError(transition.reason ?? "Illegal status transition");
    }

    order.status = nextStatus;
    order.statusHistory.push({ status: nextStatus, timestamp: new Date() });
    await order.save();

    return toOrderRecord(order.toObject());
}

export async function softDeleteOrder(id: string): Promise<void> {
    const result = await Order.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() } }
    );

    if (!result) {
        throw new NotFoundError("Order not found");
    }
}

export function validateOrderId(id: string): void {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError("Invalid order id format");
    }
}