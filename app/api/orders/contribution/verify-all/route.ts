import { proxyJson } from '@/lib/serverFetch';

export async function POST() {
  return proxyJson('/orders/contribution/verify-all', { method: 'POST' });
}
