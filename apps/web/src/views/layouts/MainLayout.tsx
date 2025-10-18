import { Outlet } from 'react-router-dom';

import { AppSidebar } from '@/components/AppSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/Sidebar';

export default function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SidebarTrigger className="md:hidden m-2" />
        <div className="p-4 h-full w-full">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>);
}
