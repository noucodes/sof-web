# Burdens SOF — architecture & restructure notes

Context doc for re-architecting the backend DB and restructuring `sof-web`'s pages together. Covers all 4 repos; this file lives in `sof-web` but is the cross-repo reference.

## 1. System map

```
Shopify ──webhook──▶ sof-main (legacy, Express)  ─┐
                     sof-api  (target, NestJS)    ─┼──▶ sof-bridge ──▶ Frameworks ERP (LAN)
                                                    │
                     both read/write            ──┘
                     the same Postgres "orders" DB
sof-web (this repo, Next.js) ──▶ talks only to sof-api, via app/api/* proxy routes
```

- **sof-web** — pure frontend. No DB code. Every `app/api/*` route handler forwards to sof-api via `lib/serverFetch.ts::proxyJson`, which also handles silent access-token refresh on 401.
- **sof-main** — original connector. Raw SQL migrations (`src/db/migrations/001-004`), SQLite(dev)/Postgres(prod), cron drain, ShipStation, payments, Discord/Teams/email alerts. Also exposes a `/api/*` management API (added 2026-06-12) consumed by a separate dashboard, **burdens-sync**.
- **sof-api** — target replacement. NestJS + Prisma, JWT auth. **Not yet at feature parity** with sof-main (see §3).
- **sof-bridge** — LAN-side Express service that actually calls Frameworks ERP. Used by both sof-main and sof-api. Out of scope for retirement.

## 2. Live DB — schema drift risk

sof-main and sof-api share **one physical Postgres database** but own separate, unsynced migration systems. Confirmed drift (live DB has these, `sof-api/prisma/schema.prisma` is missing them):

| Table | Live reality (sof-main SQL) | sof-api's Prisma model |
|---|---|---|
| `orders` | has `last_bridge_error`, `updated_at`, JSONB columns, status CHECK constraint | missing `updated_at`, `last_bridge_error` |
| `shipstation_label_jobs` | FK `order_id → orders.id` | FK missing from schema |
| `audit_log` | FK `user_id → users.id` (migration 004) | FK/`updated_at` not reflected |

**Risk:** `prisma migrate dev` / `db push` against the current schema could try to drop columns sof-main depends on in prod. Nothing else should happen before this is reconciled (`prisma db pull` + manual reconciliation — Phase 0 below).

## 3. Draft retirement plan (already written: `sof-api/docs/retire-sof-main-plan.md`, status: draft, not executed)

Source design: `sof-main/docs/erd-separation-of-concerns.excalidraw`. Additive-before-destructive throughout.

| Phase | What happens | Rollback |
|---|---|---|
| **0 — make ground safe** | `prisma db pull` to reconcile schema vs. live DB, baseline migration history, full backup, staging copy | nothing deployed yet |
| **1 — feature parity** (staging) | Wire `BridgeClientService.sendPayment` (currently dead code), port Discord/Teams/Resend alerting, BHQ SKU metafield enrichment, ShipStation label→release-order call, duplicate-push protection, implement `GET /orders/:id/compare` (**sof-web already calls this — live gap today**) | undeployed branch, sof-main still serves 100% traffic |
| **2 — shadow-run** | Per-store dry-run flag + second Shopify webhook subscription so sof-api processes every order without real writes; diff against sof-main | delete the 2nd webhook subscription |
| **3 — schema normalization (expand only)** | Additively create `order_erp_sync`, `order_payment`, `order_invoice` per the ERD; sof-api dual-writes old flat columns + new tables; sof-main untouched | drop the 3 new tables |
| **4 — live cutover, one store at a time** | bathroomhq → plumbershq → burdens: flip dry-run off, repoint that store's Shopify webhook | repoint webhook back |
| **5 — soft decommission** | Stop sof-main's systemd service + cron drain, don't uninstall | `systemctl start sof-main` |
| **6 — hard retirement + schema contract** | Revoke sof-bridge creds, archive sof-main repo, **drop legacy flat columns** (`payment_payload`, `invoice_status`, `invoice_error`, `user_email`, etc.) now that normalized tables are sole source of truth | none — point of no return, last step |

Open questions before Phase 0: confirm single-Postgres topology, agree burn-in/cooling-off durations, who owns Shopify webhook re-pointing.

Adjacent ideas not yet in the plan (`sof-main/docs/FEATURE-SUGGESTIONS.md`): dead-letter/replay, idempotency keys on webhook IDs, `/metrics` endpoint, configurable drain/backoff, release guardrails, end-to-end audit export.

## 4. sof-web — current pages

All pages are server components under `app/`, wrapped in `<AppShell>` + `<Sidebar>`. Sidebar nav order = table order below (`components/Sidebar.tsx`).

| Route | Purpose | Backend calls (via sof-api) | Key components |
|---|---|---|---|
| `/dashboard` | Metrics + recent activity feed | `GET /metrics`, `GET /metrics/activity?limit=10` | — |
| `/orders` | Order queue: filter/search/paginate, retry failed, manual sync, view payloads | `GET /orders`, `POST /orders/:id/retry`, `POST /orders/retry-failed`, `POST /sync`, `GET /orders/:id`, `GET /orders/:id/compare` (gap — not implemented in sof-api yet) | `OrderFilters`, `OrdersTable`, `RetryFailedButton`, `SyncTrigger`, `SyncModal` |
| `/payments` | Accounts reconciliation: Frameworks vs Shopify price per order | `GET /orders` (same endpoint as Orders page), `POST /orders/:id/fetch-price` | `FetchPriceButton` |
| `/inventory` | Static "planned features" list — **not wired to any backend yet** | none (hardcoded `FEATURES` array) | — |
| `/shipstation` | ShipStation label job queue, filter by status | `GET /jobs` | — |
| `/admin/users` | User CRUD (viewer/admin roles) | `GET /users`, `POST/PATCH/DELETE /users/:id` | `UsersClient` |
| `/login` | Auth | `POST /auth/login`, `POST /auth/logout` | — |
| `/` | Redirects to `/dashboard` | — | — |

Notable overlaps worth considering when restructuring:
- **Orders and Payments both fetch `/orders`** independently with near-identical pagination logic — candidate for a shared data-fetching layer if pages get restructured.
- **Inventory page is 100% placeholder** — no backend contract exists yet; restructuring here is free (no live consumer to break).
- **`/orders/:id/compare`** is called by sof-web but doesn't exist in sof-api yet (Phase 1 gap) — any orders-page restructuring should account for this endpoint landing later, not assume it works today.
- Page-level data shapes are currently flat (mirroring the flat `orders` table). If Phase 3's `order_erp_sync` / `order_payment` / `order_invoice` split ships, Orders/Payments pages are the natural place to split into tabs or separate sub-views that mirror the new normalized boundaries.
