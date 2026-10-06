'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronsUpDown, LogOut, UserRound } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

type Me = { email: string; role: string };

// Users only have an email — "elton.escudero@…" → "Elton Escudero".
function nameFromEmail(email: string) {
  return email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function Identity({ me }: { me: Me }) {
  const name = nameFromEmail(me.email);
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('');
  return (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-wash text-xs font-semibold text-primary">
        {initials}
      </span>
      <span className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium text-ink">{name}</span>
        <span className="truncate text-xs text-muted">{me.email}</span>
      </span>
    </>
  );
}

export default function NavUser() {
  const { isMobile } = useSidebar();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch('/api/me')
      .then(r => (r.ok ? r.json() : null))
      .then(d => d?.user && setMe(d.user))
      .catch(() => {});
  }, []);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={me?.email ?? 'Account'}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {me ? (
                <Identity me={me} />
              ) : (
                <>
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                  <span className="grid flex-1 gap-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-32" />
                  </span>
                </>
              )}
              <ChevronsUpDown className="ml-auto size-4 text-muted" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
          >
            {me && (
              <>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5">
                    <Identity me={me} />
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <UserRound />
                My profile
              </Link>
            </DropdownMenuItem>
            {/* Not a <form>: choosing the item closes the menu, which unmounts a form
                inside it before the browser submits, so the logout never fired.
                Full page load after, so no signed-in page stays cached in the router. */}
            <DropdownMenuItem
              onSelect={async () => {
                await fetch('/api/logout', { method: 'POST' }).catch(() => {});
                window.location.assign('/login');
              }}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
