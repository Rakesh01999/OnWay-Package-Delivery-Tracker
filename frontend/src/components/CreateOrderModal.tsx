import { useState, type FormEvent } from "react";
import { api } from "../api/client";

interface Props {
    onClose: () => void;
    onCreated: () => void;
}

export default function CreateOrderModal({ onClose, onCreated }: Props) {
    const [customerName, setCustomerName] = useState("");
    const [pickupAddress, setPickupAddress] = useState("");
    const [dropoffAddress, setDropoffAddress] = useState("");
    const [packageWeight, setPackageWeight] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await api.createOrder({
                customerName,
                pickupAddress,
                dropoffAddress,
                packageWeight: Number(packageWeight),
            });
            onCreated();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create order");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal modal-create" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="create-order-title">
                <div className="modal-head">
                    <div className="modal-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 4h6v6" />
                            <path d="M22 4l-8 8" />
                            <path d="M20 13v6a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1h6" />
                        </svg>
                    </div>
                    <h2 id="create-order-title">New Order</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <label>
                        <span className="field-label">Customer name</span>
                        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required autoFocus placeholder="Full name" />
                    </label>
                    <label>
                        <span className="field-label">Pickup address</span>
                        <input value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} required placeholder="Address where package is collected" />
                    </label>
                    <label>
                        <span className="field-label">Dropoff address</span>
                        <input value={dropoffAddress} onChange={(e) => setDropoffAddress(e.target.value)} required placeholder="Delivery destination" />
                    </label>
                    <label>
                        <span className="field-label">Package weight (kg)</span>
                        <input type="number" min="0" step="0.01" value={packageWeight} onChange={(e) => setPackageWeight(e.target.value)} required placeholder="e.g. 5.5" />
                    </label>
                    {error && <div className="error-banner">{error}</div>}
                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary" disabled={loading}>
                            {loading ? <span className="btn-spinner" aria-hidden="true" /> : "Create order"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}