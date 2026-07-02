import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  const qs = req.nextUrl.searchParams.toString();
  const res = await fetch(`${API}/jobs${qs ? `?${qs}` : ''}`, { headers: { cookie: cookieHeader }, cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
