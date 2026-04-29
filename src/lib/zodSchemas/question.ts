import * as z from 'zod';

export const QuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  correctAnswer: z.string(),
});
