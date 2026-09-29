import { NextRequest } from 'next/server';
import { proxyJson } from '@/lib/serverFetch';

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyJson('/orders/recheck-prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}