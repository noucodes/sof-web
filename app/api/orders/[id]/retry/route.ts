import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const res = await fetch(`${API}/orders/${id}/retry`, { method: 'POST', headers: { cookie: cookieHeader } });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
