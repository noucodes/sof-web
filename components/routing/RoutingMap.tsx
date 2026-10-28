'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ChevronLeft, FileText, Loader2, RotateCcw, X } from 'lucide-react';
import StatusPill from '@/components/StatusPill';
import { useCanAct } from '@/components/RoleProvider';
import { DECIDABLE, actionLabel, actionSub, fmtTime, stateMeta, type RoutingOrder } from '@/lib/routing';
import { useRoutingAction } from './useRoutingAction';

// The routing steps as blocks on an isometric floor (CSS 3D, no library).
// Floor coordinates are px on a 1500×1100 plane, scaled and tilted inside a
// fixed STAGE that is centred in the map box and shrunk to fit its width.
// project() turns a floor point into stage px, so 2D overlays (the route, the
// floating card) can be drawn over the 3D floor.
const STAGE = { w: 1180, h: 700 };
const PLANE = { w: 1500, h: 1100, scale: 0.62 };
const CENTER = { x: STAGE.w / 2, y: 330 };
const R = Math.SQRT1_2;
function project(x: number, y: number, z = 0) {
  const dx = x - PLANE.w / 2, dy = y - PLANE.h / 2;
  return { x: CENTER.x + PLANE.scale * R * (dx + dy), y: CENTER.y + PLANE.scale * (0.5 * R * (dy - dx) - z * 0.866) };
}

type NodeId = 'sof' | 'approval' | 'hold' | 'suppliers' | 'printer' | 'branches';
type Tone = { top?: string; line?: string; front?: string; left?: string; ink?: string };
type Block = { id: NodeId | null; x: number; y: number; w: number; d: number; h: number; label: string; tone?: Tone };

const SOF: Tone = { top: 'var(--color-primary-wash)', front: 'oklch(0.860 0.060 252)', left: 'oklch(0.800 0.080 252)', ink: 'var(--color-primary)' };
const HATCH: Tone = { top: 'repeating-linear-gradient(45deg, oklch(1 0 0) 0 12px, oklch(0.930 0.008 252) 12px 15px)' };
const BLOCKS: Block[] = [
  { id: null, x: 100, y: 150, w: 220, d: 160, h: 40, label: 'SHOPIFY' },
  { id: null, x: 470, y: 110, w: 340, d: 220, h: 70, label: 'FRAMEWORKS' },
  { id: 'approval', x: 1000, y: 160, w: 300, d: 200, h: 50, label: 'APPROVAL' },
  { id: 'hold', x: 110, y: 500, w: 220, d: 220, h: 24, label: 'ON HOLD', tone: HATCH },
  { id: 'sof', x: 520, y: 500, w: 300, d: 240, h: 110, label: 'SOF CHECKER', tone: SOF },
  { id: 'suppliers', x: 1000, y: 500, w: 320, d: 240, h: 64, label: 'SUPPLIERS' },
  { id: null, x: 100, y: 880, w: 110, d: 120, h: 34, label: 'B20' },
  { id: null, x: 230, y: 880, w: 110, d: 120, h: 34, label: 'B11' },
  { id: 'branches', x: 470, y: 880, w: 330, d: 120, h: 34, label: 'HANDOVERS' },
  { id: 'printer', x: 1000, y: 880, w: 200, d: 140, h: 40, label: 'PRINTER' },
];
const ROADS = [[40, 400, 1420, 40], [40, 800, 1420, 40], [380, 40, 40, 1020], [900, 40, 40, 1020]];

// Road legs an order travels, as points along the road centres.
const LEGS: Record<string, [number, number][]> = {
  shopFw: [[320, 230], [470, 230]],
  fwSof: [[640, 330], [640, 500]],
  sofHold: [[520, 620], [330, 620]],
  sofAppr: [[820, 620], [920, 620], [920, 260], [1000, 260]],
  apprSup: [[1150, 360], [1150, 500]],
  apprPrn: [[1000, 260], [920, 260], [920, 820], [1100, 820], [1100, 880]],
  apprBrn: [[1000, 260], [920, 260], [920, 820], [635, 820], [635, 880]],
};

