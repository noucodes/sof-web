import { NextRequest } from 'next/server';
import { proxyJson } from '@/lib/serverFetch';

export async function POST(req: NextRequest) {
  return proxyJson('/supplier-credits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: (await req.text()) || '{}' });
}
