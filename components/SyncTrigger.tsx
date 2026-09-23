'use client';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SyncModal from './SyncModal';

export default function SyncTrigger() {
  const [open, setOpen] = useState(false);
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
