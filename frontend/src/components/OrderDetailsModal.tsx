import type { Order } from "../api/types";

const STATUS_META: Record<Order["status"], { label: string; icon: string }> = {
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
}

export default function OrderDetailsModal({ order, onClose }: Props) {
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal modal-details" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="order-details-title">
                <div className="modal-head">
                    <div className="modal-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
                            <path d="M3 8l9 5 9-5" />
                            <path d="M12 13v8" />
                        </svg>
                    </div>
                    <h2 id="order-details-title">Order Details</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className="details-card">
                    <div className="details-header">
                        <div className="customer-cell">
                            <span className="customer-avatar">{order.customerName.charAt(0).toUpperCase()}</span>
                            <div className="details-customer">
                                <strong>{order.customerName}</strong>
                                <span>Order #{order.id}</span>
                            </div>
                        </div>
                        <span className={`badge st-${order.status}`}>
                            <span className="badge-dot" aria-hidden="true" />
                            {STATUS_META[order.status].label}
                        </span>
                    </div>

                    <div className="details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Pickup address</span>
                            <p className="detail-value">{order.pickupAddress}</p>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Dropoff address</span>
                            <p className="detail-value">{order.dropoffAddress}</p>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Package weight</span>
                            <p className="detail-value">{order.packageWeight} kg</p>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Created</span>
                            <p className="detail-value">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Last updated</span>
                            <p className="detail-value">{new Date(order.updatedAt).toLocaleString()}</p>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Order ID</span>
                            <p className="detail-value detail-id">{order.id}</p>
                        </div>
                    </div>
                </div>

                <div className="details-section">
                    <h3>Status History</h3>
                    <ol className="timeline">
                        {[...order.statusHistory].reverse().map((h, i) => (
                            <li key={i} className="timeline-item">
                                <span className={`timeline-dot st-${h.status}`} aria-hidden="true" />
                                <div className="timeline-body">
                                    <span className={`badge st-${h.status}`}>
                                        <span className="badge-dot" aria-hidden="true" />
                                        {STATUS_META[h.status].label}
                                    </span>
                                    <span className="timeline-date">{new Date(h.timestamp).toLocaleString()}</span>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="modal-actions">
                    <button type="button" className="primary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}