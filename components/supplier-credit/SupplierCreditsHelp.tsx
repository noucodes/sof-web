'use client';
import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {children}
    </section>
  );
}

export default function SupplierCreditsHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="How supplier credits work" className="h-7 w-7 text-muted">
          <CircleHelp />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="border-b border-frame px-4 pb-4 pt-6 sm:px-6">
          <DialogTitle>How supplier credits work</DialogTitle>
          <DialogDescription>Customer credits checked for a supplier Stock Return. Test mode: approving raises the Stock Return on Frameworks TEST, not live.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
          <Section title="Steps">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
              <li>Add completed customer credit numbers at the top.</li>
              <li>The automation reads a credit from Frameworks within a minute of it being added and writes a plan. Every 30 minutes in business hours it checks the ones awaiting approval again.</li>
              <li>Open a credit (the arrow) to see each line, its stock type at the branch, stock on hand and what to do.</li>
              <li>Approve the plan, or reject it with what should happen instead. Rejection comments are how the rules get fixed.</li>
              <li>Approving raises the Stock Return on Frameworks TEST within a minute (one per supplier, ref = branch prefix + original PO). Its PO number shows in the credit&apos;s history. If it fails, the reason shows there and you can approve again to retry.</li>
            </ol>
          </Section>
          <Section title="What each line gets">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              <li><span className="font-medium text-ink">Return to supplier</span>: NOT Stocked at the credit&apos;s branch, so it goes back on a Stock Return (one per supplier).</li>
              <li><span className="font-medium text-ink">Back on the shelf</span>: stocked at the branch. Nothing to return.</li>
              <li><span className="font-medium text-ink">Check first</span>: the branch has less stock on hand than was credited, so it has probably been returned or sold already. Any Stock Returns to that supplier around the credit date are listed to check.</li>
            </ul>
            <p className="text-sm text-muted">Restocking fees, delivery and discount lines are ignored.</p>
          </Section>
          <Section title="Flags">
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              <li>Credits older than 4 weeks (outside the supplier claim window).</li>
              <li>A Reason For Credit that isn&apos;t mapped to a Stock Return reason: you choose it.</li>
              <li>The original PO and supplier invoice # can&apos;t be read automatically yet: confirm them in Frameworks. The Stock Return Ref is the branch prefix (e.g. RWD, ECM for E-commerce) plus the original PO.</li>
            </ul>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
