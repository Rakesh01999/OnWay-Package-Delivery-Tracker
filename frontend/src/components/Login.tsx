import { useState, type FormEvent } from "react";
import { api, ApiError } from "../api/client";

const DEMO_EMAIL = "staff@onway.com";
const DEMO_PASSWORD = "password123";

interface Props {
    onLogin: (token: string) => void;
}

export default function Login({ onLogin }: Props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await api.login(email, password);
            onLogin(res.token);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    }

    async function handleDemoLogin() {
        setEmail(DEMO_EMAIL);
        setPassword(DEMO_PASSWORD);
        setError("");
        setLoading(true);
        try {
            const res = await api.login(DEMO_EMAIL, DEMO_PASSWORD);
            onLogin(res.token);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Demo login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-wrap">
            <div className="auth-decoration" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
                    <path d="M3 8l9 5 9-5" />
                    <path d="M12 13v8" />
                </svg>
            </div>
            <form className="auth-card" onSubmit={handleSubmit}>
                <div className="auth-brand">
                    <h1>OnWay</h1>
                    <p className="subtitle">Package Delivery Tracker</p>
                </div>

                <div className="auth-fields">
                    <label>
                        <span className="field-label">Email</span>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="you@company.com" />
                    </label>
                    <label>
                        <span className="field-label">Password</span>
                        <div className="input-with-toggle">
                            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="input-toggle-pad" />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword((s) => !s)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                                        <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
                                        <path d="M1 1l22 22" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </label>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <button type="submit" className="primary auth-submit" disabled={loading}>
                    {loading ? (
                        <span className="btn-spinner" aria-hidden="true" />
                    ) : (
                        "Sign in"
                    )}
                </button>

                <div className="demo-divider" aria-hidden="true">
                    <span>or</span>
                </div>

                <button type="button" className="demo-login-btn" onClick={handleDemoLogin} disabled={loading}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    {loading ? "Signing in…" : "Demo login"}
                </button>
                <p className="demo-hint">
                    Demo account — <code>staff@onway.com</code> / <code>password123</code>
                </p>
            </form>
            <div className="auth-card-footer">
                <p>© {new Date().getFullYear()} OnWay Logistics</p>
            </div>
        </div>
    );
}