const NODE_NAME: Record<NodeId, string> = { sof: 'SOF checker', approval: 'Approval', hold: 'On hold', suppliers: 'Suppliers', printer: 'Printer', branches: 'Branch handovers' };
const COUNT_LABEL: Record<NodeId, string> = { approval: 'awaiting', sof: 'to review', hold: 'on hold', suppliers: 'PO', printer: 'pick slip', branches: 'handover' };
const EXEC_NODE = { po_branch: 'suppliers', po_direct: 'suppliers', requisition: 'suppliers', pick_slip: 'printer', handover: 'branches' } as const;
const EXEC_LEG = { po_branch: 'apprSup', po_direct: 'apprSup', requisition: 'apprSup', pick_slip: 'apprPrn', handover: 'apprBrn' } as const;
const RUNNING = ['approved', 'in_progress', 'failed', 'done'];

function nodeOf(o: RoutingOrder): NodeId {
  if (o.state === 'awaiting_approval') return 'approval';
  if (o.state === 'on_hold') return 'hold';
  if (RUNNING.includes(o.state) && o.action) return EXEC_NODE[o.action];
  return 'sof';
}

// Legs travelled (solid) and the next one (dashed, moving).
function routeOf(o: RoutingOrder): { legs: string[]; done: number } {
  const exec = o.action ? EXEC_LEG[o.action] : null;
  if (o.state === 'on_hold') return { legs: ['shopFw', 'fwSof', 'sofHold'], done: 3 };
  if (o.state === 'awaiting_approval') return { legs: ['shopFw', 'fwSof', 'sofAppr', ...(exec ? [exec] : [])], done: 3 };
  if (RUNNING.includes(o.state) && exec) return { legs: ['shopFw', 'fwSof', 'sofAppr', exec], done: o.state === 'approved' ? 3 : 4 };
  return { legs: ['shopFw', 'fwSof'], done: 2 };
}

