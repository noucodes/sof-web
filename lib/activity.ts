// Plain-English names for the sof-api handlers the activity log records
// (LoggingInterceptor writes 'request' rows as Controller.method).
const ACTIONS: Record<string, string> = {
  'AuthController.login': 'Signed in',
  'AuthController.logout': 'Signed out',
  'AuthController.register': 'Registered a user',
  'AuthController.changePassword': 'Changed their own password',
  'OrdersController.retry': 'Retried an order',
  'OrdersController.retryFailed': 'Retried all failed orders',
  'OrdersController.fetchPrice': 'Fetched a Frameworks price',
  'OrdersController.verifyAllContributions': 'Verified all contributions',
  'JobsController.retry': 'Retried a ShipStation job',
  'JobsController.retryFailed': 'Retried failed ShipStation jobs',
  'JobsController.fixMissingShipments': 'Fixed missing shipments',
  'JobsController.checkInvoicedOutside': 'Checked invoiced-outside orders',
  'JobsController.markInvoicedOutsideShipped': 'Marked invoiced-outside orders shipped',
  'JobsController.retryHeldTo': 'Retried a Date Required change',
  'SyncController.pull': 'Pulled orders from Shopify',
  'UsersController.create': 'Added a user',
  'UsersController.update': 'Changed a user',
  'SkuAuditController.run': 'Ran the SKU audit',
};

export type ActivityParams = {
  handler?: string;
  method?: string;
  url?: string;
  path?: string; // page_view rows
  page?: string; // where the button was pressed
  target?: string; // what it was pressed on, e.g. "#B12345 · Frameworks 98765"
  body?: Record<string, unknown>; // what it sent, secrets hidden
  changes?: Record<string, [unknown, unknown]>; // before → after, e.g. a user's role
};

export type ActivityEntry = {
  id: number;
  userEmail: string;
  action: string;
  params: ActivityParams;
  result: { ok?: boolean; error?: string; response?: unknown } | null;
  createdAt: string;
};

export function actionLabel(p: ActivityParams | null | undefined) {
  if (!p?.handler) return 'Did something';
  // A user edit says which kind of edit it was.
  if (p.handler === 'UsersController.update' && p.changes) {
    if ('isActive' in p.changes) return p.changes.isActive[1] ? 'Reactivated a user' : 'Deactivated a user';
    if ('role' in p.changes) return 'Changed a user’s role';
    if ('password' in p.changes) return 'Reset a user’s password';
  }
  return ACTIONS[p.handler] ?? p.handler.replace('Controller.', ': ');
}

// Page paths as people know them: /orders/123 → Orders › #123.
const PAGES: Record<string, string> = {
  dashboard: 'Dashboard',
  orders: 'Orders',
  payments: 'Payments',
  contribution: 'Contribution',
  inventory: 'Inventory',
  shipstation: 'ShipStation',
  'b2b-sync': 'B2B Price Sync',
  'sku-audit': 'SKU Audit',
  admin: 'Admin',
  users: 'Users',
  activity: 'User activity',
  changelog: 'Changelog',
  profile: 'My profile',
};

export const pageLabel = (path: string) =>
  path
    .split('/')
    .filter(Boolean)
    .map(s => PAGES[s] ?? (s === ':id' ? 'detail' : /^\d+$/.test(s) ? `#${s}` : s))
    .join(' › ') || 'Home';
