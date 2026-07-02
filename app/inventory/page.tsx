import AppShell from '@/components/AppShell';

const PLANNED = [
  {
    title: 'Stock level sync',
    description: 'Pull live inventory quantities from Frameworks and push them to Shopify across all stores.',
  },
  {
    title: 'Low stock alerts',
    description: 'Get notified when products fall below a configurable threshold before they go out of stock.',
  },
  {
    title: 'Bulk price updates',
    description: 'Propagate pricing changes from Frameworks to Shopify without manual exports.',
  },
  {
    title: 'Sync history',
    description: 'Full audit trail of every inventory sync — what changed, when, and why.',
  },
];

export default function InventoryPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-8 max-w-2xl">

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[0.9375rem] font-semibold text-ink tracking-tight">Inventory Sync</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.6875rem] font-medium bg-pending-bg text-pending uppercase tracking-[0.05em]">
              Coming soon
            </span>
          </div>
          <p className="text-sm text-muted">
            Automated two-way inventory sync between Frameworks ERP and your Shopify stores.
          </p>
        </div>

        {/* Banner */}
        <div className="relative bg-white rounded-xl shadow-card overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="px-6 py-8 flex gap-5">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-primary-wash flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-[0.9375rem] font-semibold text-ink">This feature is under construction</p>
              <p className="text-sm text-muted leading-relaxed">
                The inventory sync module is currently being built. Once live, it will keep stock levels
                and pricing consistent across Frameworks and all connected Shopify stores automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Planned features */}
        <div className="space-y-3">
          <p className="text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em]">Planned features</p>
          <div className="bg-white rounded-xl shadow-card divide-y divide-frame overflow-hidden">
            {PLANNED.map((f) => (
              <div key={f.title} className="flex items-start gap-4 px-5 py-4">
                <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 border-frame flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted/40" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-ink">{f.title}</p>
                  <p className="text-xs text-muted leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
