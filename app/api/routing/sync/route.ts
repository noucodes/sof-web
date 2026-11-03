import { proxyJson } from '@/lib/serverFetch';

// "Check Frameworks": POST asks burdens-workers to run now, GET polls for the result.
export async function GET() {
  return proxyJson('/routing/sync', { cache: 'no-store' });
}

export async function POST() {
  return proxyJson('/routing/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
}
