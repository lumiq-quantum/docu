
"use client";

import { API_BASE_URL } from '@/lib/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileWarning } from 'lucide-react';

interface PdfViewPanelProps {
  projectId: number;
  pageNumber: number;
}

export function PdfViewPanel({ projectId, pageNumber }: PdfViewPanelProps) {
  
  if (!projectId || !pageNumber) {
    // This case should ideally be handled by the parent component (ProjectWorkspaceLayout)
    // which already ensures selectedPageNumber is valid before rendering this.
    // However, this is a safeguard.
    return (
      <Card className="h-full flex flex-col shadow-lg">
        <CardHeader className="border-b">
          <CardTitle>PDF Viewer</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center p-4">
          <Alert variant="destructive">
            <FileWarning className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Project ID or Page Number is missing.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const pdfUrl = `${API_BASE_URL}/projects/${projectId}/pages/${pageNumber}/pdf`;

  return (
    <Card className="h-full flex flex-col overflow-hidden shadow-lg">
      <CardHeader className="border-b">
        <CardTitle>Page {pageNumber} - PDF View</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-0 m-0">
        <iframe
          src={pdfUrl}
          title={`PDF Page ${pageNumber}`}
          className="w-full h-full border-0"
          // Sandbox attribute for security. Adjust if PDF needs more permissions (e.g. to run scripts within PDF, open links)
          // "allow-scripts allow-same-origin" is a common starting point.
          // For simple PDF display, "allow-same-origin" might be enough, or even no sandbox if content is trusted.
          // However, it's safer to start with some restrictions.
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms" 
        />
      </CardContent>
    </Card>
  );
}
