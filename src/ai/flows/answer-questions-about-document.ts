'use server';
/**
 * @fileOverview An AI agent to answer questions about a PDF document.
 *
 * - answerQuestionsAboutDocument - A function that handles question answering about the document.
 * - AnswerQuestionsAboutDocumentInput - The input type for the answerQuestionsAboutDocument function.
 * - AnswerQuestionsAboutDocumentOutput - The return type for the answerQuestionsAboutDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionsAboutDocumentInputSchema = z.object({
  projectId: z.number().describe('The ID of the project.'),
  question: z.string().describe('The question about the document.'),
});
export type AnswerQuestionsAboutDocumentInput = z.infer<typeof AnswerQuestionsAboutDocumentInputSchema>;

const AnswerQuestionsAboutDocumentOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the document.'),
});
export type AnswerQuestionsAboutDocumentOutput = z.infer<typeof AnswerQuestionsAboutDocumentOutputSchema>;

export async function answerQuestionsAboutDocument(input: AnswerQuestionsAboutDocumentInput): Promise<AnswerQuestionsAboutDocumentOutput> {
  return answerQuestionsAboutDocumentFlow(input);
}

const getProjectTextContent = ai.defineTool(
    {
      name: 'getProjectTextContent',
      description: 'Retrieves the entire text content of a project.',
      inputSchema: z.object({
        projectId: z.number().describe('The ID of the project to retrieve text content from.'),
      }),
      outputSchema: z.string().describe('The combined text content of all pages in the project.'),
    },
    async (input) => {
      // TODO: Replace with actual data fetching logic
      // This is a placeholder; in a real implementation, you would fetch
      // the project's text content from a database or other storage.
      console.log(`Fetching text content for project ID: ${input.projectId}`);
      return `This is the combined text content for project ID ${input.projectId}.  It includes details about various topics relevant to the project.`;
    }
);

const answerQuestionsAboutDocumentPrompt = ai.definePrompt({
  name: 'answerQuestionsAboutDocumentPrompt',
  input: {schema: AnswerQuestionsAboutDocumentInputSchema},
  output: {schema: AnswerQuestionsAboutDocumentOutputSchema},
  tools: [getProjectTextContent],
  prompt: `You are a chatbot assistant designed to answer questions about PDF documents.

  The user will provide a question about a specific PDF document. Use the available tools to retrieve the document content and answer the question as accurately as possible.

  When answering, be concise and provide only the information requested in the question. If the document does not contain the answer, respond politely that you cannot answer the question using the provided document.

  Question: {{{question}}}

  Make use of the getProjectTextContent tool if you need more information to answer the question.
  `,
});

const answerQuestionsAboutDocumentFlow = ai.defineFlow(
  {
    name: 'answerQuestionsAboutDocumentFlow',
    inputSchema: AnswerQuestionsAboutDocumentInputSchema,
    outputSchema: AnswerQuestionsAboutDocumentOutputSchema,
  },
  async input => {
    const {output} = await answerQuestionsAboutDocumentPrompt(input);
    return output!;
  }
);
