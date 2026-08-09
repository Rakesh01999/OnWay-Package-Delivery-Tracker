import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

const TOKEN_KEY = "onway_token";

function decodeEmail(token: string): string {
    try {
        const payload = token.split(".")[1];
        const json = JSON.parse(atob(payload));
        return json.email ?? "";
    } catch {
        return "";
    }
}

export default function App() {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

    function handleLogin(t: string) {
        localStorage.setItem(TOKEN_KEY, t);
        setToken(t);
    }

    function handleLogout() {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
    }

    if (!token) return <Login onLogin={handleLogin} />;
    return <Dashboard email={decodeEmail(token)} onLogout={handleLogout} />;
}
