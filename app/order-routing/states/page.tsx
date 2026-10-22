import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import StatusPill from '@/components/StatusPill';
import { STATES, stateMeta } from '@/lib/routing';

const FLOW = ['new', 'checking', 'awaiting_approval', 'approved', 'in_progress', 'done'] as const;
const SIDE_PATHS = [
  ['Checking stock', 'On hold (a Fienza order or a pick-up order) or Needs review (no rule fits, or a product is missing)'],
  ['Awaiting approval', 'Rejected (you’ll handle it in Frameworks yourself)'],
  ['In progress', 'Failed, then Retry takes it back to In progress'],
  ['On hold', 'back to Checking stock once the rule for it is added'],
];

// Plain-English guide to every Order routing state. Content lives in lib/routing.ts
// so the badges on the other pages can't drift from what this page says.
export default function OrderStatesPage() {
  return (
    <AppShell>
      <PageHeader crumbs={['Orders', { label: 'Order routing', href: '/order-routing' }, 'Order states']} />
      <div className="space-y-6 p-6">
        <div className="space-y-0.5">
          <h1 className="text-[0.9375rem] font-semibold tracking-tight text-ink">Order states</h1>
          <p className="text-sm text-muted">Every routed order is in exactly one state. Each badge always shows its name, so you never have to go by colour alone.</p>
        </div>

        <div className="space-y-3 rounded-xl bg-surface p-5">
          <div className="flex flex-wrap items-center gap-2.5">
            {FLOW.map((s, i) => (
              <span key={s} className="flex items-center gap-2.5">
                <StatusPill tone={stateMeta(s).tone}>{stateMeta(s).label}</StatusPill>
                {i < FLOW.length - 1 && <span aria-hidden="true" className="text-muted">→</span>}
              </span>
            ))}
          </div>
          <ul className="m-0 list-none space-y-1 p-0 text-[0.8125rem] text-muted">
            {SIDE_PATHS.map(([from, to]) => (
              <li key={from}><span className="font-medium text-ink">{from}</span> → {to}</li>
            ))}
          </ul>
        </div>

        <div className="overflow-x-auto rounded-lg bg-white shadow-card">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="bg-surface text-left text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">
                {['State', 'Code', 'What it means', 'Who acts next', 'Frameworks changed?'].map(h => <th key={h} scope="col" className="border-b border-frame px-4 py-2.5">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {STATES.map(s => (
                <tr key={s.state} className="border-b border-hair align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-3"><StatusPill tone={s.tone}>{s.label}</StatusPill></td>
                  <td className="px-4 py-3 font-mono text-[0.8125rem]">{s.state}</td>
                  <td className="px-4 py-3">{s.meaning}</td>
                  <td className="px-4 py-3">{s.who}</td>
                  <td className="px-4 py-3">{s.frameworks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
