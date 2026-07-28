import { NextRequest } from 'next/server';
import { proxyJson } from '@/lib/serverFetch';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyJson(`/orders/${id}/compare`, { cache: 'no-store' });
}
