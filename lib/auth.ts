const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type RefreshResult = { accessToken: string; setCookieHeaders: string[] };

// Calls the backend's silent-refresh endpoint. Used from both proxy.ts (Node
// runtime, no next/headers) and lib/serverFetch.ts (Route Handlers), so this
// stays a plain fetch with no framework-specific cookie APIs.
export async function refreshAccessToken(refreshToken: string): Promise<RefreshResult | null> {
  const res = await fetch(`${API}/auth/refresh`, {
    method: 'POST',
    headers: { cookie: `refresh_token=${refreshToken}` },
  });
  if (!res.ok) return null;

  const setCookieHeaders: string[] = [];
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') setCookieHeaders.push(value);
  });

  const accessCookie = setCookieHeaders.find(c => c.startsWith('access_token='));
  const accessToken = accessCookie?.split(';')[0].split('=')[1];
  return accessToken ? { accessToken, setCookieHeaders } : null;
}
