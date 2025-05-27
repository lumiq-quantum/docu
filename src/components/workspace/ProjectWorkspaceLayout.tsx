"use client";

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { ProjectResponse, PageResponse } from '@/types/api';
import { getProject, listProjectPages } from '@/lib/api';
import { PageListSidebar } from './PageListSidebar';
import { PdfViewPanel } from './PdfViewPanel';
import { DynamicFormPanel } from './DynamicFormPanel';
import { ChatbotPanel } from './ChatbotPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileWarning } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProjectWorkspaceLayoutProps {
  projectId: number;
}

export function ProjectWorkspaceLayout({ projectId }: ProjectWorkspaceLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [selectedPageNumber, setSelectedPageNumber] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("form");


  const { data: project, isLoading: isLoadingProject, error: projectError } = useQuery<ProjectResponse, Error>({
    queryKey: ['project', projectId],
    queryKeyHash: `project-${projectId}`,
    queryFn: () => getProject(projectId),
    enabled: !!projectId,
  });

  const { data: pages, isLoading: isLoadingPages, error: pagesError } = useQuery<PageResponse[], Error>({
    queryKey: ['projectPages', projectId],
    queryKeyHash: `projectPages-${projectId}`,
    queryFn: () => listProjectPages(projectId),
    enabled: !!projectId,
  });

  useEffect(() => {
    const pageQueryParam = searchParams.get('page');
    if (pageQueryParam) {
      const pageNum = parseInt(pageQueryParam, 10);
      if (!isNaN(pageNum)) {
        setSelectedPageNumber(pageNum);
      }
    } else if (pages && pages.length > 0) {
      // Default to first page if no query param and pages exist
      const firstPage = pages.sort((a,b) => a.page_number - b.page_number)[0];
      setSelectedPageNumber(firstPage.page_number);
      router.replace(`${pathname}?page=${firstPage.page_number}`, { scroll: false });
    }
  }, [searchParams, pages, pathname, router]);


  const handleSelectPage = (pageNumber: number) => {
    setSelectedPageNumber(pageNumber);
    router.push(`${pathname}?page=${pageNumber}`, { scroll: false });
  };
  
  if (isLoadingProject || isLoadingPages) {
    return (
      <div className="flex flex-col h-[calc(100vh-var(--header-height,4rem)-2rem)]"> {/* Adjust header height */}
        <Skeleton className="h-10 w-1/3 mb-4" /> {/* Project Title Skeleton */}
        <div className="flex flex-grow gap-4 overflow-hidden">
          <Skeleton className="w-64 h-full" /> {/* PageList Sidebar Skeleton */}
          <div className="flex-grow flex flex-col gap-4">
            <Skeleton className="h-1/2 w-full" /> {/* PDF View Panel Skeleton */}
            <Skeleton className="h-1/2 w-full" /> {/* Tabs Panel Skeleton */}
          </div>
        </div>
      </div>
    );
  }

  if (projectError || pagesError) {
    return (
      <Alert variant="destructive">
        <FileWarning className="h-4 w-4" />
        <AlertTitle>Error Loading Project Data</AlertTitle>
        <AlertDescription>{projectError?.message || pagesError?.message}</AlertDescription>
      </Alert>
    );
  }

  if (!project) {
    return <p>Project not found.</p>;
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,4rem)-2rem)]"> {/* Adjust if header height changes */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
        <p className="text-muted-foreground">{project.total_pages} pages</p>
      </header>

      <div className="flex flex-grow gap-6 overflow-hidden">
        <PageListSidebar
          pages={pages}
          isLoading={isLoadingPages}
          selectedPageNumber={selectedPageNumber}
          onSelectPage={handleSelectPage}
          className="h-full"
        />
        
        <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          <section className="lg:col-span-1 h-full overflow-y-auto">
            {selectedPageNumber ? (
              <PdfViewPanel projectId={projectId} pageNumber={selectedPageNumber} />
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent><p className="text-muted-foreground">Select a page to view its content.</p></CardContent>
              </Card>
            )}
          </section>

          <section className="lg:col-span-1 h-full overflow-y-auto">
            {selectedPageNumber ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="mb-4 grid w-full grid-cols-2">
                  <TabsTrigger value="form">Dynamic Form</TabsTrigger>
                  <TabsTrigger value="chatbot">AI Chatbot</TabsTrigger>
                </TabsList>
                <TabsContent value="form" className="flex-grow overflow-hidden">
                  <DynamicFormPanel projectId={projectId} pageNumber={selectedPageNumber} />
                </TabsContent>
                <TabsContent value="chatbot" className="flex-grow overflow-hidden">
                  <ChatbotPanel projectId={projectId} />
                </TabsContent>
              </Tabs>
            ) : (
               <Card className="h-full flex items-center justify-center">
                <CardContent><p className="text-muted-foreground">Select a page to interact with its form or chatbot.</p></CardContent>
              </Card>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
