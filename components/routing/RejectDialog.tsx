'use client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Rejecting a suggestion asks what should happen instead. The comment goes in
// the order's history and is how the routing rules get corrected.
export default function RejectDialog({ label, busy, onReject, onClose }: {
  label: string;
  busy: boolean;
  onReject: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const ok = reason.trim().length > 0;

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reject the suggestion for {label}</DialogTitle>
          <DialogDescription>Say why it’s wrong and what should be done instead, e.g. “Branch 11 has it, print a pick slip there”. You’ll still do this one in Frameworks.</DialogDescription>
        </DialogHeader>
        <label className="flex flex-col gap-1.5 px-4 py-4 sm:px-6">
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.07em] text-muted">What should be done instead</span>
          <textarea
            autoFocus
            rows={4}
            maxLength={500}
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="resize-y rounded-lg border-[1.5px] border-frame-input bg-white px-3 py-2 text-sm focus:border-primary focus:shadow-focus-ring focus:outline-none"
          />
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!ok || busy} onClick={() => onReject(reason.trim())}>
            {busy && <Loader2 className="animate-spin" />}Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
