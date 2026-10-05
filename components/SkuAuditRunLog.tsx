'use client';
import { ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// The latest run's step-by-step log from sof-api: counts per Frameworks branch,
// Catsy pages, each Shopify store, and the error if it failed.
export default function SkuAuditRunLog({ log, status, finished }: { log?: string[]; status?: string; finished: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="shrink-0">
          <ScrollText />
          Run log
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-frame">
          <DialogTitle>Latest run log</DialogTitle>
          <DialogDescription>
            {status ? `${status === 'failed' ? 'Failed' : 'Finished'} ${finished}. ` : ''}
            Each step with its counts, so you can see where SKUs drop off or where it errored.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto px-6 py-4">
          {log?.length ? (
            <pre className="text-xs leading-relaxed whitespace-pre-wrap break-words font-mono text-ink">
              {log.map((line, i) => (
                <div key={i} className={line.includes('FAILED') ? 'text-failed font-medium' : undefined}>
                  {line}
                </div>
              ))}
            </pre>
          ) : (
            <p className="text-sm text-muted">No log for this run. Runs made before logging was added don&apos;t have one.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
