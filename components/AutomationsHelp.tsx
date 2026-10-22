'use client';
import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function Term({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 text-sm">
      <dt className="font-medium text-ink">{name}</dt>
      <dd className="text-muted">{children}</dd>
    </div>
  );
}

export default function AutomationsHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="How automations work" className="h-7 w-7 text-muted">
          <CircleHelp />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-frame">
          <DialogTitle>How automations work</DialogTitle>
          <DialogDescription>Jobs that run on a schedule by themselves and report back here after every run.</DialogDescription>
        </DialogHeader>
        <dl className="px-6 py-5 space-y-3">
          <Term name="Healthy">The last run finished and everything it tried to update went through.</Term>
          <Term name="Failed">
            The last run stopped with an error, or some items didn&apos;t go through. Failed items are tried again on the next
            run, so one failed run on its own is usually nothing to worry about.
          </Term>
          <Term name="Never run">The job hasn&apos;t reported back yet, for example because it was only just set up.</Term>
          <Term name="Updated">How many items the last run changed. Only items that changed since the run before are sent.</Term>
        </dl>
      </DialogContent>
    </Dialog>
  );
}
