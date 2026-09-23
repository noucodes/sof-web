'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  HandCoins,
  Boxes,
  Ship,
  ArrowLeftRight,
  Users,
} from 'lucide-react';
import NavUser from '@/components/NavUser';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/contribution', label: 'Contribution', icon: HandCoins },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
  { href: '/shipstation', label: 'ShipStation', icon: Ship },
  { href: '/b2b-sync', label: 'B2B Price Sync', icon: ArrowLeftRight },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

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
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={label}
                      className="data-[active=true]:bg-primary-wash data-[active=true]:text-primary"
                    >
                      <Link href={href}>
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-frame">
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </SidebarPrimitive>
  );
}
