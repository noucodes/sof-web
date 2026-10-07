'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  HandCoins,
  Boxes,
  Ship,
  ArrowLeftRight,
  ListChecks,
  Users,
  Activity,
} from 'lucide-react';
import { VERSION } from '@/lib/changelog';
import NavUser from '@/components/NavUser';
import { useRole } from '@/components/RoleProvider';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';

type Icon = typeof LayoutDashboard;
type NavItem = { href: string; label: string; icon: Icon };

// Top-level links, and collapsible groups whose icon stands in for the group
// when the sidebar is collapsed to icons.
const NAV: (NavItem | { label: string; icon: Icon; admin?: boolean; items: NavItem[] })[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Orders',
    icon: ShoppingCart,
    items: [
      { href: '/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/payments', label: 'Payments', icon: CreditCard },
      { href: '/contribution', label: 'Contribution', icon: HandCoins },
      { href: '/shipstation', label: 'ShipStation', icon: Ship },
    ],
  },
  {
    label: 'Products & stock',
    icon: Boxes,
    items: [
      { href: '/inventory', label: 'Inventory', icon: Boxes },
      { href: '/b2b-sync', label: 'B2B Price Sync', icon: ArrowLeftRight },
      { href: '/sku-audit', label: 'SKU Audit', icon: ListChecks },
    ],
  },
  {
    label: 'Admin',
    icon: ShieldCheck,
    admin: true,
    items: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/activity', label: 'User activity', icon: Activity },
    ],
  },
];

const ACTIVE = 'data-[active=true]:bg-primary-wash data-[active=true]:text-primary';
const isActive = (pathname: string, href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

// Opens on the group holding the current page. Clicking a group while the
// sidebar is collapsed to icons expands the sidebar with that group open.
function NavGroup({ label, icon: Icon, items, pathname }: { label: string; icon: Icon; items: NavItem[]; pathname: string }) {
  const current = items.some(i => isActive(pathname, i.href));
  const [open, setOpen] = useState(current);
  const { state, setOpen: setSidebarOpen } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={label}
        aria-expanded={open}
        isActive={collapsed && current}
        className={ACTIVE}
        onClick={() => {
          if (collapsed) { setSidebarOpen(true); setOpen(true); } else setOpen(o => !o);
        }}
      >
        <Icon />
        <span>{label}</span>
        <ChevronRight className={`ml-auto transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          {items.map(({ href, label }) => (
            <SidebarMenuSubItem key={href}>
              <SidebarMenuSubButton asChild isActive={isActive(pathname, href)} className={ACTIVE}>
                <Link href={href}>{label}</Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const isAdmin = useRole() === 'admin';

  return (
    <SidebarPrimitive collapsible="icon" className="border-frame">
      <SidebarHeader className="h-14 flex-row items-center border-b border-frame px-4 gap-2.5 group-data-[collapsible=icon]:!px-2.5">
        <img src="/favicon.png" alt="Burdens" className="h-7 w-7 object-contain shrink-0" />
        <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
          <span className="text-[0.9375rem] font-semibold text-ink tracking-tight">Burdens</span>
          <span className="text-[0.6rem] font-medium text-muted uppercase tracking-[0.1em]">Integrations</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV.filter(n => isAdmin || !('admin' in n && n.admin)).map(n =>
              'items' in n ? (
                <NavGroup key={n.label} label={n.label} icon={n.icon} items={n.items} pathname={pathname} />
              ) : (
                <SidebarMenuItem key={n.href}>
                  <SidebarMenuButton asChild isActive={isActive(pathname, n.href)} tooltip={n.label} className={ACTIVE}>
                    <Link href={n.href}>
                      <n.icon />
                      <span>{n.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ),
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-frame">
        <NavUser />
        <Link
          href="/changelog"
          className="px-2 text-[0.6875rem] text-muted hover:text-primary group-data-[collapsible=icon]:hidden"
        >
          v{VERSION} · What’s new
        </Link>
      </SidebarFooter>

      <SidebarRail />
    </SidebarPrimitive>
  );
}
