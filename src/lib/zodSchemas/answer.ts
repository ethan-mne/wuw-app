import * as z from 'zod';

export const answerSchema = z.object({
  id: z.string(),
  answer: z.string(),
  questionId: z.string(),
});
