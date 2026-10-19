import { Fragment } from 'react';
import Link from 'next/link';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Top bar of every page: sidebar toggle │ SOF › …crumbs, page actions on the
// right. h-14 + border-b matches the sidebar's logo header so the lines meet.
// On phones the actions wrap to a second row that scrolls sideways.
// A crumb is plain text, or { label, href } to link back to a parent page.
type Crumb = string | { label: string; href: string };

export default function PageHeader({ crumbs, children }: { crumbs: Crumb[]; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-x-2 border-b border-frame bg-white px-4">
      <SidebarTrigger className="-ml-2 md:-ml-1" />
      <Separator orientation="vertical" className="mr-1 !h-4 bg-frame" />
      <Breadcrumb className="flex h-14 min-w-0 flex-1 items-center">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem className="hidden md:inline-flex">
            <BreadcrumbLink asChild>
              <Link href="/dashboard">SOF</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {crumbs.map((c, i) => {
            const label = typeof c === 'string' ? c : c.label;
            return (
              <Fragment key={label}>
                <BreadcrumbSeparator className={i === 0 ? 'hidden md:block' : undefined} />
                <BreadcrumbItem className="truncate">
                  {i === crumbs.length - 1 ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : typeof c === 'string' ? (
                    c
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={c.href}>{label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      {children && (
        <div className="-mx-4 flex w-[calc(100%+2rem)] items-center gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&>*]:shrink-0 md:mx-0 md:w-auto md:shrink-0 md:overflow-visible md:px-0 md:pb-0">
          {children}
        </div>
      )}
    </header>
  );
}
