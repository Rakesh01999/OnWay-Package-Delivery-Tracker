import { useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { Order, OrderStatus } from "../api/types";

const STATUSES: OrderStatus[] = ["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "cancelled"];

const STATUS_META: Record<OrderStatus, { label: string; icon: string }> = {
    pending: { label: "Pending", icon: "🕐" },
    picked_up: { label: "Picked up", icon: "📦" },
    in_transit: { label: "In transit", icon: "🚚" },
    out_for_delivery: { label: "Out for delivery", icon: "📬" },
    delivered: { label: "Delivered", icon: "✅" },
    cancelled: { label: "Cancelled", icon: "🚫" },
};

interface Props {
    order: Order;
    onClose: () => void;
    onUpdated: () => void;
}

export default function StatusModal({ order, onClose, onUpdated }: Props) {
    const [status, setStatus] = useState<OrderStatus>(order.status);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (status === order.status) { onClose(); return; }
        setError("");
        setLoading(true);
        try {
            await api.updateStatus(order.id, status);
            onUpdated();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update status");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal modal-status" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="update-status-title">
                <div className="modal-head">
                    <div className="modal-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 10V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h4" />
                            <path d="M16 3v4" />
                            <path d="M8 3v4" />
                            <path d="M4 11h16" />
                            <path d="M18 15v6" />
                            <path d="M15 18h6" />
                        </svg>
                    </div>
                    <h2 id="update-status-title">Update Status</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className="status-order-summary">
                    <div className="status-customer">
                        <span className="customer-avatar">{order.customerName.charAt(0).toUpperCase()}</span>
                        <div>
                            <strong>{order.customerName}</strong>
                            <span>{STATUS_META[order.status].icon} Currently {STATUS_META[order.status].label}</span>
                        </div>
                    </div>
                    <div className="status-route">
                        <span className="route-point">{order.pickupAddress}</span>
                        <span className="route-arrow" aria-hidden="true">→</span>
                        <span className="route-point">{order.dropoffAddress}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <label>
                        <span className="field-label">New status</span>
                        <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
                            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].icon} {STATUS_META[s].label}</option>)}
                        </select>
                    </label>
                    {error && <div className="error-banner">{error}</div>}
                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary" disabled={loading || status === order.status}>
                            {loading ? <span className="btn-spinner" aria-hidden="true" /> : "Update status"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}