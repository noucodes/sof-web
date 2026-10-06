import type { Role } from '@/lib/session';

// What each role means, in the words the Users and profile pages show.
// sof-api enforces the same split: ViewerReadOnlyGuard + @Roles('admin').
export const ROLES: { key: Role; label: string; summary: string; can: string[] }[] = [
  {
    key: 'admin',
    label: 'Admin',
    summary: 'Everything, plus managing people.',
    can: ['Everything an Operator can do', 'Add people, change roles, reset passwords', 'See User activity'],
  },
  {
    key: 'operator',
    label: 'Operator',
    summary: 'Day-to-day work: sees every page and can press every action.',
    can: ['Retry orders and ShipStation jobs', 'Sync from Shopify, verify prices', 'Fix missing shipments, mark orders shipped', 'Run the SKU audit'],
  },
  {
    key: 'viewer',
    label: 'Viewer',
    summary: 'Read-only: sees every page but can’t change anything.',
    can: ['See Orders, Payments, Contribution, ShipStation, B2B sync and SKU audit', 'Download exports'],
  },
];

export const roleLabel = (r: string) => ROLES.find(x => x.key === r)?.label ?? r;
