
"use client";

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
// import { generateFormFields as generateFormFieldsAI } from '@/ai/flows/generate-form-fields'; // Replaced by API call
import { getPageTextContent, saveFormData, getFormData, generateFormFieldsAPI } from '@/lib/api'; // Added generateFormFieldsAPI
import type { GeneratedFormFields, FormValues, PageResponse, FormDataResponse } from '@/types/api';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FormRenderer } from './FormRenderer';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, FileWarning, Wand2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface DynamicFormPanelProps {
  projectId: number;
  pageNumber: number;
}

// Create a dynamic Zod schema based on generated fields
const createFormSchema = (fields: GeneratedFormFields) => {
  const shape: Record<string, z.ZodTypeAny> = {};
  Object.entries(fields).forEach(([name, def]) => {
    const normalizedName = name.replace(/\s+/g, '_').toLowerCase();
    switch (def.type) {
      case 'text':
      case 'multi-line text':
      case 'radio':
      case 'dropdown':
        shape[normalizedName] = z.string().optional();
        break;
      case 'checkbox':
        shape[normalizedName] = z.boolean().optional();
        break;
      default:
        shape[normalizedName] = z.any().optional();
    }
  });
  return z.object(shape);
};


export function DynamicFormPanel({ projectId, pageNumber }: DynamicFormPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentFormSchema, setCurrentFormSchema] = useState(z.object({}));

  // Fetch page text content (which might also include pre-generated form HTML)
  const { data: pageData, isLoading: isLoadingText } = useQuery<PageResponse, Error>({
    queryKey: ['pageTextAndMeta', projectId, pageNumber], // Changed queryKey for clarity
    queryKeyHash: `pageTextAndMeta-${projectId}-${pageNumber}`,
    queryFn: () => getPageTextContent(projectId, pageNumber),
    enabled: !!projectId && !!pageNumber,
  });

  const { 
    data: generatedFormFields, 
    isLoading: isLoadingFormFields,
    error: formFieldsError,
    refetch: refetchFormFields,
  } = useQuery<GeneratedFormFields, Error>({
    queryKey: ['generatedFormFields', projectId, pageNumber],
    queryKeyHash: `generatedFormFields-${projectId}-${pageNumber}`,
    queryFn: async () => {
      // Assuming generateFormFieldsAPI makes the POST call to /form/generate
      // and returns the JSON structure for form fields.
      return generateFormFieldsAPI(projectId, pageNumber);
    },
    enabled: !!pageData, // Enable when pageData (which contains text) is available.
                         // Or, could be enabled: false and triggered manually if needed.
  });
  
  useEffect(() => {
    if (generatedFormFields) {
      setCurrentFormSchema(createFormSchema(generatedFormFields));
    }
  }, [generatedFormFields]);

  const form = useForm<FormValues>({
    resolver: zodResolver(currentFormSchema),
    defaultValues: {},
  });
  
  const { data: savedFormData, isLoading: isLoadingSavedData } = useQuery<FormDataResponse | null, Error>({
    queryKey: ['formData', projectId, pageNumber],
    queryKeyHash: `formData-${projectId}-${pageNumber}`,
    queryFn: () => getFormData(projectId, pageNumber),
    enabled: !!projectId && !!pageNumber && !!generatedFormFields,
    onSuccess: (data) => {
      if (data?.data) {
        try {
          const parsedData = JSON.parse(data.data);
          form.reset(parsedData);
        } catch (e) {
          console.error("Failed to parse saved form data", e);
          toast({ title: "Error", description: "Could not load previously saved form data.", variant: "destructive" });
        }
      } else {
        form.reset({});
      }
    },
  });

  const saveMutation = useMutation<FormDataResponse, Error, FormValues>({
    mutationFn: async (dataToSave) => {
      return saveFormData(projectId, pageNumber, { data: JSON.stringify(dataToSave) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formData', projectId, pageNumber] });
      toast({ title: "Form Saved", description: "Your responses have been saved successfully." });
    },
    onError: (error) => {
      toast({ title: "Save Failed", description: error.message || "Could not save form data.", variant: "destructive" });
    },
  });

  const onSubmit = (data: FormValues) => {
    saveMutation.mutate(data);
  };

  const isLoading = isLoadingText || isLoadingFormFields || isLoadingSavedData;

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
  
  if (formFieldsError) {
     return (
      <Card className="h-full">
        <CardHeader><CardTitle>Dynamic Form</CardTitle></CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <FileWarning className="h-4 w-4" />
            <AlertTitle>Error Generating Form</AlertTitle>
            <AlertDescription>{formFieldsError.message || "Could not generate form fields from API."}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Check if pageData has text_content before declaring no form fields.
  // The form generation might depend on this text.
  if (!generatedFormFields || Object.keys(generatedFormFields).length === 0) {
    return (
      <Card className="h-full">
        <CardHeader><CardTitle>Dynamic Form</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
            <Wand2 className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">No form fields could be generated.</p>
            <p className="text-sm text-center">
              This might happen if the page has no detectable form elements or if the AI could not process the text.
            </p>
            {!pageData?.text_content && <p className="text-sm mt-2">Page text content might be missing.</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Dynamic Form - Page {pageNumber}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow">
          <ScrollArea className="flex-grow">
            <CardContent className="p-6">
              <FormRenderer formFields={generatedFormFields} control={form.control} disabled={saveMutation.isPending} />
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
      </Form>
    </Card>
  );
}
