import {
  CopyrightIcon,
  FilePenIcon,
  HomeIcon,
} from 'lucide-react';
import * as React from 'react';

import { NavMenus } from '@/components/NavMenus';
import { NavUser } from '@/components/NavUser';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/Sidebar';

import { Separator } from './ui/Separator';

const menu = [
  {
    name: 'Inicio',
    url: '/',
    icon: HomeIcon,
  },
  {
    name: 'Meus formulários',
    url: '/my-forms',
    icon: FilePenIcon,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4">
        <div className="flex gap-1 items-center">
          <CopyrightIcon size={20} />
          <span className="font-bold text-lg">CollectShare</span>
        </div>
      </SidebarHeader>
      <Separator orientation='horizontal' />
      <SidebarContent>
        <NavMenus menus={menu} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
