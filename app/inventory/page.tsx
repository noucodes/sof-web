import { redirect } from 'next/navigation';

// The Inventory page became the Automations section; keep old links working.
export default function InventoryPage() {
  redirect('/automations');
}
