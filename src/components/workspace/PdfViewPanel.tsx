"use client";

import { useState, useEffect, useRef } from 'react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { getPdfPageDisplayUrl } from '@/lib/api'; // Assuming this fetches the correct URL
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
// pdfjs-dist is a peer dependency
import * as pdfjsLib from 'pdfjs-dist';

const PDFJS_WORKER_VERSION = "3.11.174"; // Ensure this matches installed pdfjs-dist

interface PdfViewPanelProps {
  projectId: number;
  pageNumber: number;
}

export function PdfViewPanel({ projectId, pageNumber }: PdfViewPanelProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState<boolean>(true);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [key, setKey] = useState(0); // Key to force re-render of Viewer

  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const workerUrl = `//unpkg.com/pdfjs-dist@${PDFJS_WORKER_VERSION}/build/pdf.worker.min.js`;


  useEffect(() => {
    if (projectId && pageNumber) {
      setIsLoadingUrl(true);
      setUrlError(null);
      setPdfUrl(null); // Reset pdfUrl before fetching new one

      getPdfPageDisplayUrl(projectId, pageNumber)
        .then(url => {
          setPdfUrl(url);
          setKey(prevKey => prevKey + 1); // Change key to force re-render
        })
        .catch(error => {
          console.error("Error fetching PDF URL:", error);
          setUrlError(error.message || "Failed to retrieve PDF location.");
        })
        .finally(() => {
          setIsLoadingUrl(false);
        });
    } else {
      setPdfUrl(null);
      setUrlError(null);
      setIsLoadingUrl(false);
    }
  }, [projectId, pageNumber]);


  if (!projectId || !pageNumber) {
    return (
      <Card className="h-full flex flex-col shadow-lg">
        <CardHeader className="border-b">
          <CardTitle>PDF Viewer</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center p-4">
          <ErrorMessage title="Information" message="Please select a project and a page to view its PDF." />
        </CardContent>
      </Card>
    );
  }

  if (isLoadingUrl) {
    return (
      <Card className="h-full flex flex-col shadow-lg">
        <CardHeader className="border-b">
          <CardTitle>Page {pageNumber} - PDF View</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center p-4">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (urlError) {
    return (
      <Card className="h-full flex flex-col shadow-lg">
        <CardHeader className="border-b">
          <CardTitle>Page {pageNumber} - PDF View</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center p-4">
          <ErrorMessage title="Error Fetching PDF URL" message={urlError} />
        </CardContent>
      </Card>
    );
  }
  
  if (!pdfUrl) {
    return (
      <Card className="h-full flex flex-col shadow-lg">
        <CardHeader className="border-b">
          <CardTitle>Page {pageNumber} - PDF View</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center p-4">
          <ErrorMessage title="Error" message="PDF URL could not be determined. The backend might not have returned a valid URL." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden shadow-lg">
      <CardHeader className="border-b">
        <CardTitle>Page {pageNumber} - PDF View</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-0 m-0 overflow-hidden">
        <Worker workerUrl={workerUrl}>
          <div style={{ height: '100%', width: '100%' }}>
            {pdfUrl ? (
              <Viewer
                key={key} // Add key here
                fileUrl={pdfUrl}
                plugins={[defaultLayoutPluginInstance]}
                defaultScale={SpecialZoomLevel.PageFit}
                theme="dark" // Optional: or "light" or remove for default
                renderError={(error) => (
                  <div className="p-4 w-full h-full flex items-center justify-center">
                    <ErrorMessage 
                      title="PDF Load Error" 
                      message={`Failed to load PDF: ${error.message}. Ensure the URL is correct, the document is accessible, and there are no CORS issues.`}
                    />
                  </div>
                )}
              />
            ) : (
              <div className="p-4 w-full h-full flex items-center justify-center">
                 <LoadingSpinner />
              </div>
            )}
          </div>
        </Worker>
      </CardContent>
    </Card>
  );
}
