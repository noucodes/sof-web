import Sidebar from './Sidebar';
import PageViewTracker from './PageViewTracker';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="h-screen overflow-hidden bg-surface">
      <PageViewTracker />
      <Sidebar />
      <SidebarInset className="overflow-y-auto">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
