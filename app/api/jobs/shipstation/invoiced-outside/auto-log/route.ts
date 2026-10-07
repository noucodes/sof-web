import { proxyJson } from '@/lib/serverFetch';

export async function GET() {
  return proxyJson('/jobs/shipstation/invoiced-outside/auto-log');
}
