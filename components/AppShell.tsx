import Sidebar from './Sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="h-screen overflow-hidden bg-surface">
      <Sidebar />
      <SidebarInset className="overflow-y-auto">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
