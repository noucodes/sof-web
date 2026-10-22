# Burdens SOF — System Overview

Cross-repo reference for the **SOF-\*** stack (Shopify Order Fulfilment) plus the
integrations that hang off it: **B2B price sync**, **health monitoring**, the
legacy connector **sof-main**, and the LAN **sof-bridge**.

Companion diagram: [`sof-system-dfd.excalidraw`](./sof-system-dfd.excalidraw)
(open at [excalidraw.com](https://excalidraw.com) → *Open*).
Deeper restructure notes: [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

---

## 1. What the system does

Shopify orders from four stores (`burdens`, `bathroomhq`, `plumbershq`, `aspire`)
have to land in the **Frameworks ERP**, which lives on the office LAN and is not
reachable from the internet. The stack:

1. **receives** Shopify `orders/create` webhooks in the cloud,
2. **transforms** them to Frameworks' sales-order shape,
3. **forwards** them over a secured tunnel to a LAN service that talks to the ERP,
4. **tracks** each order's state (pending / success / failed) and lets staff
   retry, reconcile prices, and check margin,
5. **fans out** side effects: ShipStation label → ERP order release, customer
   payment posting, B2B trade-price sync, and Discord/Teams/email alerts.

Two connectors implement steps 1–3 against **one shared Postgres `orders`
database**: **sof-main** (legacy, handles all live traffic) and **sof-api** (the
in-progress replacement). **sof-web** is the staff dashboard and talks only to
sof-api.

---

## 2. System map

```
                          ┌───────────── cloud (EC2) ─────────────┐        LAN (office)
 Shopify ─webhook────────▶ │  sof-main  (legacy Express)  ─┐       │
 ShipStation ─webhook────▶ │  sof-api   (NestJS, target)  ─┼──────▶│  sof-bridge ──▶ Frameworks ERP
 Staff browser ──────────▶ │  sof-web   (Next.js) ──▶ sof-api      │       ▲
                          │        │        │                     │       │
                          │        └──┬─────┘  shared Postgres     │  b2b-push ──▶ Shopify Admin API
                          │           ▼        "orders" DB         │       │        (B2B price list)
                          └───────────────────────────────────────┘       ▼
 burdens-health ─poll /health──▶ (all services)              Catsy PIM ──▶ b2b-push
 Alerts ◀── Discord / Teams / Email ── sof-main, sof-api, b2b-push, burdens-health
```

---

## 3. The repos

### 3.1 `sof-web` — staff dashboard (Next.js)

| | |
|---|---|
| **Who** | Warehouse & office staff at Burdens (non-technical). |
| **How they use it** | Log in, watch the order queue, retry failures, run a manual sync, reconcile Frameworks vs Shopify prices, check per-order margin (GP), view the ShipStation job queue and B2B price-sync status, and (admins) manage users. |
| **Talks to** | `sof-api` only, via `app/api/*` proxy routes. No database of its own. |
| **Auth** | JWT in an httpOnly cookie; `lib/serverFetch.ts::proxyJson` forwards the cookie and does a silent one-shot refresh on 401. |

**Pages** (`app/*`, nav order = `components/Sidebar.tsx`):

| Route | Purpose | sof-api calls |
|---|---|---|
| `/dashboard` | Metrics + recent-activity feed | `GET /metrics`, `GET /metrics/activity` |
| `/orders` | Queue: filter/search/paginate, retry one, retry-all-failed, manual sync, view payloads | `GET /orders`, `POST /orders/:id/retry`, `POST /orders/retry-failed`, `POST /sync`, `GET /orders/:id`, `GET /orders/:id/compare` |
| `/payments` | Frameworks-vs-Shopify price reconciliation | `GET /orders`, `POST /orders/:id/fetch-price` |
| `/contribution` | Per-order contribution margin + **GP %** column, low-GP badge, CSV/JSON export, "verify all" | `GET /orders/contribution`, `GET /orders/contribution/export`, `POST /orders/contribution/verify-all`, `POST /orders/:id/fetch-price` |
| `/shipstation` | Label-job queue, filter by status | `GET /jobs` |
| `/b2b-sync` | Last B2B price-push outcome (from b2b-push) | `GET /api/b2b-sync/status` |
| `/inventory` | Placeholder — hard-coded feature list, no backend yet | — |
| `/admin/users` | User CRUD (viewer / admin) | `GET/POST/PATCH/DELETE /users` |
| `/login` | Auth | `POST /auth/login`, `POST /auth/logout` |

**Proxy routes** (`app/api/*/route.ts`): `jobs`, `login`, `logout`,
`orders/contribution`(+`/export`,`/verify-all`), `orders/retry-failed`,
`orders/[id]`(+`/compare`,`/fetch-price`,`/retry`), `sync`, `users`(+`/[id]`).
Each is a thin `proxyJson` / `proxyFile` forward.

---

### 3.2 `sof-api` — target connector + dashboard API (NestJS + Prisma)

| | |
|---|---|
| **Who** | Machines: Shopify webhooks, ShipStation webhooks, `sof-bridge`, `b2b-push`, `burdens-health`, and `sof-web`. No humans directly. |
| **Role** | The intended single replacement for sof-main. Ingests orders, drives the bridge, persists state to the shared Postgres, and serves every read/write the dashboard needs. **Not yet at feature parity** — see `ARCHITECTURE.md §3`. |
| **Auth** | Global `JwtAuthGuard`; routes are private unless `@Public()`. Webhook routes are `@Public()` but each checks its own shared secret (Shopify HMAC, Flow secret, ShipStation secret, bridge secret, B2B token). |
| **Port / prefix** | `PORT` (default 3000); some controllers are mounted under `api/*`. |

**HTTP endpoints** (controller → routes):

| Controller | Routes |
|---|---|
| `auth` | `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| `webhooks` | `POST /webhooks/:store/orders-create` (HMAC), `POST /webhooks/:store/customers-update` (Flow secret → B2B approval), `POST /webhooks/shipstation/label-printed` (secret), `POST /webhooks/inventory` (bridge secret) |
| `orders` | `GET /orders`, `GET /orders/:id`, `GET /orders/:id/contribution`, `GET /orders/contribution`, `GET /orders/contribution/export`, `POST /orders/contribution/verify-all`, `POST /orders/:id/retry`, `POST /orders/retry-failed`, `POST /orders/:id/fetch-price` |
| `sync` | `POST /sync` (pull orders straight from each store's Shopify Admin REST API) |
| `jobs` | `GET /jobs` (ShipStation label-job queue) |
| `metrics` | `GET /metrics`, `GET /metrics/activity` |
| `audit` | `GET /audit` |
| `users` | `GET /users`, `POST /users`, `PATCH /users/:id` |
| `b2b-sync` | `POST /api/b2b-sync/status` (Bearer token — from b2b-push), `GET /api/b2b-sync/status` (JWT — for sof-web) |
| `health` | `GET /health` (public — polled by burdens-health) |

**Key service functions:**

| Service | Functions |
|---|---|
| `WebhooksService` | `enqueueOrder`, `drain`, `processOrder`, `fetchAndStoreFrameworksPrice`, `alertLowGp` *(new — Discord ping when order GP % < 10)*, `autoVerifyContributions` (hourly cron), `runContributionSweep`, `verifyRemainingContributions`, `refetchFrameworksPrice`, `enqueueShipstationShipments`, `pushInventoryToShipstation` |
| `BridgeClientService` | `pushToErp`, `sendPayment` *(wired, currently dead)*, `releaseOrder`, `getSalesOrderDetails` |
| `OrderTransformService` | `buildFrameworksPayload`, `enrichWithSupplierSku`, `mapCustomer` |
| `CustomerApprovalService` | `handleCustomersUpdate`, `addLocationToMarket` (B2B: assign company/location/role via Shopify Admin, roll over on location cap) |
| `OrdersService` | `findAll`, `findOne`, `retry`, `retryFailed`, `getContribution`, `getContributionBulk`, `getContributionExport` |
| `ContributionUtil` | `calculateContribution` → net sales (ex GST), COGS, freight, payment fees, contribution, **`gpPercent`**; `GP_ALERT_THRESHOLD = 10` |
| `SyncService` | `pullOrders`, `pullStore` |
| `MetricsService` | `getMetrics`, `getActivity`, `probeBridge` |
| `AuthService` | `validateCredentials`, `login`, `refresh`, `logout`, `generateTokens` |
| `B2bSyncService` | `recordStatus`, `getStatus` |
| `AuditService` | `findAll`, `log` |
| `UsersService` | `findAll`, `create`, `update` |

---

### 3.3 `sof-bridge` — LAN → ERP gateway (Express, Windows service)

| | |
|---|---|
| **Who** | `sof-main` and `sof-api` (server-to-server, shared `BRIDGE_SECRET`). |
| **Role** | The only thing that talks to Frameworks ERP (`192.168.5.138:9200`). Runs on the office Windows box, exposed to the cloud through a Cloudflare tunnel. Holds the Frameworks session and refreshes it. Out of scope for retirement. |

**Routes** (`routes/bridge.js`):

| Route | Controller fn | ERP call |
|---|---|---|
| `GET /health`, `GET /` | `health`, `info` | — |
| `POST /push-to-erp` | `pushToErp` | `createSalesOrder` |
| `POST /payment` | `createPayment` | `createCustomerPayment` |
| `POST /release-order` | `releaseOrder` | `releaseOrder(numTran, suffixTran)` |
| `GET /lookup-order` | `lookupOrder` | `lookupOrderByCustomerRef` |
| `GET /salesorder-details` | `salesorderDetails` | `getSalesOrderDetails` (net-ex-GST, COGS, lines) |
| `GET /inventory` | `getInventory` | `getInventoryTotals(branchIds)` |

`FrameworksService` functions: `login`, `validateSession`, `ensureValidSession`,
`createSalesOrder`, `createCustomerPayment`, `releaseOrder`,
`lookupOrderByCustomerRef`, `getSalesOrderDetails`, `getProductPage`,
`getInventoryTotals`.

**`push-inventory.js`** (scheduled, LAN-side): totals stock across branches with
no request-time limit, then `POST`s the batched result to
`sof-api /webhooks/inventory` — sof-api relays each SKU to ShipStation. Done this
way because a synchronous pull from the cloud would hit the tunnel timeout on a
~150k-SKU catalog.

---

### 3.4 `sof-main` — legacy connector (Express + SQLite/Postgres + node-cron)

| | |
|---|---|
| **Who** | Shopify + ShipStation webhooks (live), and the legacy **burdens-sync** dashboard via its `/api/*`. |
| **Role** | The original EC2 connector. **Still serves 100 % of live order traffic.** Feature-complete: everything sof-api is still catching up on lives here. |
| **Retirement** | Draft 6-phase plan in `sof-api/docs/retire-sof-main-plan.md` (not started). |

**Routes:**

- `webhook.js`: `POST /webhooks/:store/orders-create`, `POST /webhooks/shipstation/label-printed`
- `api.js` (for burdens-sync): `GET /metrics`, `GET /activity`, `GET /orders`, `GET /orders/:id`, `POST /orders/:id/retry`, `POST /orders/retry-failed`, `GET /shipstation/jobs`, `POST /sync`, `GET /audit`
- `server.js`: `GET /health`, `GET /health/deep`

**Services:** `transform.service` (`processOrder`, `buildFrameworksPayload`,
`enrichWithSupplierSku`, `postToBridge`, `lookupExistingOrder`,
`extractInvalidProducts`, `mapCustomer`), `payment.service`
(`fetchSalesOrderDetails`, `getFrameworksOrderTotal`, `createPayment`,
`testConfiguration`), `shipstation.service` (`enqueueShipStationShipments`,
`drainShipStationLabelJobs`, `processLabelPrinted`, `lookupOrderInFrameworks`,
`executeRelease`, `releaseOrder`), `order-puller.service` (`fetchOrders`,
`pullStore`, `pullOrders`), `sync-checker.service` (`checkStore`, `checkSync`),
`price-check.service` (`recheckFrameworksPrices`), `order.queue` (`enqueue`).

**Cron** (`scheduler.js`): order-drain fallback every 1 min; price recheck every
15 min.

**Alerting** (`src/logger/`): `discord.service`, `teams.service`,
`email.service` — order failures, scheduler failures, invalid-SKU emails. This is
the alerting sof-api still needs to port.

---

## 4. Integrations

### 4.1 B2B price sync — `b2b-push`

| | |
|---|---|
| **Who** | Runs unattended on a systemd timer (scheduled) or by hand (`--source csv`, `--dry-run`). |
| **Flow** | (1) load rows — from Catsy PIM (`GET /api/v3/queries/:id/items`, paginated) or a CSV; (2) `resolveVariantIds` — map SKU → Shopify variant, 25/query; (3) `pushPrices` — `priceListFixedPricesAdd` mutations into the **B2B** price list, batched; (4) *(Catsy runs only)* `postSyncStatus` → `sof-api POST /api/b2b-sync/status` (Bearer) and `sendDiscordMessage` run summary. Steps 4 are best-effort. |
| **Functions** | `fetchCatsyProducts`, `shopifyGraphql`, `resolveVariantIds`, `pushPrices`, `chunk`, `parseArgs`, `main`, `postSyncStatus`, `sendDiscordMessage`. |
| **Seen by staff** | sof-web `/b2b-sync` reads the recorded status via sof-api. |

There is a **second** B2B path: sof-api's `CustomerApprovalService` handles
Shopify `customers/update` (Flow-triggered) to place approved trade customers into
the right company / location / role so they *see* B2B pricing. `b2b-push` sets the
prices; `customers-update` grants access.

### 4.2 Health monitoring — `burdens-health`

| | |
|---|---|
| **Who** | Standalone node-cron service (systemd). Config: `integrations/config.json` (name + `/health` URL per service; currently the Orders API is enabled). |
| **Flow** | `performHealthCheck` every 3 min; `notify` → `sendDiscordMessage` / `sendTeamsMessage` on any state change (down / recovered); `sendHealthyStatus` digest every 4 h. |
| **Watches** | `sof-api /health` (and any other service added to the config). |

### 4.3 sof-main & sof-bridge

Covered as repos in §3.3 / §3.4 — they *are* the ERP integration. sof-bridge is
the permanent LAN adapter; sof-main is the connector being replaced by sof-api.

### 4.4 Legacy: `burdens-sync` + `burdens-sync-api`

An older dashboard (`burdens-sync`, Next.js) and Go/Gin API
(`burdens-sync-api`, JWT auth, `POST /api/v1/auth/*`, `GET/PUT /api/v1/profile`,
`GET /health`). `burdens-sync` reads `sof-main /api/*`. Superseded by
`sof-web` + `sof-api`; shown dashed on the diagram.

---

## 5. How a unit of work moves

**New order:** Shopify → `orders-create` webhook → connector returns `200`
immediately, enqueues → `drain` → `processOrder` builds the Frameworks payload
(`buildFrameworksPayload` + `enrichWithSupplierSku`) → `sof-bridge /push-to-erp`
→ `createSalesOrder` → order row updated (`orderNo`, status) → async
`fetchAndStoreFrameworksPrice` pulls `salesorder-details` for net-ex-GST / COGS
→ `calculateContribution` persists margin; **GP % < 10 → `alertLowGp` → Discord**.
Unsettled contribution is retried hourly (`autoVerifyContributions`) or by the
dashboard's "verify all".

**Label printed:** ShipStation → `label-printed` webhook → fetch shipment detail
→ `enqueueShipstationShipments` → `drain` → look the order up in Frameworks →
`sof-bridge /release-order` → `releaseOrder`.

**Payment:** (sof-main today) `payment.service.createPayment` →
`sof-bridge /payment` → `createCustomerPayment`. (sof-api: `sendPayment` exists
but is not yet wired.)

**Inventory:** `sof-bridge/push-inventory.js` totals branch stock LAN-side →
`sof-api POST /webhooks/inventory` → `pushInventoryToShipstation` → ShipStation
v2 `inventory adjust` per SKU.

**B2B prices:** Catsy → `b2b-push` → Shopify `priceListFixedPricesAdd` →
`b2b-push` → `sof-api /api/b2b-sync/status` → sof-web `/b2b-sync`.

**Staff action:** browser → sof-web page (server component) → `app/api/*` proxy
→ sof-api → Postgres. Writes (`retry`, `sync`, `fetch-price`, user CRUD) are
audited (`AuditService.log`).

---

## 6. Known seams

- **Schema drift** — sof-main and sof-api share one Postgres but own separate,
  unsynced migrations. `prisma migrate` against the current schema could drop
  columns sof-main needs. Reconcile (`prisma db pull`) before any migration.
- **`GET /orders/:id/compare`** — sof-web calls it; sof-api hasn't implemented
  it. Live gap.
- **sof-api alerting** — only the new low-GP Discord ping exists; order-failure /
  scheduler / email alerting still lives only in sof-main.
- **`/inventory` page** — placeholder, no backend contract.
- **`sendPayment`** — present in sof-api, not called.
