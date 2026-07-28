import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from './lib/auth';

function withAccessToken(cookieHeader: string | null, accessToken: string): string {
  const kept = (cookieHeader ?? '').split('; ').filter(Boolean).filter(c => !c.startsWith('access_token='));
  return [...kept, `access_token=${accessToken}`].join('; ');
}

export async function proxy(req: NextRequest) {
  let token = req.cookies.get('access_token')?.value;
  const { pathname } = req.nextUrl;

  // Silent refresh: the access token is short-lived (15m) and nothing else
  // pings /auth/refresh on activity, so without this every user gets logged
  // out on a flat 15-minute timer instead of an idle one.
  let refreshedSetCookies: string[] | null = null;
  if (!token) {
    const refreshToken = req.cookies.get('refresh_token')?.value;
    if (refreshToken) {
      const refreshed = await refreshAccessToken(refreshToken);
      if (refreshed) {
        token = refreshed.accessToken;
        refreshedSetCookies = refreshed.setCookieHeaders;
      }
    }
  }

  function withRefreshCookies(res: NextResponse) {
    refreshedSetCookies?.forEach(c => res.headers.append('Set-Cookie', c));
    return res;
  }

  if (pathname === '/login') {
    if (token) return withRefreshCookies(NextResponse.redirect(new URL('/dashboard', req.url)));
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Admin-only guard
  if (pathname.startsWith('/admin')) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      if (payload.role !== 'admin') {
        return withRefreshCookies(NextResponse.redirect(new URL('/orders', req.url)));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  if (!refreshedSetCookies) return NextResponse.next();

  // Propagate the refreshed access token onto this request so the page's own
  // data fetching (which reads cookies() downstream) picks it up immediately.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('cookie', withAccessToken(req.headers.get('cookie'), token));
  return withRefreshCookies(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api|.*\\.(?:png|jpg|jpeg|svg|avif|webp|ico|gif)).*)'],
};
