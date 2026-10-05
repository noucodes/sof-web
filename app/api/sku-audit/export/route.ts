import { NextRequest } from 'next/server';
import { proxyFile } from '@/lib/serverFetch';

export async function GET(req: NextRequest) {
  return proxyFile(`/api/sku-audit/export?${req.nextUrl.searchParams.toString()}`);
}
