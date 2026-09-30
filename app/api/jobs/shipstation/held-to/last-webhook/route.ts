import { proxyJson } from '@/lib/serverFetch';

// Open /api/jobs/shipstation/held-to/last-webhook while signed in to see the last
// body Frameworks posted to sof-api.
export async function GET() {
  return proxyJson('/jobs/shipstation/held-to/last-webhook');
}
