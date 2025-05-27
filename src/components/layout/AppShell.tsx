"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Home, Settings, PlusCircle, FileText, Trash2 } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { listProjects } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ProjectResponse } from '@/types/api';

interface AppShellProps {
  children: ReactNode;
}

function SidebarNavigation() {
  const { data: projects, isLoading } = useQuery<ProjectResponse[], Error>({
    queryKey: ['projects'],
    queryKeyHash: 'projects',
    queryFn: listProjects,
  });
  const pathname = usePathname();
  const { open } = useSidebar();

  return (
    <>
      <SidebarHeader className="p-4 flex items-center gap-2">
        <Logo />
        {open && <h1 className="text-xl font-semibold text-sidebar-foreground">FormulateAI</h1>}
        <div className="ml-auto md:hidden">
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={pathname === '/'}
              tooltip="Dashboard"
            >
              <Link href="/">
                <Home />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mt-4 px-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-sidebar-foreground/70">Projects</h2>
            {/* Upload button handled on dashboard page for now */}
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-8 bg-sidebar-accent/50 rounded-md animate-pulse" />)}
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-280px)]"> {/* Adjust height as needed */}
              <SidebarMenu>
                {projects?.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === `/projects/${project.id}`}
                      tooltip={project.name}
                    >
                      <Link href={`/projects/${project.id}`}>
                        <FileText />
                        <span>{project.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ScrollArea>
          )}
        </div>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <ThemeToggle />
      </SidebarFooter>
    </>
  );
}


export default function AppShell({ children }: AppShellProps) {
  // Check if cookies are enabled for sidebar state persistence
  let defaultOpen = true;
  if (typeof document !== 'undefined') {
    try {
      // Attempt to use cookies to check if they are enabled
      document.cookie = "testcookie; SameSite=Lax";
      defaultOpen = document.cookie.indexOf("testcookie") !== -1;
      // Clean up the test cookie
      document.cookie = "testcookie=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    } catch (e) {
      // Cookies are likely disabled or an error occurred
      defaultOpen = false; // Fallback if cookies are disabled (e.g. incognito with strict settings)
    }
  }


  return (
    <SidebarProvider defaultOpen={defaultOpen} >
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarNavigation />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 md:hidden">
          <SidebarTrigger />
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold">FormulateAI</span>
          </Link>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
