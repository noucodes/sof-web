import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';
  await fetch(`${API}/auth/logout`, {
    method: 'POST',
    headers: { cookie: cookieHeader },
  }).catch(() => {});

  const res = NextResponse.redirect(new URL('/login', req.url));
  res.cookies.delete('access_token');
  res.cookies.delete('refresh_token');
  return res;
}
