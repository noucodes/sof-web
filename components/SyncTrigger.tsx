'use client';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SyncModal from './SyncModal';
import { useCanAct } from '@/components/RoleProvider';

export default function SyncTrigger() {
  const canAct = useCanAct();
  const [open, setOpen] = useState(false);
  if (!canAct) return null; // viewers are read-only
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <RefreshCw />
        Sync
      </Button>
      {open && <SyncModal onClose={() => setOpen(false)} />}
    </>
  );
}
