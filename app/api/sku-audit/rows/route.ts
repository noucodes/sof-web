import { NextRequest } from 'next/server';
import { proxyJson } from '@/lib/serverFetch';

export async function GET(req: NextRequest) {
  return proxyJson(`/api/sku-audit/rows?${req.nextUrl.searchParams.toString()}`, { cache: 'no-store' });
}
