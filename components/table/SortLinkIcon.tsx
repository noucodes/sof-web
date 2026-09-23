'use client';
import { useLinkStatus } from 'next/link';
import { SortIcon, Spinner } from './icons';

// Must render inside a <Link> — useLinkStatus reads that Link's pending
// navigation state. Sorting here re-fetches the whole dataset server-side
// (see OrdersService.findAll), so it's worth a visible cue.
export default function SortLinkIcon({ direction }: { direction: 'asc' | 'desc' | null }) {
  const { pending } = useLinkStatus();
  return pending ? <Spinner /> : <SortIcon direction={direction} />;
}
