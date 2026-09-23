import { proxyJson } from '@/lib/serverFetch';

export async function GET() {
  return proxyJson('/auth/me', { cache: 'no-store' });
}
