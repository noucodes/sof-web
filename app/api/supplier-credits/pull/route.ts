import { proxyJson } from '@/lib/serverFetch';

// "Check Frameworks": POST asks burdens-workers to pull credit notes now, GET polls for the result.
export async function GET() {
  return proxyJson('/supplier-credits/pull', { cache: 'no-store' });
}

export async function POST() {
  return proxyJson('/supplier-credits/pull', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
}
