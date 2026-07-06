import AppShell from '@/components/AppShell';

const FEATURES = [
  {
    title: 'Frameworks → ShipStation sync',
    description: 'Pulls stock-on-hand per SKU from Frameworks ERP (branches 8 & 20) and pushes adjusted quantities to ShipStation every hour.',
    done: true,
  },
  {
    title: 'Multi-branch aggregation',
    description: 'Inventory is summed across all configured Frameworks branches before being pushed, so ShipStation always sees the combined total.',
    done: true,
  },
  {
    title: 'Shopify stock sync',
    description: 'Propagate the same inventory levels to Shopify so all storefronts reflect accurate availability.',
    done: false,
  },
  {
    title: 'Low stock alerts',
    description: 'Get notified when products fall below a configurable threshold before they go out of stock.',
    done: false,
  },
  {
    title: 'Sync history & audit trail',
    description: 'Full log of every sync run — how many SKUs were updated, timing, and any errors.',
    done: false,
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
              In progress
            </span>
          </div>
          <p className="text-sm text-muted">
            Automated stock-level sync from Frameworks ERP to ShipStation, running hourly.
          </p>
        </div>

        {/* Status banner */}
        <div className="relative bg-white rounded-xl shadow-card overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="px-6 py-8 flex gap-5">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-primary-wash flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-[0.9375rem] font-semibold text-ink">Frameworks → ShipStation is live</p>
              <p className="text-sm text-muted leading-relaxed">
                The <code className="text-xs bg-surface px-1 py-0.5 rounded">inventory-sync</code> service runs on EC2 and syncs stock quantities
                from Frameworks (branches 8 &amp; 20) to ShipStation every hour. Shopify sync is next.
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="space-y-3">
          <p className="text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em]">How it works</p>
          <div className="bg-white rounded-xl shadow-card divide-y divide-frame overflow-hidden">
            {[
              { step: '1', label: 'Login to Frameworks', detail: 'Authenticates with Frameworks ERP, renewing the session every 25 minutes.' },
              { step: '2', label: 'Fetch stock per branch', detail: 'Paginates through all products for each configured branch (default: 8, 20) and aggregates stock-on-hand by SKU.' },
              { step: '3', label: 'Push to ShipStation', detail: 'Sends an inventory adjust transaction per SKU to ShipStation using the configured warehouse location.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 px-5 py-4">
                <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-primary-wash flex items-center justify-center">
                  <span className="text-[0.625rem] font-semibold text-primary">{s.step}</span>
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-ink">{s.label}</p>
                  <p className="text-xs text-muted leading-relaxed">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <p className="text-[0.6875rem] font-medium text-muted uppercase tracking-[0.07em]">Features</p>
          <div className="bg-white rounded-xl shadow-card divide-y divide-frame overflow-hidden">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-4 px-5 py-4">
                <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${f.done ? 'bg-success-bg' : 'border-2 border-frame'}`}>
                  {f.done
                    ? <svg className="w-3 h-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    : <div className="w-1.5 h-1.5 rounded-full bg-muted/40" />}
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
