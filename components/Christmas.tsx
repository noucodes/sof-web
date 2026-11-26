'use client';

import { useEffect } from 'react';

// Small Christmas touch (garland, Santa hat, a few decorations), styled in app/christmas.css.
// On from 1 Dec 2026 to 6 Jan 2027 (Melbourne) only; NEXT_PUBLIC_XMAS=off turns it off any time.
// ponytail: date-gated; delete this file, app/christmas.css and public/xmas after the season.
const FROM = Date.parse('2026-12-01T00:00:00+11:00');
const UNTIL = Date.parse('2027-01-07T00:00:00+11:00');

export function ChristmasLook() {
  useEffect(() => {
    const now = Date.now();
    if (process.env.NEXT_PUBLIC_XMAS !== 'off' && now >= FROM && now < UNTIL) document.documentElement.dataset.xmas = '';
  }, []);
  return null;
}
