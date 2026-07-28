import { NextRequest } from 'next/server';
import { proxyJson } from '@/lib/serverFetch';

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  return proxyJson(`/jobs${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
}
