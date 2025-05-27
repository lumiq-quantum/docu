'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating form fields from PDF page content.
 *
 * - generateFormFields - A function that takes PDF page text content as input and returns a JSON object representing the form fields.
 * - GenerateFormFieldsInput - The input type for the generateFormFields function.
 * - GenerateFormFieldsOutput - The return type for the generateFormFields function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFormFieldsInputSchema = z.object({
  pageText: z.string().describe('The text content of the PDF page.'),
});
export type GenerateFormFieldsInput = z.infer<typeof GenerateFormFieldsInputSchema>;

const GenerateFormFieldsOutputSchema = z.record(z.any()).describe('A JSON object where keys are field names and values are field definitions.');
export type GenerateFormFieldsOutput = z.infer<typeof GenerateFormFieldsOutputSchema>;

export async function generateFormFields(input: GenerateFormFieldsInput): Promise<GenerateFormFieldsOutput> {
  return generateFormFieldsFlow(input);
}

const formFieldGeneratorPrompt = ai.definePrompt({
  name: 'formFieldGeneratorPrompt',
  input: {schema: GenerateFormFieldsInputSchema},
  output: {schema: GenerateFormFieldsOutputSchema},
  prompt: `You are an AI assistant that generates form fields from text content extracted from a PDF page.

  Analyze the provided text content and identify potential form fields. Determine appropriate input types for each field (e.g., text input, multi-line text, checkbox, radio button, dropdown list) and, where applicable, provide options for selection.

  Return a JSON object where keys are field names (derived from the text content) and values are field definitions. Each field definition should include a "type" property indicating the input type and an "options" property if the type is a radio button, checkbox or dropdown.

  Example:
  {
    "fullName": {"type": "text"},
    "emailAddress": {"type": "text"},
    "phoneNumber": {"type": "text"},
    "comments": {"type": "multi-line text"},
    "subscribeToNewsletter": {"type": "checkbox"},
    "preferredContactMethod": {"type": "dropdown", "options": ["Email", "Phone"]}
  }

  Text Content:
  {{pageText}}`,
});

const generateFormFieldsFlow = ai.defineFlow(
  {
    name: 'generateFormFieldsFlow',
    inputSchema: GenerateFormFieldsInputSchema,
    outputSchema: GenerateFormFieldsOutputSchema,
  },
  async input => {
    const {output} = await formFieldGeneratorPrompt(input);
    return output!;
  }
);
