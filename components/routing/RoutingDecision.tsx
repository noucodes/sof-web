'use client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCanAct } from '@/components/RoleProvider';
import { ACTIONS, DECIDABLE, approveSteps, type RoutingAction, type RoutingOrder } from '@/lib/routing';
import RejectDialog from './RejectDialog';
import { useRoutingAction } from './useRoutingAction';

// Action dropdown, what approving does, and the Approve / Reject / Retry buttons on an order's page.
export default function RoutingDecision({ order }: { order: RoutingOrder }) {
  const canAct = useCanAct();
  const { run, isBusy } = useRoutingAction();
  const [action, setAction] = useState<RoutingAction | ''>(order.action ?? '');
  const [rejecting, setRejecting] = useState(false);
  const decidable = DECIDABLE.includes(order.state);
  const label = order.customerOrderNo ?? order.orderNo;

  if (!decidable) {
    return canAct && order.state === 'failed' ? (
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={isBusy(order.id, 'reject')} onClick={() => run(order.id, 'reject', {}, `${label} rejected`)}>Reject, I’ll do it in Frameworks</Button>
        <Button disabled={isBusy(order.id, 'retry')} onClick={() => run(order.id, 'retry', {}, 'Queued to run again')}>
          {isBusy(order.id, 'retry') && <Loader2 className="animate-spin" />}Retry
        </Button>
      </div>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex max-w-xs flex-col gap-1">
        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">Action</span>
        <select
          value={action}
          disabled={!canAct}
          onChange={e => setAction(e.target.value as RoutingAction | '')}
          className="h-9 rounded-lg border-[1.5px] border-frame-input bg-white px-3 text-sm focus:border-primary focus:shadow-focus-ring focus:outline-none"
        >
          {!order.action && <option value="">Choose an action</option>}
          {ACTIONS.map(a => <option key={a.action} value={a.action}>{a.label}</option>)}
        </select>
      </label>

      {action && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">When you approve</span>
          <ol className="m-0 flex list-decimal flex-col gap-1 pl-5 text-sm">
            {approveSteps(order, action).map(s => (
              <li key={s.text}>
                {s.text}{' '}
                <span className={`rounded px-1.5 py-0.5 text-[0.6875rem] font-medium ${s.auto ? 'bg-success-bg text-success' : 'bg-pending-bg text-pending'}`}>
                  {s.auto ? 'Automatic' : 'You, in Frameworks for now'}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {canAct && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setRejecting(true)}>Reject</Button>
          <Button
            disabled={!action || isBusy(order.id, 'approve')}
            onClick={() => run(order.id, 'approve', { action }, `${label} approved`)}
          >
            {isBusy(order.id, 'approve') && <Loader2 className="animate-spin" />}
            Approve{action ? `: ${ACTIONS.find(a => a.action === action)!.label}` : ''}
          </Button>
        </div>
      )}
      {rejecting && (
        <RejectDialog
          label={label}
          busy={isBusy(order.id, 'reject')}
          onClose={() => setRejecting(false)}
          onReject={async reason => { if (await run(order.id, 'reject', { reason }, `${label} rejected`)) setRejecting(false); }}
        />
      )}
    </div>
  );
}
