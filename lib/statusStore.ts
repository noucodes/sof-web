import fs from 'fs';
import path from 'path';

// Tiny JSON-file-backed store for the B2B price sync's run status. This is
// intentionally not routed through sof-api — the sync has nothing to do
// with the orders/ERP domain sof-api owns, so a self-contained file here is
// simpler than adding a table + endpoint to a backend that doesn't know
// about Catsy or Shopify B2B pricing.
const DATA_DIR = path.join(process.cwd(), 'data');
const STATUS_FILE = path.join(DATA_DIR, 'b2b-sync-status.json');
const MAX_HISTORY = 20;

export type SyncStatusEntry = {
  status: 'success' | 'failed';
  source?: string;
  itemsSynced?: number;
  itemsFailed?: number;
  error?: string;
  startedAt?: string;
  finishedAt: string;
  receivedAt: string;
};

function readAll(): SyncStatusEntry[] {
  try {
    return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

export function appendStatus(entry: Omit<SyncStatusEntry, 'receivedAt'>): void {
  const history = readAll();
  history.push({ ...entry, receivedAt: new Date().toISOString() });
  const trimmed = history.slice(-MAX_HISTORY);

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STATUS_FILE, JSON.stringify(trimmed, null, 2));
}

export function readStatus(): { latest: SyncStatusEntry | null; history: SyncStatusEntry[] } {
  const history = readAll();
  return { latest: history.length ? history[history.length - 1] : null, history: [...history].reverse() };
}
