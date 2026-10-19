'use client';
import { useClientSort } from '@/components/table/useClientSort';
import SortableTh from '@/components/table/SortableTh';
import SortSelect from '@/components/table/SortSelect';
import FetchPriceButton from '@/components/FetchPriceButton';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import StatusPill from '@/components/StatusPill';
import RowSheet from '@/components/RowSheet';

const GP_ALERT_THRESHOLD = 10;

function money(n: number | string | null) {
  return n != null ? `$${parseFloat(String(n)).toFixed(2)}` : '—';
}

function shortDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' }) : '—';
}

function gpPct(netSales: number | string | null, cogs: number | string | null): number | null {
  const s = netSales != null ? parseFloat(String(netSales)) : NaN;
  const c = cogs != null ? parseFloat(String(cogs)) : NaN;
  if (!Number.isFinite(s) || !Number.isFinite(c) || s === 0) return null;
  return ((s - c) / s) * 100;
}

const COLUMNS = [
  { key: 'order', label: 'Order', getValue: (r: any) => r.orderName ?? '' },
  { key: 'date', label: 'Date', kind: 'date' as const, getValue: (r: any) => (r.orderDate ? new Date(r.orderDate).getTime() : 0) },
  { key: 'store', label: 'Store', getValue: (r: any) => r.storeLabel ?? '' },
  { key: 'frameworks', label: 'Frameworks No.', getValue: (r: any) => r.frameworksOrderNo ?? '' },
  { key: 'netSales', label: 'Net Sales', kind: 'number' as const, getValue: (r: any) => (r.netSales != null ? parseFloat(r.netSales) : 0) },
  { key: 'cogs', label: 'COGS', kind: 'number' as const, getValue: (r: any) => (r.cogs != null ? parseFloat(r.cogs) : 0) },
  { key: 'gp', label: 'GP %', kind: 'number' as const, getValue: (r: any) => gpPct(r.netSales, r.cogs) ?? -Infinity },
  { key: 'freight', label: 'Freight', kind: 'number' as const, getValue: (r: any) => (r.freight != null ? parseFloat(r.freight) : 0) },
  { key: 'paymentFees', label: 'Payment Fees', kind: 'number' as const, getValue: (r: any) => (r.paymentFees != null ? parseFloat(r.paymentFees) : 0) },
  { key: 'contribution', label: 'Contribution', kind: 'number' as const, getValue: (r: any) => (r.contribution != null ? parseFloat(r.contribution) : 0) },
];

// Refined layout: amounts right-aligned so the cents line up.
const MONEY_KEYS = new Set(['netSales', 'cogs', 'gp', 'freight', 'paymentFees', 'contribution']);
const GETTERS = Object.fromEntries(COLUMNS.map(c => [c.key, c.getValue]));

export default function ContributionTable({ rows }: { rows: any[] }) {
  const { sorted, sort, toggleSort, setSort } = useClientSort(rows, GETTERS);

  return (
    <>
    <SortSelect columns={COLUMNS} value={sort} onChange={setSort} />
    <RowSheet>
    <table data-compact className="stack-table w-full text-sm">
      <thead className="bg-surface-strong border-b border-frame">
        <tr>
          {COLUMNS.map(col => (
            <SortableTh
              key={col.key}
              label={col.label}
              direction={sort?.key === col.key ? sort.dir : null}
              onClick={() => toggleSort(col.key)}
              className={MONEY_KEYS.has(col.key) ? 'text-right' : undefined}
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.length === 0 && (
          <tr>
            <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-sm text-muted">No orders found</td>
          </tr>
        )}
        {sorted.map((r: any, idx: number) => (
          <tr
            key={r.orderId}
            className={`border-t border-hair first:border-t-0 hover:bg-surface-hover transition-colors duration-100 ${r.error ? 'opacity-60' : ''}`}
          >
            <td data-primary className="px-4 py-3 font-mono text-[0.8125rem] text-ink">{r.orderName}</td>
            <td data-label="Date" className="px-4 py-3 text-sm text-muted whitespace-nowrap">{shortDate(r.orderDate)}</td>
            <td data-label="Store" className="px-4 py-3 text-sm text-muted">{r.storeLabel}</td>
            <td data-label="Frameworks no." className="px-4 py-3 font-mono text-[0.8125rem] text-muted">{r.frameworksOrderNo ?? '—'}</td>
            <td data-label="Net sales" className="px-4 py-3 text-right text-sm tabular-nums text-ink">{money(r.netSales)}</td>
            <td data-label="COGS" className="px-4 py-3 text-right text-sm tabular-nums text-ink">{money(r.cogs)}</td>
            <td data-label="GP %" data-key className="px-4 py-3 text-right text-sm font-medium tabular-nums whitespace-nowrap">
              {(() => {
                const p = gpPct(r.netSales, r.cogs);
                if (p == null) return <span className="text-muted font-normal">—</span>;
                const low = p < GP_ALERT_THRESHOLD;
                return low ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 rounded-md bg-failed-bg px-1.5 py-0.5 text-failed">
                        {p.toFixed(1)}%
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3h.008v.008H12v-.008ZM21.75 12a9.75 9.75 0 1 1-19.5 0 9.75 9.75 0 0 1 19.5 0Z" />
                        </svg>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>GP below {GP_ALERT_THRESHOLD}%</TooltipContent>
                  </Tooltip>
                ) : (
                  <span className="text-ink">{p.toFixed(1)}%</span>
                );
              })()}
            </td>
            <td data-label="Freight" className="px-4 py-3 text-right text-sm tabular-nums text-ink whitespace-nowrap">
              {/* Freight is the ShipStation label cost — 0 until a label prints. */}
              {r.freight != null && parseFloat(r.freight) === 0 ? (
                <StatusPill tone="pending">Not shipped</StatusPill>
              ) : (
                money(r.freight)
              )}
            </td>
            <td data-label="Payment fees" className="px-4 py-3 text-right text-sm tabular-nums text-ink">{money(r.paymentFees)}</td>
            <td data-label="Contribution" data-key className="px-4 py-3 text-sm tabular-nums text-ink font-medium">
              <div className="flex items-center justify-end gap-1.5">
                {r.contribution == null ? (
                  <span className="text-muted font-normal">Not calculated</span>
                ) : (
                  <span>{money(r.contribution)}</span>
                )}
                {r.error && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="shrink-0">
                        <svg className="w-4 h-4 text-pending" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3h.008v.008H12v-.008ZM21.75 12a9.75 9.75 0 1 1-19.5 0 9.75 9.75 0 0 1 19.5 0Z" />
                        </svg>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{r.error}</TooltipContent>
                  </Tooltip>
                )}
                {r.frameworksOrderNo && (r.contribution == null || r.error) && (
                  <FetchPriceButton orderId={r.orderId} hasError={!!r.error} />
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </RowSheet>
    </>
  );
}
