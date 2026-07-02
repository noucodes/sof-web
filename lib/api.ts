const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}
