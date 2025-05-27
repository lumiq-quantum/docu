"use client";

import Link from 'next/link';
import { FileText, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ProjectResponse } from '@/types/api';
import { DeleteProjectDialog } from './DeleteProjectDialog';
import { useRouter } from 'next/navigation';

interface ProjectItemProps {
  project: ProjectResponse;
}

export function ProjectItem({ project }: ProjectItemProps) {
  const router = useRouter();
  const formattedDate = new Date(project.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          {project.name}
        </CardTitle>
        <CardDescription>
          {project.total_pages} page{project.total_pages !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {/* Placeholder for more project details if needed */}
        <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Created: {formattedDate}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4 border-t">
        <Link href={`/projects/${project.id}`} passHref legacyBehavior>
          <Button variant="outline" size="sm">Open Project</Button>
        </Link>
        <DeleteProjectDialog project={project} onDeleteSuccess={() => {
          // Optional: If on a project page that got deleted, navigate away.
          // This component is for the list, so usually not needed here.
          // router.push('/'); 
        }} />
      </CardFooter>
    </Card>
  );
}
