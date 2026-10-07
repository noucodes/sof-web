import SyncStatusView from '@/components/SyncStatusView';

export default function B2BSyncPage() {
  return (
    <SyncStatusView
      endpoint="/api/b2b-sync/status"
      title="B2B Price Sync"
      description="Catsy trade prices pushed into Shopify's B2B price list, every 12 hours."
      failedLabel="Unmatched"
    />
  );
}
