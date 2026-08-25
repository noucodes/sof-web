import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { refreshAccessToken } from './auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function withAccessToken(cookieHeader: string, accessToken: string): string {
  const kept = cookieHeader.split('; ').filter(Boolean).filter(c => !c.startsWith('access_token='));
  return [...kept, `access_token=${accessToken}`].join('; ');
}

// Every /api/* route forwards the session cookie to the backend and mirrors
// its JSON + status back. Centralized here so a 401 (naturally-expired access
// token) gets one retry via /auth/refresh instead of failing the action —
// e.g. clicking "Retry" on an order shouldn't die just because the token
// happened to expire mid-session.
export async function proxyJson(path: string, init?: RequestInit) {
  const store = await cookies();
  let cookieHeader = store.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  let res = await fetch(`${API}${path}`, { ...init, headers: { ...init?.headers, cookie: cookieHeader } });

  let refreshedSetCookies: string[] | null = null;
  if (res.status === 401) {
    const refreshToken = store.get('refresh_token')?.value;
    if (refreshToken) {
      const refreshed = await refreshAccessToken(refreshToken);
      if (refreshed) {
        refreshedSetCookies = refreshed.setCookieHeaders;
        cookieHeader = withAccessToken(cookieHeader, refreshed.accessToken);
        res = await fetch(`${API}${path}`, { ...init, headers: { ...init?.headers, cookie: cookieHeader } });
      }
    }
  }

  const data = await res.json();
  const out = NextResponse.json(data, { status: res.status });
  refreshedSetCookies?.forEach(c => out.headers.append('Set-Cookie', c));
  return out;
}

// Same cookie-forward + one-shot 401 refresh as proxyJson, but for a raw
// (non-JSON) response body — e.g. the contribution CSV export.
export async function proxyFile(path: string, init?: RequestInit) {
  const store = await cookies();
  let cookieHeader = store.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  let res = await fetch(`${API}${path}`, { ...init, headers: { ...init?.headers, cookie: cookieHeader } });

  let refreshedSetCookies: string[] | null = null;
  if (res.status === 401) {
    const refreshToken = store.get('refresh_token')?.value;
    if (refreshToken) {
      const refreshed = await refreshAccessToken(refreshToken);
      if (refreshed) {
        refreshedSetCookies = refreshed.setCookieHeaders;
        cookieHeader = withAccessToken(cookieHeader, refreshed.accessToken);
        res = await fetch(`${API}${path}`, { ...init, headers: { ...init?.headers, cookie: cookieHeader } });
      }
    }
  }

  const body = await res.arrayBuffer();
  const out = new NextResponse(body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'application/octet-stream',
      ...(res.headers.get('content-disposition') ? { 'Content-Disposition': res.headers.get('content-disposition')! } : {}),
    },
  });
  refreshedSetCookies?.forEach(c => out.headers.append('Set-Cookie', c));
  return out;
}
