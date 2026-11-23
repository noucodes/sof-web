// Where to go after login: only same-site paths ("/x"), never "//host" or "/\host" (open redirect).
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/dashboard';
}
