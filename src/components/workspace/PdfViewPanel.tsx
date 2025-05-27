"use client";

import { useQuery } from '@tanstack/react-query';
import { getPageTextContent, getPdfPageDisplayUrl } from '@/lib/api';
import type { PageResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileWarning, SearchX } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PdfViewPanelProps {
  projectId: number;
  pageNumber: number;
}

export function PdfViewPanel({ projectId, pageNumber }: PdfViewPanelProps) {
  const { 
    data: pageTextData, 
    isLoading: isLoadingText, 
    error: textError 
  } = useQuery<PageResponse, Error>({
    queryKey: ['pageText', projectId, pageNumber],
    queryKeyHash: `pageText-${projectId}-${pageNumber}`,
    queryFn: () => getPageTextContent(projectId, pageNumber),
    enabled: !!projectId && !!pageNumber,
  });

  // Attempt to get a display URL (currently a placeholder)
  // const { data: pdfDisplayUrl, isLoading: isLoadingUrl, error: urlError } = useQuery<string, Error>({
  //   queryKey: ['pdfDisplayUrl', projectId, pageNumber],
  //   queryFn: () => getPdfPageDisplayUrl(projectId, pageNumber),
  //   enabled: !!projectId && !!pageNumber,
  // });


  if (isLoadingText) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Page {pageNumber}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow p-4">
          <Skeleton className="h-6 w-1/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
        </CardContent>
      </Card>
    );
  }

  // Prefer textError if both exist, as text content is primary for now
  const displayError = textError;

  if (displayError) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Page {pageNumber}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <Alert variant="destructive" className="w-full max-w-md">
            <FileWarning className="h-4 w-4" />
            <AlertTitle>Error loading page content</AlertTitle>
            <AlertDescription>{displayError.message}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // if (pdfDisplayUrl) {
  //   return (
  //     <Card className="h-full flex flex-col overflow-hidden">
  //       <CardHeader>
  //         <CardTitle>Page {pageNumber} - Visual Preview</CardTitle>
  //       </CardHeader>
  //       <CardContent className="flex-grow p-0 m-0">
  //         <iframe
  //           src={pdfDisplayUrl}
  //           title={`PDF Page ${pageNumber}`}
  //           className="w-full h-full border-0"
  //         />
  //       </CardContent>
  //     </Card>
  //   );
  // }

  if (pageTextData) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Page {pageNumber} - Extracted Text</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow p-4 overflow-y-auto">
          {pageTextData.text_content ? (
             <ScrollArea className="h-full whitespace-pre-wrap text-sm leading-relaxed">
                {pageTextData.text_content}
              </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <SearchX className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">No text content extracted for this page.</p>
              <p className="text-sm">The page might be blank or contain only images.</p>
            </div>
          )}
           <Alert variant="default" className="mt-4">
              <FileWarning className="h-4 w-4" />
              <AlertTitle>Note on PDF Display</AlertTitle>
              <AlertDescription>
                Visual PDF rendering is not fully supported by the current backend API. 
                Displaying extracted text content instead. For visual display, the API endpoint 
                <code>{`/projects/{projectId}/pages/{pageNumber}/pdf`}</code> would need to return 
                the PDF file or image.
              </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="h-full flex flex-col">
       <CardHeader>
          <CardTitle>Page {pageNumber}</CardTitle>
        </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center">
        <p className="text-muted-foreground">No content to display for this page.</p>
      </CardContent>
    </Card>
  );
}
