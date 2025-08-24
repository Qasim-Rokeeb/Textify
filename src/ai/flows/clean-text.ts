'use server';

/**
 * @fileOverview Cleans AI-generated text by removing unwanted symbols and formatting characters.
 *
 * - cleanText - A function that handles the text cleaning process.
 * - CleanTextInput - The input type for the cleanText function.
 * - CleanTextOutput - The return type for the cleanText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {diffChars} from 'diff';

const CleanTextInputSchema = z.object({
  text: z.string().describe('The AI-generated text to be cleaned.'),
});
export type CleanTextInput = z.infer<typeof CleanTextInputSchema>;

const TextSegmentSchema = z.object({
  value: z.string(),
  added: z.boolean().optional(),
  removed: z.boolean().optional(),
});
export type TextSegment = z.infer<typeof TextSegmentSchema>;

const CleanTextOutputSchema = z.object({
  cleanedText: z
    .string()
    .describe(
      'The cleaned text, with unwanted symbols and formatting characters removed.'
    ),
  diff: z
    .array(TextSegmentSchema)
    .describe('The diff showing original text, with removed parts marked.'),
});
export type CleanTextOutput = z.infer<typeof CleanTextOutputSchema>;

export async function cleanText(input: CleanTextInput): Promise<CleanTextOutput> {
  return cleanTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cleanTextPrompt',
  input: {schema: CleanTextInputSchema},
  output: {schema: z.object({ cleanedText: z.string() })},
  prompt: `You are a text cleaning expert. Your job is to remove unwanted symbols and formatting characters from AI-generated text.

Remove symbols like #, *, and any other characters that are not part of the main text content. Preserve intentional line breaks from the original text.

Original Text: {{{text}}}

Cleaned Text:`,
});

const cleanTextFlow = ai.defineFlow(
  {
    name: 'cleanTextFlow',
    inputSchema: CleanTextInputSchema,
    outputSchema: CleanTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to get cleaned text from the model.');
    }

    const diff = diffChars(input.text, output.cleanedText);
    const resultDiff: TextSegment[] = diff.map(part => ({
      value: part.value,
      added: part.added,
      removed: part.removed,
    }));

    return {
      cleanedText: output.cleanedText,
      diff: resultDiff,
    };
  }
);
