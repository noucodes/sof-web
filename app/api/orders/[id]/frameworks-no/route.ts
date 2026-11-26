import { NextRequest } from 'next/server';
import { proxyJson } from '@/lib/serverFetch';

// "Entered in Frameworks" box: link a hand-keyed Frameworks SO to a failed order.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyJson(`/orders/${id}/frameworks-no`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(await req.json()),
  });
}
