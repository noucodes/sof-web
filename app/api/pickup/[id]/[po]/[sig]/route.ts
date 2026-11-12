import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Store's cartons/pallets Send. Public (no session cookie): sof-api checks the signed link.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; po: string; sig: string }> }) {
  const { id, po, sig } = await params;
  if (!/^\d+$/.test(id) || !/^\d{6,10}$/.test(po) || !/^[\w-]{32}$/.test(sig)) return NextResponse.json({ message: 'This link is not valid' }, { status: 404 });
  const res = await fetch(`${API}/supplier-credits/pickup/${id}/${po}/${sig}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: (await req.text()) || '{}',
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
