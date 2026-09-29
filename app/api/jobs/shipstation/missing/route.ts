import { NextRequest } from 'next/server';
import { proxyJson } from '@/lib/serverFetch';

export async function GET(req: NextRequest) {
  const days = req.nextUrl.searchParams.get('days') ?? '7';
  return proxyJson(`/jobs/shipstation/missing?days=${encodeURIComponent(days)}`);
}