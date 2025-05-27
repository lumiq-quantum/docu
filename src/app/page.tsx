"use client";

import { ProjectList } from '@/components/projects/ProjectList';
import { UploadProjectDialog } from '@/components/projects/UploadProjectDialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
        <UploadProjectDialog onUploadSuccess={(project) => router.push(`/projects/${project.id}`)} />
      </div>
      <ProjectList />
    </div>
  );
}
