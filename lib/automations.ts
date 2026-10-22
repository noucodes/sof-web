import { redirect } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Every automation the portal knows about. A job listed here shows on the
// Automations page even before its first run ("Never run"). The key is the job
// name burdens-workers reports under (POST /api/automations/<key>/status).
export const JOBS: Record<string, { title: string; description: string; schedule: string; itemLabel: string }> = {
  'inventory-shipstation': {
    title: 'Inventory → ShipStation',
    description: 'Stock on hand from Frameworks (branches 8 and 20, added together) sent to ShipStation. Only products whose stock changed are sent.',
    schedule: 'Every hour',
    itemLabel: 'SKUs',
  },
  'inventory-shopify': {
    title: 'Inventory → Shopify',
    description: 'Stock on hand from each Frameworks branch sent to its own Plumbers HQ location in Shopify, so Uber delivery knows which store has the item. Products at 0 stay available to buy.',
    schedule: 'Every hour',
    itemLabel: 'Stock levels',
  },
};

export type Run = {
  job: string;
  status: 'success' | 'failed';
  source?: string;
  itemsSynced?: number;
  itemsFailed?: number;
  error?: string;
  finishedAt?: string;
};

// Server-side read with the session cookie forwarded, so an expired session
// 401s and redirects like every other page.
export async function getAutomations<T>(path: string, cookieHeader: string): Promise<T> {
  const res = await fetch(`${API}/api/automations${path}`, { headers: { cookie: cookieHeader }, cache: 'no-store' });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load automations: ${res.status} ${await res.text()}`);
  return res.json();
}

export function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' })} ${d.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney' })}`;
}
