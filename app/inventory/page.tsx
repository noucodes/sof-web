import SyncStatusView from '@/components/SyncStatusView';

export default function InventoryPage() {
  return (
    <SyncStatusView
      endpoint="/api/inventory-sync/status"
      title="Inventory Sync"
      description="Stock on hand from Frameworks (branches 8 & 20) pushed to ShipStation, every hour. Only SKUs whose stock changed are sent."
      failedLabel="Failed"
    />
  );
}
