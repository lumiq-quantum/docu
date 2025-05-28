"use client";

import { useEffect, useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { getGeneratedFormHtmlAPI, saveFormData, getFormData } from '@/lib/api';
import type { GeneratedHtmlResponse, FormDataResponse, FormValues, FormDataCreate } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, FileWarning, Wand2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface DynamicFormPanelProps {
  projectId: number;
  pageNumber: number;
}

export function DynamicFormPanel({ projectId, pageNumber }: DynamicFormPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [initialFormData, setInitialFormData] = useState<FormValues | null>(null);

  const generatedFormHtmlQueryKey: QueryKey = ['generatedFormHtml', projectId, pageNumber];
  const formDataQueryKey: QueryKey = ['formData', projectId, pageNumber];

  const { 
    data: htmlData, 
    isLoading: isLoadingHtml, 
    error: htmlError 
  } = useQuery<GeneratedHtmlResponse, Error, GeneratedHtmlResponse, QueryKey>({
    queryKey: generatedFormHtmlQueryKey,
    queryFn: () => getGeneratedFormHtmlAPI(projectId, pageNumber),
    enabled: !!projectId && !!pageNumber,
  });

  useQuery<FormDataResponse | null, Error, FormDataResponse | null, QueryKey>({
    queryKey: formDataQueryKey,
    queryFn: () => getFormData(projectId, pageNumber),
    enabled: !!htmlData, // Only fetch saved data once HTML structure is potentially known
    onSuccess: (data) => { // This is a valid way to use onSuccess with v4/v5
      if (data?.data) {
        try {
          const parsedData = JSON.parse(data.data);
          setInitialFormData(parsedData);
        } catch (e) {
          console.error("Failed to parse saved form data", e);
          toast({ title: "Error", description: "Could not load previously saved form data into HTML form.", variant: "destructive" });
        }
      }
    },
    // Assign to a variable if you need to access isLoading or error states for this query
    // For now, we are primarily interested in its onSuccess side-effect
  });

  const saveMutation = useMutation<FormDataResponse, Error, FormDataCreate>({
    mutationFn: (dataToSave) => saveFormData(projectId, pageNumber, dataToSave),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formDataQueryKey });
      toast({ title: "Form Saved", description: "Your responses have been saved successfully." });
    },
    onError: (error) => {
      toast({ title: "Save Failed", description: error.message || "Could not save form data.", variant: "destructive" });
    },
  });

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formValues: FormValues = {};
    
    formData.forEach((value, key) => {
      // Basic handling for multiple values (e.g., checkboxes with same name)
      if (Object.prototype.hasOwnProperty.call(formValues, key)) {
        const existingValue = formValues[key];
        if (Array.isArray(existingValue)) {
          existingValue.push(value as string);
        } else {
          formValues[key] = [existingValue as string, value as string];
        }
      } else {
         // For checkboxes that are not checked, FormData doesn't include them.
         // If the element is a checkbox and not in formData, its value is false.
         const element = event.currentTarget.elements.namedItem(key);
         if (element instanceof HTMLInputElement && element.type === 'checkbox') {
            formValues[key] = element.checked;
         } else {
            formValues[key] = value as string;
         }
      }
    });

    // Ensure all checkbox values are correctly represented (true/false)
    // This requires knowing which fields are checkboxes if they are not submitted when unchecked.
    // This is a limitation when working with raw HTML forms. A more robust solution
    // might involve inspecting event.currentTarget.elements.
    Array.from(event.currentTarget.elements).forEach(element => {
        if (element instanceof HTMLInputElement && element.type === 'checkbox' && element.name) {
            if (!formData.has(element.name)) { // If checkbox was unchecked, it won't be in formData
                formValues[element.name] = false;
            } else { // If it was checked, FormData gives its 'value' attribute, ensure boolean true
                formValues[element.name] = true;
            }
        }
    });


    saveMutation.mutate({ data: JSON.stringify(formValues) });
  };
  
  // Effect to apply initial form data to the raw HTML form
  useEffect(() => {
    if (htmlData?.html_content && initialFormData) {
      const formElement = document.getElementById(`dynamic-form-${projectId}-${pageNumber}`);
      if (formElement) {
        Object.entries(initialFormData).forEach(([name, value]) => {
          const inputElement = formElement.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          if (inputElement) {
            if (inputElement.type === 'checkbox' || inputElement.type === 'radio') {
              (inputElement as HTMLInputElement).checked = !!value;
            } else {
              inputElement.value = String(value);
            }
          }
        });
      }
    }
  }, [htmlData, initialFormData, projectId, pageNumber]);


  const isLoading = isLoadingHtml;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader><CardTitle>Dynamic Form</CardTitle></CardHeader>
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-1/4 ml-auto" />
        </CardContent>
      </Card>
    );
  }
  
  if (htmlError) {
     return (
      <Card className="h-full">
        <CardHeader><CardTitle>Dynamic Form</CardTitle></CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <FileWarning className="h-4 w-4" />
            <AlertTitle>Error Loading Form HTML</AlertTitle>
            <AlertDescription>{htmlError.message || "Could not load form HTML from API."}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  // Note: savedDataError is handled by a toast notification within its query definition.
  // No separate UI block for savedDataError here unless more specific handling is needed.
  
  if (!htmlData || !htmlData.html_content) {
    return (
      <Card className="h-full">
        <CardHeader><CardTitle>Dynamic Form</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
            <Wand2 className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">No form content available.</p>
            <p className="text-sm text-center">
              The API did not return any HTML content for the form on this page.
            </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Dynamic Form - Page {pageNumber}</CardTitle>
      </CardHeader>
      {/* The form submission logic is now handled by the onSubmit on this form tag */}
      {/* Added min-h-0 to the form for proper flex child height calculation */}
      <form onSubmit={handleFormSubmit} className="flex flex-col flex-grow min-h-0" id={`dynamic-form-${projectId}-${pageNumber}`}>
          <ScrollArea className="flex-grow"> {/* ScrollArea will now correctly fill the space */}
            <CardContent className="p-6">
              {/* Render the HTML fetched from the API */}
              {htmlData?.html_content && <div dangerouslySetInnerHTML={{ __html: htmlData.html_content }} />}
            </CardContent>
          </ScrollArea>
          <CardFooter className="border-t p-6">
            <Button type="submit" disabled={saveMutation.isPending} className="ml-auto">
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Form
                </>
              )}
            </Button>
          </CardFooter>
        </form>
    </Card>
  );
}
