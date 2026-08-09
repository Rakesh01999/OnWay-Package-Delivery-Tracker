import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api/client";
import type { Order, OrderListResponse, OrderStatus } from "../api/types";
import CreateOrderModal from "./CreateOrderModal";
import DeleteOrderModal from "./DeleteOrderModal";
import OrderDetailsModal from "./OrderDetailsModal";
import StatusModal from "./StatusModal";

const STATUSES: OrderStatus[] = ["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "cancelled"];

const STATUS_CLASS: Record<OrderStatus, string> = {
    pending: "st-pending",
    picked_up: "st-picked-up",
    in_transit: "st-in-transit",
    out_for_delivery: "st-out-for-delivery",
    delivered: "st-delivered",
    cancelled: "st-cancelled",
};

interface Props {
    email: string;
    onLogout: () => void;
}

export default function Dashboard({ email, onLogout }: Props) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [showDelete, setShowDelete] = useState<Order | null>(null);
    const [showDetails, setShowDetails] = useState<Order | null>(null);
    const [showStatus, setShowStatus] = useState<Order | null>(null);
    const searchTimer = useRef<number | undefined>(undefined);

    async function loadOrders(p = page, status = statusFilter, search = searchTerm) {
        try {
            const res: OrderListResponse = await api.listOrders({ page: p, limit: 10, status, search });
            setOrders(res.data);
            setTotal(res.total);
            setTotalPages(res.totalPages);
            setPage(res.page);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Failed to load orders");
        }
    }

    useEffect(() => { loadOrders(page, statusFilter, searchTerm); }, [page, statusFilter, searchTerm]);

    function handleSearchChange(value: string) {
        setSearchInput(value);
        window.clearTimeout(searchTimer.current);
        searchTimer.current = window.setTimeout(() => {
            setSearchTerm(value.trim());
            setPage(1);
        }, 300);
    }

    useEffect(() => {
        return () => window.clearTimeout(searchTimer.current);
    }, []);


    const activeFilterLabel = statusFilter ? statusFilter.replace(/_/g, " ") : "All statuses";

    return (
        <div className="dashboard">
            <header className="topbar">
                <div className="brand">
                    <div className="brand-mark" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
                            <path d="M3 8l9 5 9-5" />
                            <path d="M12 13v8" />
                        </svg>
                    </div>
                    <div className="brand-text">
                        <h1>OnWay</h1>
                        <p>Package Delivery Tracker</p>
                    </div>
                </div>
                <div className="topbar-right">
                    <div className="user-chip">
                        <span className="user-avatar">{email.charAt(0).toUpperCase()}</span>
                        <span className="user-email">{email}</span>
                    </div>
                    <button className="btn-ghost" onClick={onLogout} aria-label="Logout">
                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                            <path d="M16 17l5-5-5-5" />
                            <path d="M21 12H9" />
                        </svg>
                        Logout
                    </button>
                </div>
            </header>

            <section className="page-hero">
                <div className="hero-copy">
                    <h2>Delivery Orders</h2>
                    <p>Track, update, and manage every package in one place.</p>
                </div>
                <button className="primary hero-cta" onClick={() => setShowCreate(true)}>
                    <span className="btn-plus" aria-hidden="true">+</span> New Order
                </button>
            </section>

            <div className="toolbar">
                <div className="search-wrap">
                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="search"
                        className="search-input"
                        placeholder="Search customer, pickup, dropoff..."
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        aria-label="Search orders"
                    />
                </div>
                <select
                    className="status-filter"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    aria-label="Filter by status"
                >
                    <option value="">All statuses</option>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="table-card">
                <div className="table-meta">
                    <span className="result-count">
                        <strong>{total}</strong> order{total !== 1 ? "s" : ""} found
                    </span>
                    <span className="filter-chip">{activeFilterLabel}</span>
                </div>

                <div className="table-scroll">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Pickup</th>
                                <th>Dropoff</th>
                                <th>Weight</th>
                                <th>Created</th>
                                <th>Updated</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="empty">
                                        <div className="empty-state">
                                            <span className="empty-icon" aria-hidden="true">📭</span>
                                            <p>No orders found</p>
                                            <span>Try adjusting your search or filter.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {orders.map((o) => (
                                <tr key={o.id} className={STATUS_CLASS[o.status]}>
                                    <td data-label="Customer">
                                        <div className="customer-cell">
                                            <span className="customer-avatar">{o.customerName.charAt(0).toUpperCase()}</span>
                                            <span className="customer-name">{o.customerName}</span>
                                        </div>
                                    </td>
                                    <td data-label="Pickup" className="addr-cell">{o.pickupAddress}</td>
                                    <td data-label="Dropoff" className="addr-cell">{o.dropoffAddress}</td>
                                    <td data-label="Weight"><span className="weight-cell">{o.packageWeight} kg</span></td>
                                    <td data-label="Created" className="date-cell">{new Date(o.createdAt).toLocaleDateString()}</td>
                                    <td data-label="Updated" className="date-cell">{new Date(o.updatedAt).toLocaleDateString()}</td>
                                    <td data-label="Status">
                                        <span className={`badge ${STATUS_CLASS[o.status]}`}>
                                            <span className="badge-dot" aria-hidden="true" />{o.status.replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td data-label="Actions" className="actions">
                                        <button className="btn-view" onClick={() => setShowDetails(o)}>View</button>
                                        <button className="btn-update" onClick={() => setShowStatus(o)}>Update</button>
                                        <button className="btn-delete" onClick={() => setShowDelete(o)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="table-footer">
                    <span className="page-info">Page {page} of {totalPages}</span>
                    <div className="pagination">
                        <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
                        <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
                    </div>
                </div>
            </div>

            {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadOrders(); }} />}
            {showDelete && <DeleteOrderModal order={showDelete} onClose={() => setShowDelete(null)} onDeleted={() => { setShowDelete(null); loadOrders(); }} />}
            {showDetails && <OrderDetailsModal order={showDetails} onClose={() => setShowDetails(null)} />}
            {showStatus && <StatusModal order={showStatus} onClose={() => setShowStatus(null)} onUpdated={() => { setShowStatus(null); loadOrders(); }} />}
        </div>
    );
}