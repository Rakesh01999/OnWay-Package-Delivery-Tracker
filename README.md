# OnWay — Package Delivery Tracker

A lightweight, full-stack **package delivery tracking** application built with the exact stack used at Onway — **Hono.js + React + MongoDB** — and deployed on **Vercel** with HTTPS.

> **Live Demo:** https://on-way-package-delivery-tracker.vercel.app/
>
> **API Health:** https://on-way-package-delivery-tracker.vercel.app/api/health

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Live Deployment](#live-deployment)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Environment Variables](#environment-variables)
  - [Seeding the Database](#seeding-the-database)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Orders](#orders)
  - [Order Status Machine](#order-status-machine)
  - [Error Format](#error-format)
- [Frontend](#frontend)
- [Why This Stack?](#why-this-stack)
- [Architecture Decisions & Tradeoffs](#architecture-decisions--tradeoffs)
- [Deployment](#deployment)
  - [Vercel Setup](#vercel-setup)
  - [Configuration Files](#configuration-files)
- [Testing](#testing)
- [What I'd Improve With More Time](#what-id-improve-with-more-time)

---

## Overview

OnWay needs a lightweight **"Package Delivery Tracker"** module — a simplified version of the delivery workflow used across their platforms (`pickup → in transit → out for delivery → delivered`).

This project delivers that slice end-to-end:

- A **Hono.js REST API** with Zod validation, a fixed status state machine, and timestamped status history
- A **React + Vite dashboard** with a responsive table, status badges, filters, search, create/detail/delete modals, and JWT staff authentication
- A **MongoDB** data layer (Mongoose) with soft-delete support and indexed queries
- A production deployment on **Vercel** (single project — serverless backend + static frontend, auto-HTTPS)

---

## Features

### Backend (Hono.js)

- ✅ Full REST API — create, list (paginated), detail, status-update, soft-delete
- ✅ **Zod validation** via `@hono/zod-validator` — no manual `if`-chain validation
- ✅ **Centralized error handling** via `app.onError` with meaningful HTTP status codes
- ✅ **Fixed status state machine** — `pending → picked_up → in_transit → out_for_delivery → delivered` (+ `cancelled` from any pre-delivery state)
- ✅ **Status history** sub-schema — every transition is logged with a timestamp, never overwritten
- ✅ **JWT authentication** middleware (bonus) — only logged-in staff can update status
- ✅ **Soft delete** — orders are flagged with `deletedAt`, never hard-deleted
- ✅ **Search** by customer name / pickup / drop-off address
- ✅ Pagination (`page`, `limit`) + status filtering

### Frontend (React + Vite)

- ✅ Dashboard table with **color-coded status badges**
- ✅ **Filter by status** + **text search box**
- ✅ **Create order** form (modal)
- ✅ **Detail view** with a status-history **timeline**
- ✅ **Update status** modal (respects the state machine)
- ✅ **Delete confirmation** modal
- ✅ **Login page** with password visibility toggle and **one-click demo login**
- ✅ Graceful loading states and error banners
- ✅ Fully responsive — table collapses to stacked cards on mobile

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend framework | **Hono.js** | Required by the assessment — ultra-fast, edge-ready, first-class Vercel support |
| Runtime | **Node.js** | `@hono/node-server` for local dev, `hono/vercel` adapter for serverless |
| Frontend | **React 18 + Vite** | Required (React or Vue) — fast DX, SPA dashboard |
| Database | **MongoDB (Mongoose ODM)** | Chosen for flexibility — see [Why This Stack?](#why-this-stack) |
| Validation | **Zod** (`@hono/zod-validator`) | Schema-first validation shared between HTTP & types |
| Tests | **Vitest** | Unit tests for the state machine + integration tests for the API |
| Deployment | **Vercel** + **MongoDB Atlas** | Free tier, auto-HTTPS, serverless, no cold-start surfacing beyond ~300ms |

---

## Live Deployment

| Resource | URL |
|---|---|
| Frontend (Dashboard + Login) | https://on-way-package-delivery-tracker.vercel.app/ |
| API root (status dashboard) | https://on-way-package-delivery-tracker.vercel.app/api |
| Health check | https://on-way-package-delivery-tracker.vercel.app/api/health |

**Demo credentials** (auto-seeded on first database connect):

```
Email:    staff@onway.com
Password: password123
```

> The login page also has a **"Demo login"** button that fills and submits these credentials automatically.

---

## Project Structure

```
onway-package-delivery-tracker/
├── api/
│   └── index.ts                 # Vercel serverless entrypoint (Hono adapter)
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts           # Environment variable loading + validation
│   │   ├── db/
│   │   │   ├── connect.ts       # Mongoose connection (cached for serverless)
│   │   │   └── models/
│   │   │       ├── Order.ts     # Order + statusHistory schema, indexes
│   │   │       └── User.ts      # Staff user model
│   │   ├── middleware/
│   │   │   └── auth.ts          # JWT verification middleware
│   │   ├── routes/
│   │   │   ├── auth.ts          # POST /auth/login
│   │   │   └── orders.ts        # Order CRUD + status routes
│   │   ├── scripts/
│   │   │   └── seed.ts          # Seeds the staff user
│   │   ├── services/
│   │   │   └── orderService.ts  # Business logic (state machine, soft delete, search)
│   │   ├── state/
│   │   │   └── statusMachine.ts # Fixed transition table + canTransition()
│   │   ├── tests/
│   │   │   └── orders.test.ts   # API integration tests
│   │   ├── utils/
│   │   │   ├── errors.ts        # HttpError classes
│   │   │   └── validation.ts    # Zod error rethrow helper
│   │   ├── validators/
│   │   │   └── order.ts         # Zod schemas (create, update, list)
│   │   ├── app.ts               # Hono app factory (routes, CORS, onError)
│   │   ├── index.ts             # Local Node server bootstrap
│   │   └── dev.ts               # In-memory MongoDB dev server
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts        # Fetch wrapper + typed API client
│   │   │   └── types.ts         # Shared TypeScript types
│   │   ├── components/
│   │   │   ├── CreateOrderModal.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DeleteOrderModal.tsx
│   │   │   ├── Login.tsx        # With demo-login shortcut
│   │   │   ├── OrderDetailsModal.tsx
│   │   │   └── StatusModal.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig*.json
│   └── vite.config.ts           # Dev proxy: /api → localhost:3000
├── vercel.json                  # Frontend + backend services + rewrites
├── package.json                 # Root monorepo scripts
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+ (v20 recommended)
- **npm** v9+
- **MongoDB Atlas** cluster (free M0 tier works) — or a local MongoDB instance
- (Optional) **Vercel CLI** for deployment

### Local Development

```bash
# 1. Install dependencies (backend + frontend)
npm install --prefix backend
npm install --prefix frontend

# 2. Configure environment
cp backend/.env.example backend/.env
# → Edit backend/.env and paste your real MONGODB_URI + JWT_SECRET

# 3. Terminal A — start the backend (http://localhost:3000)
cd backend && npm run dev

# 4. Terminal B — start the frontend (http://localhost:5173)
cd frontend && npm run dev
```

Open **http://localhost:5173** — the Vite dev server proxies `/api/*` to the backend on port 3000.

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Local server port |
| `NODE_ENV` | No | `development` | Runtime environment |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string (`mongodb+srv://...`) |
| `JWT_SECRET` | **Yes** | — | Secret used to sign/verify JWTs |
| `JWT_EXPIRES_IN` | No | `1d` | Token lifetime |
| `CORS_ORIGIN` | No | `*` | Allowed frontend origin |
| `SEED_EMAIL` | No | `staff@onway.com` | Auto-seeded demo email |
| `SEED_PASSWORD` | No | `password123` | Auto-seeded demo password |

> **Note:** `backend/src/db/connect.ts` **auto-seeds the staff user** on first successful connection if no users exist — so you can log in immediately with the demo credentials.

### Seeding the Database

The staff user is auto-created on first database connect. To seed manually:

```bash
cd backend
npm run seed
```

---

## API Reference

Base URL (production): `https://on-way-package-delivery-tracker.vercel.app/api`

### Authentication

#### `POST /auth/login`

Authenticates a staff member and returns a JWT.

**Request:**

```json
{
  "email": "staff@onway.com",
  "password": "password123"
}
```

**Response `200 OK`:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:** `400` invalid credentials, `422` schema validation.

> The returned token must be sent as `Authorization: Bearer <token>` for `PATCH /orders/:id/status`.

### Orders

All order endpoints return a consistent `OrderRecord` shape:

```json
{
  "id": "66f06e5f0b0f8e1a2c3d4e5f",
  "customerName": "Jane Cooper",
  "pickupAddress": "12 Market St, Austin, TX",
  "dropoffAddress": "88 River Rd, Dallas, TX",
  "packageWeight": 4.2,
  "status": "in_transit",
  "statusHistory": [
    { "status": "pending", "timestamp": "2026-08-09T20:00:00.000Z" },
    { "status": "picked_up", "timestamp": "2026-08-09T21:15:00.000Z" },
    { "status": "in_transit", "timestamp": "2026-08-09T22:30:00.000Z" }
  ],
  "createdAt": "2026-08-09T20:00:00.000Z",
  "updatedAt": "2026-08-09T22:30:00.000Z"
}
```

#### `POST /orders` — Create an order

**Auth:** none required

**Request body:**

```json
{
  "customerName": "Jane Cooper",
  "pickupAddress": "12 Market St, Austin, TX",
  "dropoffAddress": "88 River Rd, Dallas, TX",
  "packageWeight": 4.2,
  "status": "pending"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `customerName` | string | ✅ | 1–120 chars |
| `pickupAddress` | string | ✅ | 1–500 chars |
| `dropoffAddress` | string | ✅ | 1–500 chars |
| `packageWeight` | number | ✅ | > 0, ≤ 100000 |
| `status` | enum | ❌ | Default `pending` |

**Response `201 Created`** — returns the full `OrderRecord`.

#### `GET /orders` — List orders

**Query parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | `1` | Page number (min 1) |
| `limit` | int | `20` | Page size (1–100) |
| `status` | enum | — | Filter by status |
| `search` | string | — | Case-insensitive match on customer name / pickup / drop-off |

**Example requests:**

```
GET /orders?page=1&limit=10
GET /orders?status=in_transit
GET /orders?search=jane&status=pending&page=2
```

**Response `200 OK`:**

```json
{
  "data": [ /* OrderRecord[] */ ],
  "total": 47,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

Soft-deleted orders are always excluded.

#### `GET /orders/:id` — Get single order

Returns the full order **including complete status history** (sorted oldest → newest).

**Errors:** `404` not found, `400` invalid ObjectId.

#### `PATCH /orders/:id/status` — Update status

**Auth:** ✅ **Bearer token required**

**Request body:**

```json
{
  "status": "in_transit"
}
```

**Behavior:**

- Validates the transition against the state machine
- Appends a **new timestamped entry** to `statusHistory` (never overwrites)
- Returns the updated `OrderRecord`

**Errors:** `401` missing/invalid token, `409` illegal transition, `404` order not found.

#### `DELETE /orders/:id` — Soft delete

Performs a **soft delete** — sets `deletedAt`, the document is retained and excluded from all list/detail queries.

**Response `204 No Content`.** **Errors:** `404` not found, `400` invalid ObjectId.

### Order Status Machine

```
pending ──▶ picked_up ──▶ in_transit ──▶ out_for_delivery ──▶ delivered
   │            │              │                 │
   └─────┬──────┴──────┬───────┴────────┬────────┘
         │             │                │
         ▼             ▼                ▼
      cancelled (allowed from any state BEFORE delivered)
```

| From | Allowed transitions |
|---|---|
| `pending` | `picked_up`, `cancelled` |
| `picked_up` | `in_transit`, `cancelled` |
| `in_transit` | `out_for_delivery`, `cancelled` |
| `out_for_delivery` | `delivered`, `cancelled` |
| `delivered` | *(terminal)* |
| `cancelled` | *(terminal)* |

Implementation lives in `backend/src/state/statusMachine.ts` and is unit-tested in `statusMachine.test.ts`.

### Error Format

All errors follow a consistent JSON shape:

```json
{
  "error": {
    "message": "Cannot move from \"pending\" to \"delivered\"",
    "details": [
      { "path": "customerName", "message": "Customer name is required" }
    ]
  }
}
```

| Status | Meaning |
|---|---|
| `400` | Bad request / invalid ObjectId |
| `401` | Missing or invalid JWT |
| `404` | Resource not found |
| `409` | Conflict (illegal status transition) |
| `422` | Zod schema validation failure |
| `500` | Database or unexpected error |

---

## Frontend

Built with **React 18 + Vite + TypeScript**, styled with a custom modern design system (gradient UI, glassmorphism cards, fully responsive).

| Route | Description |
|---|---|
| `/` (unauthenticated) | **Login** — email/password with show/hide toggle + one-click **"Demo login"** |
| `/` (authenticated) | **Dashboard** — hero, toolbar (search + status filter), orders table, pagination |
| Modals | Create order · View details (timeline) · Update status · Delete confirmation |

The API client (`frontend/src/api/client.ts`) uses relative `/api/...` paths, which work identically in local dev (Vite proxy) and in production (Vercel rewrite).

---

## Why This Stack?

### Why Hono.js?

Onway's real backend structure runs on **Hono.js**, and the assessment requires no substitutions. Hono brings:

- **Ultra-fast** request handling (edge-ready, ~14kB)
- First-class **TypeScript** support with typed contexts
- Clean **middleware** system (`app.use`, `app.onError`)
- Official **Vercel adapter** (`hono/vercel`) — the same app runs on `@hono/node-server` locally and as a serverless function in production without code changes

### Why MongoDB (vs MySQL/PostgreSQL)?

The requirements allow MySQL, PostgreSQL, or MongoDB. I chose **MongoDB + Mongoose**:

- **Flexible status history** — an embedded sub-array naturally models the one-to-many `statusHistory` relationship. Every transition is appended as a timestamped sub-document, no JOINs or migrations needed.
- **Schema evolution** — the delivery domain is simple and evolving; Mongo's flexible documents make iterating on fields (e.g. adding `deletedAt`, `note` fields) trivial.
- **Simplicity of a take-home** — single connection string, zero schema migration tooling.
- **Compound indexes** on `status + deletedAt` and `deletedAt + createdAt` keep filtered pagination fast even at scale.

**Trade-off acknowledged:** a relational DB (Postgres) would give stronger referential integrity and transactions. For this workflow — an order owns its history and is never hard-deleted — the embedded document model is a better fit.

---

## Architecture Decisions & Tradeoffs

| Decision | Rationale |
|---|---|
| **State machine centralized in one module** | Single source of truth for transitions → unit-testable, reusable server-side, and mirrored in the UI (only valid transitions shown) |
| **Status history appended, never overwritten** | Meets the requirement "log a timestamped status history entry, not just overwrite" — full audit trail per order |
| **Soft delete via `deletedAt` flag** | Requirement is "cancel, not hard delete" — orders remain for audit/traceability but are excluded from all active queries |
| **`app.onError` centralized handler** | Consistent JSON error shape + correct HTTP status codes for Zod, HttpError, and Mongoose errors — no scattered try/catch |
| **Zod validation with `zValidator`** | Declarative schemas shared with TypeScript types; rejects bad input before it reaches business logic |
| **Service layer between routes and models** | Routes stay thin; business logic (transitions, search escaping, pagination) is unit-testable in isolation |
| **Serverless connection caching in `connectDB`** | `readyState >= 1` check + shared `connectionPromise` prevents Mongoose from opening duplicate connections on Vercel cold/warm starts |
| **Single Vercel project (monorepo)** | Same-origin `/api` calls → zero CORS config in production, one project to manage, free HTTPS |
| **Relative `/api` paths on the frontend** | Works through the Vite dev proxy locally and Vercel rewrites in production — no per-environment URL config |

---

## Deployment

### Vercel Setup

This repo is configured as a **single Vercel project** serving both the static frontend and the serverless backend:

1. Push the repo to GitHub
2. In Vercel: **New Project → Import GitHub repo**
3. The root `vercel.json` automatically configures both services
4. Add **Environment Variables** (Settings → Environment):

```
MONGODB_URI = mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority
JWT_SECRET  = <long-random-secret>
CORS_ORIGIN = *
```

5. **Deploy** — Vercel builds the frontend (`frontend/`) and compiles the Hono backend as a serverless function at `/api`

### Configuration Files

**`vercel.json`** — declares the two services and routes:

- `/api/*` → backend service (Hono serverless function)
- `/*` → frontend service (Vite static build)

**`api/index.ts`** — serverless entrypoint:

```ts
import { handle } from "hono/vercel";
import { createApp } from "../backend/src/app";

const app = createApp();
export const config = { runtime: "nodejs" };
export default handle(app);
```

**Root `package.json`** — monorepo convenience scripts:

| Script | Description |
|---|---|
| `npm run dev:backend` | Start Hono API (tsx watch) |
| `npm run dev:frontend` | Start Vite dev server |
| `npm run build:backend` | Compile backend to `dist/` |
| `npm run build:frontend` | Typecheck + build Vite app |
| `npm run build` | Build both |
| `npm run test` | Run backend test suite (Vitest) |
| `npm run typecheck` | Full typecheck across backend + frontend |

---

## Testing

The backend ships a Vitest suite covering:

- **Unit tests** — the status state machine (`statusMachine.test.ts`): valid transitions, illegal transitions, terminal states, unknown statuses
- **Integration tests** (`tests/orders.test.ts`) — full CRUD via `app.request()` with an in-memory MongoDB: create, list + pagination, filter, search, status transitions, soft delete, auth guard

```bash
# Run all backend tests
cd backend && npm test

# Run the state-machine unit tests only
cd backend && npx vitest run src/state/statusMachine.test.ts

# Typecheck everything
npm run typecheck
```

> There is also an optional in-memory dev server: `cd backend && npm run dev` (uses `src/dev.ts` with `mongodb-memory-server`) for zero-setup local testing.

---

## What I'd Improve With More Time

- **Rate limiting** on `/auth/login` to prevent brute-force attempts
- **Refresh tokens + token revocation** for a more complete auth flow
- **Email notifications** on status changes (webhooks / provider integration)
- **Real-time updates** via WebSockets or SSE so the dashboard updates live as couriers progress orders
- **Redis caching** for hot `GET /orders` queries
- **CI pipeline** (GitHub Actions) running typecheck + tests on every push
- **Monitoring & logging** — structured logs (pino), error tracking (Sentry), uptime alerts
- Let the courier-facing bonus feature go mobile with **React Native**

---

## License

This project was created as a technical assessment submission for the **Onway Full-Stack Software Engineer** role.

**Author:** Rakesh Biswas — Full-Stack Software Engineer candidate
