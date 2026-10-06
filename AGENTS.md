<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Versioning and changelog

The portal is versioned, and users read what changed at `/changelog` (linked from the sidebar as `vX.Y.Z · What's new`).

Every commit that changes something a user can see or do must, in the same commit:

1. Add an entry at the **top** of `CHANGELOG` in `lib/changelog.ts` (or extend the top entry if it's the same day's unreleased work).
2. Bump the version with semver:
   - **minor** (1.13.0 → 1.14.0): a new page, feature, column, filter, export or button.
   - **patch** (1.13.0 → 1.13.1): a bug fix or small wording/layout tweak.
   - **major**: only when the user asks.
3. Set `"version"` in `package.json` to the same number.

Write entries for warehouse and office staff, not developers: what they can now do, in plain words ("Copy just the SKUs from the SKU audit"), not how it was built. Sort lines under `added` / `improved` / `fixed`. Dates are `YYYY-MM-DD` in Sydney time.

Skip the changelog for changes nobody using the site would notice: refactors, docs, build config, dependency bumps.

# User activity log

`components/PageViewTracker.tsx` (in `AppShell`) records every page a signed-in user opens, and sof-api's `LoggingInterceptor` records every non-GET call they make. Both write to `audit_log` (`page_view` / `request` rows), which shows up in Admin › User activity and on the dashboard. When you add a new page, add its path segment to `PAGES` in `lib/activity.ts`. When you add a sof-api action, add its `Controller.method` to `ACTIONS` there so the log reads in plain English.

The interceptor also stores the page the button was pressed on (`x-sof-page`, added by `lib/serverFetch.ts` from the Referer), the request body with secrets hidden, a small response, and the order/job an `/:id` refers to. When an action changes something whose *before* matters (like a user's role), the handler sets `req.activity = { target, changes: { field: [from, to] } }` and the log shows it. Do that for any new edit-style endpoint.

# Roles

Three roles: **admin** (everything, plus Users and User activity), **operator** (every day-to-day action), **viewer** (read-only). sof-api enforces it: `ViewerReadOnlyGuard` refuses every non-GET from a viewer except their own session, page views and password, and admin-only endpoints use `@Roles('admin')`. In sof-web, any new button that changes something must hide itself for viewers with `useCanAct()` from `components/RoleProvider.tsx`; admin-only UI checks `useRole() === 'admin'`. Role descriptions shown to users live in `lib/roles.ts`; keep them in step with what the API allows.
