import mongoose from "mongoose";
import { ORDER_STATUSES } from "../../state/statusMachine";

export const statusHistorySchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: ORDER_STATUSES,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
        },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        customerName: {
            type: String,
            required: [true, "Customer name is required"],
            trim: true,
        },
        pickupAddress: {
            type: String,
            required: [true, "Pickup address is required"],
            trim: true,
        },
        dropoffAddress: {
            type: String,
            required: [true, "Drop-off address is required"],
            trim: true,
        },
        packageWeight: {
            type: Number,
            required: [true, "Package weight is required"],
            min: [0.01, "Package weight must be greater than 0"],
        },
        status: {
            type: String,
            enum: ORDER_STATUSES,
            default: "pending",
            required: true,
        },
        statusHistory: {
            type: [statusHistorySchema],
            default: [],
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Support filtered pagination: WHERE status = ? AND deleted_at IS NULL
orderSchema.index({ status: 1, deletedAt: 1 });
// Support soft-delete filtering on general list queries
orderSchema.index({ deletedAt: 1, createdAt: -1 });

export type OrderDocument = mongoose.InferSchemaType<typeof orderSchema>;
export type StatusHistoryEntry = mongoose.InferSchemaType<typeof statusHistorySchema>;

export const Order =
    mongoose.models.Order ?? mongoose.model("Order", orderSchema);
