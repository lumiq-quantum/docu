"use client";

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, FileText } from 'lucide-react';
import type { ProjectResponse } from '@/types/api';
import { listProjects } from '@/lib/api';
import { ProjectItem } from './ProjectItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UploadProjectDialog } from './UploadProjectDialog';
import { useRouter } from 'next/navigation';

export function ProjectList() {
  const router = useRouter();
  const { data: projects, error, isLoading } = useQuery<ProjectResponse[], Error>({
    queryKey: ['projects'],
    queryKeyHash: 'projects',
    queryFn: listProjects,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Projects</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed border-muted rounded-lg">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-xl font-semibold">No Projects Yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by uploading your first PDF document.
        </p>
        <div className="mt-6">
          <UploadProjectDialog onUploadSuccess={(project) => router.push(`/projects/${project.id}`)} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map((project) => (
        <ProjectItem key={project.id} project={project} />
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="p-4 border rounded-lg shadow">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-8 w-full mb-4" />
      <div className="flex justify-between">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-8 w-1/4" />
      </div>
    </div>
  );
}
