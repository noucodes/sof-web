---
target: Held-to dates table
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-09-30T03-29-13Z
slug: components-heldtochanges-tsx
---
⚠️ DEGRADED: single-context (sub-agents not requested by user); no browser pass (no dev server, backend DB unreachable)

Target: components/HeldToChanges.tsx vs InvoicedOutsideShipStation, ShipStationTable, OrdersTable. Score 26/40 (Acceptable).

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of status | 3 | No "last loaded" time; webhook health invisible |
| 2 | Match real world | 3 | "FW", "Held-to" fine for staff; "No hold needed" vague |
| 3 | User control | 3 | n/a |
| 4 | Consistency | 2 | No sortable headers, no row hover, local-time vs Sydney time, sr-only vs visible Actions header |
| 5 | Error prevention | 3 | Retry guarded to newest change |
| 6 | Recognition | 2 | Strikethrough shows ORIGINAL date (dateDelivReqdOrig), not previous; one order spans many rows |
| 7 | Flexibility | 2 | No store filter, search or sort |
| 8 | Minimalist | 3 | Superseded failures still red |
| 9 | Error recovery | 3 | Inline error + Retry |
| 10 | Help | 2 | Empty state can't tell "nothing changed" from "webhook not set up" |

Priority issues
- [P1] "old → new" date is actually original → new (dateDelivReqdOrig). Misleading after 2nd change. Fix: previous = prior logged row for same numTran; fall back to "Originally dd/mm".
- [P1] Superseded failures render as red Failed pill. Fix: muted "Superseded" pill, keep error text muted.
- [P2] Consistency with sibling tables: SortableTh + useClientSort, hover:bg-surface-hover, Sydney timezone, same Actions header treatment.
- [P2] Event log, not state: warehouse asks "when can I pick #1234?". Consider latest-per-order view with history expander, or at minimum an order search.
- [P2] a11y: Retry buttons need per-row aria-label; arrow icon aria-label on bare svg is unreliable, use sr-only "changed from X to Y".
- [P3] Empty state should say what triggers rows / that the Frameworks webhook must be registered.
