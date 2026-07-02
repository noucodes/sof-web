import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const upstream = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({ message: 'Login failed' }));
    return NextResponse.json(err, { status: upstream.status });
  }

  const data = await upstream.json();

  // Forward Set-Cookie headers from NestJS to the browser
  const res = NextResponse.json(data);
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') res.headers.append('Set-Cookie', value);
  });

  return res;
}
