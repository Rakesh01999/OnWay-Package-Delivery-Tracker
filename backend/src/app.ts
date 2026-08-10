import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { authRoutes } from "./routes/auth";
import { orderRoutes } from "./routes/orders";
import { env } from "./config/env";
import { HttpError } from "./utils/errors";
import { connectDB } from "./db/connect";

function dbStatus(): "connected" | "connecting" | "disconnected" {
    switch (mongoose.connection.readyState) {
        case 1:
            return "connected";
        case 2:
            return "connecting";
        default:
            return "disconnected";
    }
}

function formatUptime(sec: number): string {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return `${h}h ${m}m ${s}s`;
}

function statusPageHtml(): string {
    const db = dbStatus();
    const dbOk = db === "connected";
    const now = new Date();
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OnWay API — Server Status</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: "Segoe UI", system-ui, -apple-system, "Inter", sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 16px;
            background: linear-gradient(160deg, #0f172a 0%, #1e1b4b 45%, #172554 100%);
            background-attachment: fixed;
            color: #0f172a;
        }
        .card {
            width: 100%;
            max-width: 540px;
            background: rgba(255, 255, 255, 0.97);
            border: 1px solid rgba(255, 255, 255, 0.4);
            border-radius: 22px;
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.5);
            padding: 36px 32px;
            text-align: center;
            animation: card-in 0.45s ease both;
        }
        @keyframes card-in {
            from { opacity: 0; transform: translateY(18px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .logo {
            width: 66px; height: 66px;
            margin: 0 auto 18px;
            border-radius: 19px;
            background: linear-gradient(135deg, #2563eb, #7c3aed);
            display: flex; align-items: center; justify-content: center;
            color: #fff;
            box-shadow: 0 12px 28px rgba(79, 70, 229, 0.45);
        }
        .logo svg { width: 32px; height: 32px; }
        h1 { font-size: 24px; letter-spacing: -0.4px; }
        .sub { color: #64748b; font-size: 14px; margin-top: 4px; }
        .status-pill {
            display: inline-flex; align-items: center; gap: 9px;
            margin: 20px 0 4px;
            padding: 9px 18px;
            border-radius: 999px;
            font-weight: 700;
            font-size: 14.5px;
            letter-spacing: 0.2px;
        }
        .status-pill .dot {
            width: 10px; height: 10px; border-radius: 50%;
        }
        .status-pill.online { background: #d1fae5; color: #047857; }
        .status-pill.online .dot {
            background: #10b981;
            animation: pulse 2s infinite;
        }
        .status-pill.warn { background: #fef3c7; color: #b45309; }
        .status-pill.warn .dot { background: #f59e0b; }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin: 20px 0 0;
            text-align: left;
        }
        .meta-item {
            background: linear-gradient(180deg, #f8fafc, #f1f5f9);
            border: 1px solid #e2e8f0;
            border-radius: 13px;
            padding: 12px 14px;
        }
        .meta-item.full { grid-column: 1 / -1; }
        .meta-item .label {
            font-size: 11px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.5px; color: #94a3b8; display: block; margin-bottom: 4px;
        }
        .meta-item .value { font-size: 14px; font-weight: 600; color: #334155; word-break: break-word; }
        .meta-item .value.ok { color: #047857; }
        .meta-item .value.bad { color: #b91c1c; }
        .endpoints { margin-top: 22px; text-align: left; }
        .endpoints h2 {
            font-size: 12px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 10px;
        }
        .ep {
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 12.5px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 9px;
            padding: 7px 11px;
            margin-bottom: 7px;
            color: #475569;
        }
        .ep b { color: #4f46e5; }
        .footer { margin-top: 24px; font-size: 12.5px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
                <path d="M3 8l9 5 9-5" />
                <path d="M12 13v8" />
            </svg>
        </div>
        <h1>OnWay Delivery Tracker</h1>
        <p class="sub">Backend API Server</p>

        <div class="status-pill ${dbOk ? "online" : "warn"}">
            <span class="dot"></span>
            ${dbOk ? "All systems operational" : `API up · Database ${db}`}
        </div>

        <div class="meta">
            <div class="meta-item">
                <span class="label">Server</span>
                <span class="value ok">Running</span>
            </div>
            <div class="meta-item">
                <span class="label">Database</span>
                <span class="value ${dbOk ? "ok" : "bad"}">${db}</span>
            </div>
            <div class="meta-item">
                <span class="label">Uptime</span>
                <span class="value">${formatUptime(process.uptime())}</span>
            </div>
            <div class="meta-item">
                <span class="label">Server Time</span>
                <span class="value">${now.toLocaleString()}</span>
            </div>
            <div class="meta-item full">
                <span class="label">Health Endpoint</span>
                <span class="value">GET /health</span>
            </div>
        </div>

        <div class="endpoints">
            <h2>API Endpoints</h2>
            <div class="ep"><b>GET</b> /health — server health check</div>
            <div class="ep"><b>POST</b> /auth/login — user authentication</div>
            <div class="ep"><b>GET / POST</b> /orders — list / create orders</div>
            <div class="ep"><b>GET</b> /orders/:id — order details</div>
            <div class="ep"><b>PATCH</b> /orders/:id/status — update status</div>
            <div class="ep"><b>DELETE</b> /orders/:id — delete order</div>
        </div>

        <div class="footer">OnWay Package Delivery Tracker · ${now.getFullYear()}</div>
    </div>
</body>
</html>`;
}

export function createApp(): Hono {
    const app = new Hono();

    app.use("*", logger());
    app.use(
        "*",
        cors({
            origin: env.CORS_ORIGIN,
            allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
            allowHeaders: ["Content-Type", "Authorization"],
        })
    );
    app.use("*", async (_c, next) => {
        await connectDB();
        await next();
    });

    app.get("/", (c) => c.html(statusPageHtml()));
    app.get("/api", (c) => c.html(statusPageHtml()));

    const healthHandler = (c: any) =>
        c.json({
            status: "ok",
            service: "onway-delivery-tracker-api",
            db: dbStatus(),
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });

    app.get("/health", healthHandler);
    app.get("/api/health", healthHandler);

    app.route("/auth", authRoutes);
    app.route("/api/auth", authRoutes);
    app.route("/orders", orderRoutes);
    app.route("/api/orders", orderRoutes);

    app.onError((err, c) => {
        console.error("[error]", err);

        if (err instanceof ZodError) {
            return c.json(
                {
                    error: {
                        message: "Validation failed",
                        details: err.errors.map((e) => ({
                            path: e.path.join("."),
                            message: e.message,
                        })),
                    },
                },
                400
            );
        }

        if (err instanceof HttpError) {
            return c.json(
                {
                    error: {
                        message: err.message,
                        ...(err.details ? { details: err.details } : {}),
                    },
                },
                err.status
            );
        }

        if (err instanceof mongoose.Error) {
            return c.json(
                {
                    error: {
                        message: "Database error",
                    },
                },
                500
            );
        }

        return c.json(
            {
                error: {
                    message: "Internal server error",
                },
            },
            500
        );
    });

    return app;
}