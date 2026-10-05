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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {children}
    </section>
  );
}

function Term({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9.5rem_1fr] gap-3 text-sm">
      <dt className="font-medium text-ink">{name}</dt>
      <dd className="text-muted">{children}</dd>
    </div>
  );
}

export default function SkuAuditHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="How the SKU audit works" className="h-7 w-7 text-muted">
          <CircleHelp />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-frame">
          <DialogTitle>How the SKU audit works</DialogTitle>
          <DialogDescription>
            Every product in Catsy, checked against Frameworks (stock) and each Shopify store (what&apos;s on the website).
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-5 space-y-6">
          <Section title="When it runs">
            <p className="text-sm text-muted">
              Automatically every day at 5am, or straight away with <span className="font-medium text-ink">Run now</span> (admins
              only). A run takes a few minutes because it reads every product from Frameworks, Catsy and all three Shopify stores.
              The page always shows the last successful run.
            </p>
          </Section>

          <Section title="Columns">
            <dl className="space-y-2">
              <Term name="SKU">The product code as it appears in Catsy (the Burdens SKU).</Term>
              <Term name="Title">
                The product&apos;s Current Title in Catsy. When it&apos;s empty, the Frameworks description is shown instead; when
                the two differ, the Frameworks description is shown underneath in grey.
              </Term>
              <Term name="Frameworks">
                <span className="font-medium text-ink">Stocked</span>: Stocked in at least one branch (kept on the shelf).{' '}
                <span className="font-medium text-ink">Non-stocked</span>: in Frameworks but not Stocked in any branch, usually
                ordered in from the supplier when sold.{' '}
                <span className="font-medium text-ink">Not in Frameworks</span>: the SKU doesn&apos;t exist there, usually a typo or
                a deleted product. The small line underneath shows each branch&apos;s own stock type, e.g. &quot;8: Stocked · 20:
                Non-Stocked&quot;.
              </Term>
              <Term name="Burdens / BHQ / PHQ">
                One column per Shopify store. The pill is the product&apos;s status on that store:{' '}
                <span className="font-medium text-ink">Live</span>, <span className="font-medium text-ink">Draft</span>,{' '}
                <span className="font-medium text-ink">Archived</span> or <span className="font-medium text-ink">Not listed</span>.
                The small line underneath is the store&apos;s &quot;Enabled&quot; switch in Catsy (on / off, or ? if unknown).
                A red pill means the two disagree.
              </Term>
            </dl>
          </Section>

          <Section title="Tabs">
            <dl className="space-y-2">
              <Term name="All">Every Catsy SKU.</Term>
              <Term name="Stocked / Non-stocked / Not in Frameworks">Only SKUs with that Frameworks status.</Term>
            </dl>
            <p className="text-sm text-muted">Pick a store from the dropdown to see three more tabs for that store:</p>
            <dl className="space-y-2">
              <Term name="Enabled, not live">
                Switched on for the store in Catsy, but not live on its Shopify site (missing, draft or archived). These should
                probably be published.
              </Term>
              <Term name="Live, not enabled">
                Live on the Shopify site, but switched off for that store in Catsy. Either Catsy needs switching on, or the product
                should come down.
              </Term>
              <Term name="On Shopify, not in Catsy">
                On the Shopify site but not in Catsy at all. These won&apos;t get updates from Catsy until they&apos;re added.
              </Term>
            </dl>
          </Section>

          <Section title="Column filters">
            <p className="text-sm text-muted">
              Click a store column heading (Burdens, BHQ, PHQ) to filter by its Shopify status (Live, Draft, Archived, Not
              listed) and/or its Catsy Enabled switch (On, Off, Unknown). A highlighted heading has a filter on. Filters on
              several columns combine, and they stack with the tab, store and search, e.g. &quot;Live on Burdens but switched
              off for BHQ&quot;. <span className="font-medium text-ink">Clear column filters</span> removes them all. The tab
              counts don&apos;t change with column filters; the total under the table does.
            </p>
          </Section>

          <Section title="Searching and downloading">
            <p className="text-sm text-muted">
              Search matches the SKU, the Catsy title or the Frameworks description. The table shows 500 rows at a time; use{' '}
              <span className="font-medium text-ink">Previous</span> / <span className="font-medium text-ink">Next</span> to page
              through. <span className="font-medium text-ink">Download CSV</span> exports everything for the current store, tab and
              search, including each SKU&apos;s Vendor Catalog No.
            </p>
          </Section>

          <Section title="Good to know">
            <ul className="list-disc pl-5 text-sm text-muted space-y-1">
              <li>SKUs are matched ignoring upper/lower case and spaces.</li>
              <li>
                BathroomHQ&apos;s Shopify uses the supplier&apos;s catalogue number as the SKU, so it&apos;s matched against
                Catsy&apos;s Vendor Catalog No. Burdens and PHQ use the Burdens SKU.
              </li>
              <li>
                &quot;Catsy ?&quot; means the Enabled switch couldn&apos;t be read for that store. Those SKUs are never counted as
                mismatches.
              </li>
              <li>
                A small number of Frameworks products with broken cost values can&apos;t be read, so they may show as &quot;Not in
                Frameworks&quot; even though they exist.
              </li>
              <li>If a store couldn&apos;t be read from Shopify, the error shows when you pick that store.</li>
            </ul>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
