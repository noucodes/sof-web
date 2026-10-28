import type { Tone } from '@/components/StatusPill';

// Mirrors sof-api's routing_orders row (src/routing).
export type RoutingLine = { code: string; desc?: string; qty: number; available?: Record<string, number>; onHand?: Record<string, number>; skip?: boolean };
export type RoutingHistory = { at: string; text: string; by?: string };
export type RoutingDetail = {
  supplier?: string;
  supplierName?: string;
  printer?: string;
  branch?: string;
  kind?: 'pickup' | 'local_delivery' | 'stock';
  shipTo?: string;
  poValue?: number;
  emailBody?: string;
  poNumber?: string;
};
export type RoutingOrder = {
  id: number;
  orderNo: string;
  orderSuffix: number;
  customerOrderNo: string | null;
  customerName: string | null;
  despatchMethod: string | null;
  brand: string | null;
  state: RoutingState;
  action: RoutingAction | null;
  detail: RoutingDetail | null;
  lines: RoutingLine[] | null;
  flags: string[] | null;
  history: RoutingHistory[] | null;
  holdReason: string | null;
  error: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RoutingState =
  | 'new' | 'checking' | 'awaiting_approval' | 'needs_review' | 'on_hold'
  | 'approved' | 'in_progress' | 'done' | 'failed' | 'rejected';
export type RoutingAction = 'pick_slip' | 'handover' | 'po_branch' | 'po_direct' | 'requisition';

// Everything the Order states page says, and what every badge shows.
export const STATES: { state: RoutingState; label: string; tone: Tone; meaning: string; who: string; frameworks: string }[] = [
  { state: 'new', label: 'New', tone: 'neutral', meaning: 'Found on branch 20 with assignee shopify and no linked PO.', who: 'The system', frameworks: 'No' },
  { state: 'checking', label: 'Checking stock', tone: 'neutral', meaning: 'Reading the lines and the available stock at each branch.', who: 'The system', frameworks: 'No' },
  { state: 'awaiting_approval', label: 'Awaiting approval', tone: 'pending', meaning: 'An action is proposed: pick slip, handover, PO or direct-delivery PO.', who: 'Bek: approve, change or reject', frameworks: 'No' },
  { state: 'needs_review', label: 'Needs review', tone: 'pending', meaning: 'No rule fits, or something is missing (a product not found, no stock data).', who: 'Bek: choose an action', frameworks: 'No' },
  { state: 'on_hold', label: 'On hold', tone: 'neutral', meaning: 'CANCELLED on the order, on Bek’s don’t-touch list, or a run-out item no branch has.', who: 'Bek', frameworks: 'No, the assignee stays shopify' },
  { state: 'approved', label: 'Approved', tone: 'info', meaning: 'Approved and waiting its turn to run.', who: 'The system', frameworks: 'Not yet' },
  { state: 'in_progress', label: 'In progress', tone: 'info', meaning: 'Updating the order, creating the PO, emailing or printing.', who: 'The system', frameworks: 'Yes, step by step' },
  { state: 'done', label: 'Done', tone: 'success', meaning: 'Every step finished and checked. The order has left the shopify list.', who: 'Nobody', frameworks: 'Yes' },
  { state: 'failed', label: 'Failed', tone: 'failed', meaning: 'A step failed. The history shows which step, and what already happened.', who: 'Bek: retry, or finish it in Frameworks', frameworks: 'Partly, see the history' },
  { state: 'rejected', label: 'Rejected', tone: 'neutral', meaning: 'Bek chose to handle it in Frameworks instead.', who: 'Bek, outside SOF', frameworks: 'No' },
];
export const stateMeta = (s: RoutingState) => STATES.find(x => x.state === s) ?? STATES[0];

export const ACTIONS: { action: RoutingAction; label: string }[] = [
  { action: 'po_branch', label: 'PO for branch 20' },
  { action: 'po_direct', label: 'Direct delivery PO' },
  { action: 'pick_slip', label: 'Print pick slip' },
  { action: 'handover', label: 'Hand over to a branch' },
  { action: 'requisition', label: 'Requisition (under supplier minimum)' },
];
export const actionLabel = (a: RoutingAction | null) => ACTIONS.find(x => x.action === a)?.label ?? 'No action yet';

// One line under the action: who it goes to.
export function actionSub(o: RoutingOrder) {
  const d = o.detail ?? {};
  if (o.action === 'pick_slip') return d.printer ? `Printer ${d.printer}` : null;
  if (o.action === 'handover') return d.branch ? `To ${d.branch}${d.kind === 'pickup' ? ' · customer pick-up' : d.kind === 'local_delivery' ? ' · local delivery' : ''}` : null;
  if (o.action === 'requisition') return [d.supplier, 'Bek combines into a PO'].filter(Boolean).join(' · ');
  if (o.action === 'po_direct') return [d.supplier, 'ships to customer'].filter(Boolean).join(' · ');
  if (o.action === 'po_branch') return [d.supplier, 'ships to Burdens Ecommerce'].filter(Boolean).join(' · ');
  return o.holdReason;
}

export const DECIDABLE: RoutingState[] = ['awaiting_approval', 'needs_review'];

// Tabs on the Order routing page, in order. 'open' = everything not done or rejected.
export const TABS: { id: RoutingState | 'open'; label: string }[] = [
  { id: 'open', label: 'All open' },
  { id: 'awaiting_approval', label: 'Awaiting approval' },
  { id: 'needs_review', label: 'Needs review' },
  { id: 'on_hold', label: 'On hold' },
  { id: 'approved', label: 'Approved' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'failed', label: 'Failed' },
  { id: 'done', label: 'Done' },
  { id: 'rejected', label: 'Rejected' },
];

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-AU', { timeZone: 'Australia/Sydney', day: '2-digit', month: '2-digit', hour: 'numeric', minute: '2-digit' });
