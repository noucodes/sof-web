import { NextRequest } from 'next/server';
import { proxyJson } from '@/lib/serverFetch';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.text();
  return proxyJson(`/routing/${id}/action`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body || '{}' });
}
