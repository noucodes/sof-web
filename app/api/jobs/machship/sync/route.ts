import { NextRequest } from 'next/server';
import { proxyJson } from '@/lib/serverFetch';

// Pull MachShip consignments now. ?from=2026-10-16 to backfill.
export async function POST(req: NextRequest) {
  const from = req.nextUrl.searchParams.get('from');
  return proxyJson(`/jobs/machship/sync${from ? `?from=${encodeURIComponent(from)}` : ''}`, { method: 'POST' });
}
