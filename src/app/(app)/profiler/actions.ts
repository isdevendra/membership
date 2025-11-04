'use server';

import { summarizePatronVisit } from '@/ai/flows/summarize-patron-visit';
import { z } from 'zod';

const formSchema = z.object({
  transactionData: z.string().min(10, {
    message: 'Transaction data must be at least 10 characters long.',
  }),
});

export type FormState = {
  message: string;
  summary?: string;
  fields?: Record<string, string>;
  issues?: string[];
};

export async function generateSummary(
  prevState: FormState,
  data: FormData
): Promise<FormState> {
  const formData = Object.fromEntries(data);
  const parsed = formSchema.safeParse(formData);

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const key of Object.keys(formData)) {
      fields[key] = formData[key].toString();
    }
    return {
      message: "Invalid form data",
      fields,
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }
  
  try {
    const { summary } = await summarizePatronVisit({ transactionData: parsed.data.transactionData });
    return { message: "success", summary };
  } catch (e) {
    console.error(e);
    return {
      message: "An error occurred while generating the summary.",
      summary: "Could not generate summary. Please check the input data and try again."
    };
  }
}
