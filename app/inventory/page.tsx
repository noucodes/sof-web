import AppShell from '@/components/AppShell';

export default function InventoryPage() {
  return (
    <AppShell>
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center">
          <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-[0.9375rem] font-semibold text-ink">Inventory Sync</p>
        <p className="text-sm text-muted">This page is under construction.</p>
      </div>
    </AppShell>
  );
}
