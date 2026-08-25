import { NextRequest } from 'next/server';
import { proxyJson } from '@/lib/serverFetch';

export async function GET(req: NextRequest) {
  return proxyJson(`/orders/contribution?${req.nextUrl.searchParams.toString()}`);
}
