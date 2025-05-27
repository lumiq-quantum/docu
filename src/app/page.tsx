
"use client";

import { ProjectList } from '@/components/projects/ProjectList';
import { UploadProjectDialog } from '@/components/projects/UploadProjectDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { listProjects } from '@/lib/api';
import type { ProjectResponse } from '@/types/api';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Files, Clock3, CheckCircle2, XCircle, UploadCloud, AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon; // Changed to LucideIcon
  iconColor?: string;
  description?: string;
}

function StatCard({ title, value, icon: Icon, iconColor, description }: StatCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        <div className={cn("p-3 rounded-full bg-opacity-10", 
            iconColor?.includes('green') ? 'bg-green-500/10' :
            iconColor?.includes('yellow') ? 'bg-yellow-500/10' :
            iconColor?.includes('red') ? 'bg-red-500/10' :
            'bg-primary/10'
          )}>
          <Icon className={cn("h-6 w-6", iconColor || "text-primary")} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: projects, error, isLoading } = useQuery<ProjectResponse[], Error>({
    queryKey: ['projects'],
    queryKeyHash: 'projects',
    queryFn: listProjects,
  });

  const totalDocuments = projects?.length || 0;
  // Placeholder values for other stats
  const processingDocuments = 0;
  const completedDocuments = 0;
  const failedDocuments = 0;

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Intelligence Dashboard</h1>
          <p className="text-muted-foreground mt-1">Upload and process PDFs with AI-powered analysis</p>
        </div>
        <UploadProjectDialog
          onUploadSuccess={(project) => router.push(`/projects/${project.id}`)}
          trigger={
            <Button variant="default" size="lg">
              <UploadCloud className="mr-2 h-5 w-5" /> Upload Document
            </Button>
          }
        />
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Documents" value={isLoading ? <Skeleton className="h-8 w-10 inline-block" /> : totalDocuments} icon={Files} />
        <StatCard title="Processing" value={processingDocuments} icon={Clock3} iconColor="text-yellow-500" />
        <StatCard title="Completed" value={completedDocuments} icon={CheckCircle2} iconColor="text-green-500" />
        <StatCard title="Failed" value={failedDocuments} icon={XCircle} iconColor="text-red-500" />
      </div>

      {/* Main content: Welcome or Project List */}
      {isLoading ? (
        <div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Projects</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : totalDocuments === 0 ? (
        <Card className="bg-card p-8 py-12 rounded-xl shadow-xl text-center flex flex-col items-center">
          <div className="p-4 bg-primary/10 rounded-full mb-6">
            <UploadCloud className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Welcome to FormulateAI</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Upload your first PDF document to get started with AI-powered document processing and interactive form generation.
          </p>
          <UploadProjectDialog
            onUploadSuccess={(project) => router.push(`/projects/${project.id}`)}
            trigger={
              <Button size="lg" variant="default">
                <UploadCloud className="mr-2 h-5 w-5" /> Upload Your First Document
              </Button>
            }
          />
        </Card>
      ) : (
        <ProjectList />
      )}
    </div>
  );
}
