'use client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCanAct } from '@/components/RoleProvider';
import { ACTIONS, DECIDABLE, type RoutingAction, type RoutingOrder } from '@/lib/routing';
import RejectDialog from './RejectDialog';
import { useRoutingAction } from './useRoutingAction';

const SHIP_TO_US = 'Burdens Ecommerce, 203 Frankston Dandenong Road, Dandenong South VIC 3175';

// The supplier email from Bek's skill, filled in once Frameworks gives the PO number.
function defaultEmail(o: RoutingOrder, action: RoutingAction | '') {
  if (action === 'po_direct') {
    return `Hi team,\n\nPlease see attached PO [PO number]. Please deliver this order direct to the end customer: ${o.detail?.shipTo ?? '[customer name and address]'}.\n\nThanks,\nBurdens Ecommerce`;
  }
  return `Hi team,\n\nPlease see attached PO [PO number] for delivery to ${SHIP_TO_US}.\n\nThanks,\nBurdens Ecommerce`;
}

// Action dropdown, supplier email and the Approve / Reject / Retry buttons on an order's page.
export default function RoutingDecision({ order }: { order: RoutingOrder }) {
  const canAct = useCanAct();
  const { run, isBusy } = useRoutingAction();
  const [action, setAction] = useState<RoutingAction | ''>(order.action ?? '');
  const [email, setEmail] = useState(order.detail?.emailBody ?? defaultEmail(order, order.action ?? ''));
  const [rejecting, setRejecting] = useState(false);
  const decidable = DECIDABLE.includes(order.state);
  const isPo = action === 'po_branch' || action === 'po_direct';
  const label = order.customerOrderNo ?? order.orderNo;

  function pick(a: RoutingAction | '') {
    // Swap the email template with the action, unless it's been edited.
    if (email === defaultEmail(order, action)) setEmail(defaultEmail(order, a));
    setAction(a);
  }

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
          onChange={e => pick(e.target.value as RoutingAction | '')}
          className="h-9 rounded-lg border-[1.5px] border-frame-input bg-white px-3 text-sm focus:border-primary focus:shadow-focus-ring focus:outline-none"
        >
          {!order.action && <option value="">Choose an action</option>}
          {ACTIONS.map(a => <option key={a.action} value={a.action}>{a.label}</option>)}
        </select>
      </label>

      {isPo && (
        <label className="flex flex-col gap-1">
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">Email to supplier</span>
          <textarea
            rows={7}
            value={email}
            disabled={!canAct}
            onChange={e => setEmail(e.target.value)}
            className="resize-y rounded-lg border-[1.5px] border-frame-input bg-white px-3 py-2 text-sm focus:border-primary focus:shadow-focus-ring focus:outline-none"
          />
          <span className="text-xs text-muted">Sent with the PO attached once you approve. [PO number] is filled in when Frameworks creates it.</span>
        </label>
      )}

      {canAct && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setRejecting(true)}>Reject</Button>
          <Button
            disabled={!action || isBusy(order.id, 'approve')}
            onClick={() => run(order.id, 'approve', { action, ...(isPo && { emailBody: email }) }, `${label} approved`)}
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
