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
export default function PageHeader({ crumbs, children }: { crumbs: string[]; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-frame bg-white px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 !h-4 bg-frame" />
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem className="hidden md:inline-flex">
            <BreadcrumbLink asChild>
              <Link href="/dashboard">SOF</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {crumbs.map((c, i) => (
            <Fragment key={c}>
              <BreadcrumbSeparator className={i === 0 ? 'hidden md:block' : undefined} />
              <BreadcrumbItem className="truncate">
                {i === crumbs.length - 1 ? <BreadcrumbPage>{c}</BreadcrumbPage> : c}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      {children && <div className="ml-auto flex shrink-0 items-center gap-2">{children}</div>}
    </header>
  );
}
