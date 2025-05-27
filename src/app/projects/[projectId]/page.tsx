"use client"; // This page uses client-side hooks for routing and state

import { ProjectWorkspaceLayout } from '@/components/workspace/ProjectWorkspaceLayout';
import { useParams } from 'next/navigation';
import { FullPageLoadingSpinner } from '@/components/LoadingSpinner'; // A simple spinner

export default function ProjectPage() {
  const params = useParams();
  const projectIdString = params.projectId as string;
  
  if (!projectIdString) {
    // This case should ideally be handled by Next.js routing itself (e.g. 404)
    // or a loading state if params are not immediately available.
    return <FullPageLoadingSpinner />;
  }

  const projectId = parseInt(projectIdString, 10);

  if (isNaN(projectId)) {
    // Handle invalid project ID in URL
    return <div className="p-4 text-destructive">Invalid project ID.</div>;
  }
  
  return <ProjectWorkspaceLayout projectId={projectId} />;
}
