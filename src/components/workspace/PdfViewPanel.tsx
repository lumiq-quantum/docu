
"use client";

import { useState, useEffect, useRef } from 'react'; // Added useRef import
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { API_BASE_URL } from '@/lib/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileWarning, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { cn } from '@/lib/utils';

// Configure PDF.js worker
// Use a stable version of pdfjs-dist, e.g., the one react-pdf v9 expects (around 3.11.x)
// Using unpkg as an alternative to cdnjs or copying to public folder
const PDFJS_WORKER_SRC = `//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;


interface PdfViewPanelProps {
  projectId: number;
  pageNumber: number;
}

export function PdfViewPanel({ projectId, pageNumber }: PdfViewPanelProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set workerSrc on client side
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

  const pdfUrl = `${API_BASE_URL}/projects/${projectId}/pages/${pageNumber}/pdf`;

  function onDocumentLoadSuccess({ numPages: nextNumPages }: { numPages: number }): void {
    setNumPages(nextNumPages);
  }
  
  // Fallback for PDF.js version if direct import fails. Typically, react-pdf handles its pdfjs version.
  // const pdfJsVersion = pdfjs.version || "3.11.174"; // Default to a known compatible version
  // const workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfJsVersion}/pdf.worker.min.js`;
  // pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;


  return (
    <Card className="h-full flex flex-col overflow-hidden shadow-lg">
      <CardHeader className="border-b">
        <CardTitle>Page {pageNumber} - PDF View</CardTitle>
      </CardHeader>
      <CardContent ref={containerRef} className="flex-grow p-2 m-0 overflow-auto flex justify-center items-start">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="flex justify-center items-center h-full"><LoadingSpinner size={32} /></div>}
          error={
            <div className="p-4">
              <ErrorMessage title="PDF Load Error" message="Failed to load PDF document. Ensure the URL is correct and the document is accessible." />
            </div>
          }
          options={{
             cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
             cMapPacked: true,
             standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`
          }}
        >
          {/* 
            We are displaying a single page, which is what the pageNumber prop to this component signifies.
            The react-pdf <Page> component is 1-indexed.
            If pdfUrl itself points to a single-page PDF, then pageNumber for <Page> should be 1.
            If pdfUrl points to a multi-page PDF, and we want to show the Nth page of *that* document,
            then this component's pageNumber prop should be used directly.
            Given our API structure `/projects/{projectId}/pages/{pageNumber}/pdf`, it's highly likely
            this endpoint returns a single page PDF or content representing that single page.
            So, we should render page 1 of the loaded document.
          */}
          <Page 
            pageNumber={1} // Display the first (and likely only) page of the document loaded from pdfUrl
            width={containerWidth ? containerWidth * 0.95 : undefined} // Adjust width to fit container with some padding
            renderTextLayer={true} // Enable text layer for selection (optional)
            renderAnnotationLayer={true} // Enable annotation layer (optional)
            loading={<div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
            error={
                 <div className="p-4">
                    <ErrorMessage title="Page Render Error" message={`Failed to render page ${pageNumber}.`} />
                 </div>
            }
            className="flex justify-center" // Center the page within the content area
          />
        </Document>
      </CardContent>
    </Card>
  );
}