const block = (id: NodeId) => BLOCKS.find(b => b.id === id)!;
const centre = (id: NodeId) => { const b = block(id); return { x: b.x + b.w / 2, y: b.y + b.d / 2, z: b.h }; };
const points = (legs: string[]) => legs.map(l => LEGS[l].map(([x, y]) => { const p = project(x, y); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' '));
const label = (o: RoutingOrder) => o.customerOrderNo ?? o.orderNo;

export default function RoutingMap({ rows }: { rows: RoutingOrder[] }) {
  const canAct = useCanAct();
  const { run, isBusy } = useRoutingAction();
  const first = rows.find(r => DECIDABLE.includes(r.state)) ?? rows[0];
  const [sel, setSel] = useState<{ node: NodeId | null; id: number | null }>({ node: first ? nodeOf(first) : null, id: first?.id ?? null });
  const [hover, setHover] = useState<NodeId | null>(null);

  // Shrink the fixed-size stage to fit the map box; it stays centred.
  const box = useRef<HTMLElement>(null);
  const [fit, setFit] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setFit(Math.min(1.15, e.contentRect.width / STAGE.w)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const byNode = new Map<NodeId, RoutingOrder[]>();
  rows.forEach(r => { const n = nodeOf(r); byNode.set(n, [...(byNode.get(n) ?? []), r]); });
  const order = rows.find(r => r.id === sel.id) ?? null;
  const nodeOrders = sel.node ? byNode.get(sel.node) ?? [] : [];
  const route = order ? routeOf(order) : null;

  const pickNode = (n: NodeId) => setSel({ node: n, id: null });
  const pickOrder = (o: RoutingOrder) => setSel({ node: nodeOf(o), id: o.id });
  // After a decision, go straight to the next order waiting on one.
  const nextAfter = (id: number) => rows.find(r => r.id !== id && DECIDABLE.includes(r.state) && r.action) ?? null;
  async function decide(o: RoutingOrder, verb: 'approve' | 'reject' | 'retry', done: string) {
    const next = nextAfter(o.id);
    if (await run(o.id, verb, {}, done)) setSel(next ? { node: nodeOf(next), id: next.id } : { node: sel.node, id: null });
  }

  const pin = order ? (() => { const c = centre(nodeOf(order)); return project(c.x, c.y, c.z); })() : null;

  return (
    <div className="flex flex-wrap items-start gap-4">
      <section
        ref={box}
        aria-label="Routing map"
        className="relative min-w-0 flex-[999_1_600px] overflow-hidden rounded-xl border border-frame bg-[oklch(0.985_0.004_252)]"
        style={{ height: Math.max(420, STAGE.h * fit) }}
      >
        <div className="absolute left-1/2 top-0" style={{ width: STAGE.w, height: STAGE.h, transform: `translateX(-50%) scale(${fit})`, transformOrigin: 'top center' }}>
          {/* The floor */}
          <div className="absolute" style={{ left: CENTER.x, top: CENTER.y }}>
            <div
              className="absolute"
              style={{
                left: -PLANE.w / 2, top: -PLANE.h / 2, width: PLANE.w, height: PLANE.h, transformStyle: 'preserve-3d',
                transform: `scale(${PLANE.scale}) rotateX(60deg) rotateZ(-45deg)`,
                backgroundColor: 'var(--color-surface)',
                backgroundImage: 'linear-gradient(var(--color-hair) 1px, transparent 1px), linear-gradient(90deg, var(--color-hair) 1px, transparent 1px)',
                backgroundSize: '50px 50px',
              }}
            >
              {ROADS.map(([x, y, w, h], i) => (
                <div key={i} className="absolute box-border border border-frame bg-white" style={{ left: x, top: y, width: w, height: h, transform: 'translateZ(1px)' }} />
              ))}
              {BLOCKS.map(b => {
                const on = !!b.id && b.id === sel.node;
                const t = on ? { ...SOF, top: 'white', ink: 'var(--color-primary)' } : b.tone ?? {};
                const lift = b.id && (on || hover === b.id) ? 8 : 0;
                return (
                  <div
                    key={b.label}
                    className={`absolute transition-transform duration-150 motion-reduce:transition-none ${b.id ? 'cursor-pointer' : ''}`}
                    style={{ left: b.x, top: b.y, width: b.w, height: b.d, transformStyle: 'preserve-3d', transform: `translateZ(${lift}px)` }}
                    onClick={b.id ? () => pickNode(b.id!) : undefined}
                    onMouseEnter={b.id ? () => setHover(b.id) : undefined}
                    onMouseLeave={b.id ? () => setHover(null) : undefined}
                  >
                    <div className="absolute top-0 h-full" style={{ left: -b.h, width: b.h, transformOrigin: '100% 50%', transform: 'rotateY(90deg)', background: t.left ?? 'oklch(0.895 0.010 252)' }} />
                    <div className="absolute left-0 top-full w-full" style={{ height: b.h, transformOrigin: '50% 0', transform: 'rotateX(90deg)', background: t.front ?? 'oklch(0.930 0.008 252)' }} />
                    <div
                      className="absolute inset-0 box-border flex items-end p-3"
                      style={{
                        transform: `translateZ(${b.h}px)`,
                        background: t.top ?? 'white',
                        border: on ? '4px solid var(--color-primary)' : `1.5px solid ${b.id === 'sof' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      }}
                    >
                      <span className="font-mono text-[20px] tracking-[0.06em]" style={{ color: t.ink ?? 'var(--color-muted)' }}>{b.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* The selected order's route, drawn over the floor so blocks never hide it */}
          {route && (
            <svg aria-hidden="true" className="pointer-events-none absolute inset-0" width={STAGE.w} height={STAGE.h}>
              {points(route.legs.slice(0, route.done)).map((p, i) => (
                <g key={i}>
                  <polyline points={p} fill="none" stroke="var(--color-primary)" strokeOpacity={0.15} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" />
                  <polyline points={p} fill="none" stroke="var(--color-primary)" strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
                </g>
              ))}
              {points(route.legs.slice(route.done)).map((p, i) => (
                <polyline key={i} points={p} fill="none" stroke="var(--color-primary)" strokeWidth={3} strokeDasharray="8 7" strokeLinejoin="round" className="motion-safe:animate-[routing-flow_1s_linear_infinite]" />
              ))}
              {route.legs.map(l => { const p = project(...LEGS[l][0]); return <circle key={l} cx={p.x} cy={p.y} r={5} fill="white" stroke="var(--color-primary)" strokeWidth={3} />; })}
            </svg>
          )}

          {/* One count per step, above the route: the way in to that step's orders */}
          {[...byNode.entries()].map(([n, list]) => {
            const c = centre(n), p = project(c.x, c.y, c.z + (n === sel.node ? 8 : 0)), on = n === sel.node, failed = list.some(o => o.state === 'failed');
            return (
              <button
                key={n}
                type="button"
                onClick={() => pickNode(n)}
                aria-pressed={on}
                aria-label={`${list.length} ${COUNT_LABEL[n]} at ${NODE_NAME[n]}`}
                className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold shadow-raised focus-visible:shadow-focus-ring focus-visible:outline-none ${on ? 'bg-primary text-white' : 'bg-ink text-white hover:bg-primary-deep'}`}
                style={{ left: p.x, top: p.y }}
              >
                {failed && <span aria-hidden="true" className="size-2 rounded-full bg-[oklch(0.700_0.180_22)]" />}
                {list.length} {COUNT_LABEL[n]}
              </button>
            );
          })}

          {/* Floating card over the selected order's stop */}
          {order && pin && (
            <div className="pointer-events-none absolute flex w-[280px] flex-col gap-1.5 rounded-xl border border-frame bg-white px-4 py-3 shadow-raised" style={{ left: Math.min(STAGE.w - 288, Math.max(8, pin.x - 140)), top: Math.max(8, pin.y - 120) }}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[0.9375rem] font-medium">{label(order)}</span>
                <StatusPill tone={stateMeta(order.state).tone}>{stateMeta(order.state).label}</StatusPill>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="font-semibold">{order.customerName ?? '—'}</span>
                <span className="font-semibold">{actionLabel(order.action)}</span>
              </div>
            </div>
          )}
        </div>

        {!rows.length && <p className="absolute inset-x-0 top-6 text-center text-sm text-muted">No open orders right now.</p>}
        <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-xs tracking-[0.04em] text-muted">BRANCH 20 | OPEN ORDERS: {rows.length}</div>
        <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-white/80 px-2 py-1 text-xs text-muted">Click a step to see its orders</div>
      </section>

      <aside aria-label={order ? 'Selected order' : 'Orders at this step'} className="flex min-w-0 max-w-[380px] flex-[1_1_320px] flex-col gap-4 rounded-xl border border-frame bg-white p-[18px] shadow-card">
        {order ? (
          <OrderPanel
            o={order}
            canAct={canAct}
            isBusy={isBusy}
            back={nodeOrders.length > 1 ? () => setSel({ node: sel.node, id: null }) : undefined}
            backLabel={sel.node ? NODE_NAME[sel.node] : ''}
            onDecide={decide}
            next={nextAfter(order.id)}
            onNext={pickOrder}
          />
        ) : sel.node ? (
          <>
            <div>
              <h2 className="text-[0.9375rem] font-semibold">{NODE_NAME[sel.node]}</h2>
              <p className="text-sm text-muted">{nodeOrders.length} order{nodeOrders.length === 1 ? '' : 's'} here</p>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {nodeOrders.map(o => (
                <li key={o.id}>
                  <button type="button" onClick={() => pickOrder(o)} className="flex w-full flex-col gap-1 rounded-lg border border-frame p-3 text-left hover:bg-surface-hover focus-visible:shadow-focus-ring focus-visible:outline-none">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-medium">{label(o)}</span>
                      <StatusPill tone={stateMeta(o.state).tone}>{stateMeta(o.state).label}</StatusPill>
                    </span>
                    <span className="flex justify-between gap-2 text-[0.8125rem]">
                      <span>{o.customerName ?? '—'}</span>
                      <span className="text-muted">{o.action ? actionLabel(o.action) : o.holdReason ?? 'No action yet'}</span>
                    </span>
                    {!!o.flags?.length && <span className="text-xs text-pending">{o.flags.length} flag{o.flags.length === 1 ? '' : 's'}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="py-10 text-center text-sm text-muted">Click a step on the map to see its orders.</p>
        )}
      </aside>
    </div>
  );
}

function OrderPanel({ o, canAct, isBusy, back, backLabel, onDecide, next, onNext }: {
  o: RoutingOrder;
  canAct: boolean;
  isBusy: (id: number, verb: 'approve' | 'reject' | 'retry') => boolean;
  back?: () => void;
  backLabel: string;
  onDecide: (o: RoutingOrder, verb: 'approve' | 'reject' | 'retry', done: string) => void;
  next: RoutingOrder | null;
  onNext: (o: RoutingOrder) => void;
}) {
  const meta = stateMeta(o.state);
  const decidable = DECIDABLE.includes(o.state) && !!o.action;
  const lines = (o.lines ?? []).filter(l => !l.skip);
  const sub = actionSub(o);

  return (
    <>
      {back && (
        <button type="button" onClick={back} className="-mb-1 inline-flex items-center gap-1 self-start text-[0.8125rem] text-primary hover:underline">
          <ChevronLeft className="size-4" />All at {backLabel}
        </button>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="m-0 font-mono text-xl font-medium">{label(o)}</h2>
          <span className="text-muted">{o.customerName ?? '—'} · SO {o.orderNo}</span>
        </div>
        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
      </div>

      <div className="rounded-lg bg-surface p-3">
        <div className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">{decidable ? 'Proposed action' : 'Action'}</div>
        <div className="mt-0.5 font-semibold">{o.action ? actionLabel(o.action) : o.holdReason ?? 'No action yet'}</div>
        {sub && sub !== o.holdReason && <div className="text-[0.8125rem] text-muted">{sub}</div>}
        <div className="mt-2 flex gap-4 text-[0.8125rem]">
          <span><span className="font-semibold">{lines.length}</span> line{lines.length === 1 ? '' : 's'}</span>
          {o.detail?.poValue != null && <span className="font-mono">${o.detail.poValue.toFixed(2)}</span>}
          {o.brand && <span>{o.brand}</span>}
        </div>
      </div>

      {!!o.flags?.length && (
        <div className="flex flex-col gap-1.5">
          {o.flags.map(f => <div key={f} className="rounded-lg bg-pending-bg px-2.5 py-1.5 text-[0.8125rem] text-pending">{f}</div>)}
        </div>
      )}
      {o.error && <div className="rounded-lg bg-failed-bg px-2.5 py-1.5 text-[0.8125rem] text-failed">{o.error}</div>}

      {canAct && (decidable || o.state === 'failed') && (
        <div className="flex flex-wrap gap-2">
          {decidable && (
            <button type="button" disabled={isBusy(o.id, 'approve')} onClick={() => onDecide(o, 'approve', `${label(o)} approved`)} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-deep disabled:opacity-50">
              {isBusy(o.id, 'approve') ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Approve
            </button>
          )}
          {o.state === 'failed' && (
            <button type="button" disabled={isBusy(o.id, 'retry')} onClick={() => onDecide(o, 'retry', 'Queued to run again')} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-deep disabled:opacity-50">
              {isBusy(o.id, 'retry') ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}Retry
            </button>
          )}
          <button type="button" disabled={isBusy(o.id, 'reject')} onClick={() => onDecide(o, 'reject', `${label(o)} rejected, do it in Frameworks`)} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-frame-input px-4 text-sm font-medium text-ink hover:bg-surface-hover disabled:opacity-50">
            <X className="size-4" />Reject
          </button>
        </div>
      )}
      <div className="flex items-center justify-between gap-2 text-[0.8125rem]">
        <Link href={`/order-routing/${o.id}`} className="inline-flex items-center gap-1 text-primary hover:underline">
          <FileText className="size-4" />{decidable ? 'Change action or email' : 'Full details'}
        </Link>
        {next && (
          <button type="button" onClick={() => onNext(next)} className="inline-flex items-center gap-1 text-primary hover:underline">
            Next: <span className="font-mono">{label(next)}</span><ArrowRight className="size-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-hair pt-3">
        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">Journey</span>
        <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
          {(o.history ?? []).slice(-5).map((h, i, a) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <span aria-hidden="true" className={`mt-1.5 size-2.5 shrink-0 rounded-full ${i === a.length - 1 ? 'bg-pending' : 'bg-primary'}`} />
              <span className={`flex-1 ${i === a.length - 1 ? 'font-medium' : ''}`}>{h.text}</span>
              <span className="whitespace-nowrap font-mono text-xs text-muted">{fmtTime(h.at)}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
