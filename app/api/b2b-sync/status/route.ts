import { NextRequest, NextResponse } from 'next/server';
import { appendStatus } from '@/lib/statusStore';

// Called by b2b-push at the end of each Catsy -> Shopify price sync run.
// Machine-to-machine, so it's gated by a shared bearer token rather than
// the browser session cookies every other /api/* route in this app uses.
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!process.env.B2B_SYNC_STATUS_TOKEN || token !== process.env.B2B_SYNC_STATUS_TOKEN) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || (body.status !== 'success' && body.status !== 'failed') || !body.finishedAt) {
    return NextResponse.json({ message: 'Invalid status payload' }, { status: 400 });
  }

  appendStatus({
    status: body.status,
    source: typeof body.source === 'string' ? body.source : undefined,
    itemsSynced: typeof body.itemsSynced === 'number' ? body.itemsSynced : undefined,
    itemsFailed: typeof body.itemsFailed === 'number' ? body.itemsFailed : undefined,
    error: typeof body.error === 'string' ? body.error : undefined,
    startedAt: typeof body.startedAt === 'string' ? body.startedAt : undefined,
    finishedAt: body.finishedAt,
  });

  return new NextResponse(null, { status: 204 });
}
