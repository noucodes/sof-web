'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Records each page a signed-in user opens, for Admin › User activity.
// Path only: query strings can hold searches and aren't needed for "where they go".
export default function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);
  return null;
}
