import { cookies } from 'next/headers';

export type Role = 'admin' | 'operator' | 'viewer';

// The signed-in role, read from the access token the way proxy.ts does. It
// only decides what to show: sof-api checks the role again on every request.
// A role change shows up once the token refreshes (within 15 minutes).
export async function getRole(): Promise<Role> {
  const token = (await cookies()).get('access_token')?.value;
  try {
    const role = JSON.parse(Buffer.from(token!.split('.')[1], 'base64url').toString()).role;
    return role === 'admin' || role === 'operator' ? role : 'viewer';
  } catch {
    return 'viewer';
  }
}
