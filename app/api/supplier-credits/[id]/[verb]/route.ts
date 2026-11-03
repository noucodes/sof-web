import { NextRequest, NextResponse } from 'next/server';
import { proxyJson } from '@/lib/serverFetch';

const VERBS = ['approve', 'reject'];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; verb: string }> }) {
  const { id, verb } = await params;
  if (!VERBS.includes(verb) || !/^\d+$/.test(id)) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return proxyJson(`/supplier-credits/${id}/${verb}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: (await req.text()) || '{}' });
}
