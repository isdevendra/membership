'use server';
/**
 * @fileOverview Summarizes a patron's visit based on transaction data.
 *
 * - summarizePatronVisit - A function that summarizes the patron's visit.
 * - SummarizePatronVisitInput - The input type for the summarizePatronVisit function.
 * - SummarizePatronVisitOutput - The return type for the summarizePatronVisit function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePatronVisitInputSchema = z.object({
  transactionData: z
    .string()
    .describe('The transaction data of the patron, including games played, amounts spent, and time spent.'),
});
export type SummarizePatronVisitInput = z.infer<typeof SummarizePatronVisitInputSchema>;

const SummarizePatronVisitOutputSchema = z.object({
  summary: z.string().describe('A summary of the patron visit.'),
});
export type SummarizePatronVisitOutput = z.infer<typeof SummarizePatronVisitOutputSchema>;

export async function summarizePatronVisit(input: SummarizePatronVisitInput): Promise<SummarizePatronVisitOutput> {
  return summarizePatronVisitFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePatronVisitPrompt',
  input: {schema: SummarizePatronVisitInputSchema},
  output: {schema: SummarizePatronVisitOutputSchema},
  prompt: `You are a casino manager. Summarize the following patron visit based on the transaction data provided.  Focus on key elements such as games played, amounts spent, and time spent.

Transaction Data: {{{transactionData}}}`,
});

const summarizePatronVisitFlow = ai.defineFlow(
  {
    name: 'summarizePatronVisitFlow',
    inputSchema: SummarizePatronVisitInputSchema,
    outputSchema: SummarizePatronVisitOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
