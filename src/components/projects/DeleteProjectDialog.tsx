"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteProject } from '@/lib/api';
import type { ProjectResponse } from '@/types/api';

interface DeleteProjectDialogProps {
  project: ProjectResponse;
  onDeleteSuccess?: () => void;
}

export function DeleteProjectDialog({ project, onDeleteSuccess }: DeleteProjectDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation<void, Error, number>({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Optionally, redirect if current project is deleted, handled by parent component
      toast({
        title: "Project Deleted",
        description: `Project "${project.name}" has been successfully deleted.`,
      });
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    mutation.mutate(project.id);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete Project</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this project?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently delete the project "<strong>{project.name}</strong>" 
            and all its associated data, including PDF content, form data, and chat history. 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={mutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Project"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
