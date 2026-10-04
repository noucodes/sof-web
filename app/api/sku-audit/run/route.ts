import { proxyJson } from '@/lib/serverFetch';

export async function POST() {
  return proxyJson('/api/sku-audit/run', { method: 'POST' });
}
