import Sidebar from './Sidebar';
import PageViewTracker from './PageViewTracker';
import { RoleProvider } from './RoleProvider';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { getRole } from '@/lib/session';

export default async function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider role={await getRole()}>
      <SidebarProvider className="h-screen overflow-hidden bg-surface">
        <PageViewTracker />
        <Sidebar />
        <SidebarInset className="overflow-y-auto">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </RoleProvider>
  );
}
