"use client";

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createProject } from '@/lib/api';
import type { ProjectResponse } from '@/types/api';

export function UploadProjectDialog({ onUploadSuccess }: { onUploadSuccess?: (project: ProjectResponse) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation<ProjectResponse, Error, File>({
    mutationFn: createProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project Created",
        description: `Project "${data.name}" has been successfully created.`,
      });
      setIsOpen(false);
      setSelectedFile(null);
      setError(null);
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
    },
    onError: (uploadError) => {
      setError(uploadError.message || "Failed to upload PDF. Please try again.");
      toast({
        title: "Upload Failed",
        description: uploadError.message || "An unknown error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type !== "application/pdf") {
        setError("Please select a PDF file.");
        setSelectedFile(null);
        return;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setError("File size should not exceed 50MB.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Please select a PDF file to upload.");
      return;
    }
    setError(null);
    mutation.mutate(selectedFile);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setSelectedFile(null);
        setError(null);
        mutation.reset();
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <UploadCloud className="mr-2 h-4 w-4" /> Upload PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload New Project</DialogTitle>
            <DialogDescription>
              Select a multi-page PDF file to create a new project. The project name will default to the filename.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="pdf-file">PDF File</Label>
              <Input id="pdf-file" type="file" accept=".pdf" onChange={handleFileChange} required />
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline" disabled={mutation.isPending}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={!selectedFile || mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
