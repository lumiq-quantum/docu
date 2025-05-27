
"use client";

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { API_BASE_URL } from '@/lib/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Loader2 } from 'lucide-react';

// Configure PDF.js worker
// Ensure this version matches what react-pdf expects (e.g., v9 typically works with pdfjs-dist 3.11.x)
const PDFJS_WORKER_VERSION = "3.11.174"; // A common version compatible with react-pdf v7-v9
const PDFJS_WORKER_SRC = `//unpkg.com/pdfjs-dist@${PDFJS_WORKER_VERSION}/build/pdf.worker.min.js`;

interface PdfViewPanelProps {
  projectId: number;
  pageNumber: number;
}

export function PdfViewPanel({ projectId, pageNumber }: PdfViewPanelProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    const currentRef = containerRef.current; 

    if (currentRef) {
      observer.observe(currentRef);
      // Initial width set
      setContainerWidth(currentRef.offsetWidth);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef); 
      }
      observer.disconnect();
    };
  }, []); 


  if (!projectId || !pageNumber) {
    return (
      <Card className="h-full flex flex-col shadow-lg">
        <CardHeader className="border-b">
          <CardTitle>PDF Viewer</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center p-4">
          <ErrorMessage title="Error" message="Project ID or Page Number is missing." />
        </CardContent>
      </Card>
    );
  }

  // IMPORTANT: This URL *MUST* serve a raw PDF file (Content-Type: application/pdf) for react-pdf to work.
  // The OpenAPI spec currently indicates /pdf returns application/json, which will cause this component to fail.
  // This needs to be reconciled with the backend API implementation.
  const pdfUrl = `${API_BASE_URL}/projects/${projectId}/pages/${pageNumber}/pdf`;

  function onDocumentLoadSuccess({ numPages: nextNumPages }: { numPages: number }): void {
    setNumPages(nextNumPages);
  }
  
  return (
    <Card className="h-full flex flex-col overflow-hidden shadow-lg">
      <CardHeader className="border-b">
        <CardTitle>Page {pageNumber} - PDF View</CardTitle>
      </CardHeader>
      <CardContent ref={containerRef} className="flex-grow p-2 m-0 overflow-auto flex justify-center items-start bg-gray-100 dark:bg-gray-800">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="flex justify-center items-center h-full w-full"><LoadingSpinner size={32} /></div>}
          error={
            <div className="p-4 w-full">
              <ErrorMessage 
                title="PDF Load Error" 
                message="Failed to load PDF document. Please ensure the backend serves a valid PDF file at this URL." 
              />
            </div>
          }
          options={{
             cMapUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_WORKER_VERSION}/cmaps/`,
             cMapPacked: true,
             standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_WORKER_VERSION}/standard_fonts/`
          }}
        >
          <Page 
            pageNumber={1} // Assuming the /pdf endpoint for a specific page_number returns a single-page PDF document
            width={containerWidth ? Math.max(containerWidth * 0.95, 200) : undefined} // Ensure minimum width
            renderTextLayer={true}
            renderAnnotationLayer={true}
            loading={<div className="flex justify-center items-center h-[500px] w-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>} // Provide some initial height
            error={
                 <div className="p-4">
                    <ErrorMessage title="Page Render Error" message={`Failed to render page ${pageNumber}.`} />
                 </div>
            }
            className="flex justify-center shadow-lg my-2"
          />
        </Document>
      </CardContent>
    </Card>
  );
}
