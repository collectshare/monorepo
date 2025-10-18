import { z } from 'zod';

const answerSchema = z.object({
  questionId: z.string().min(1),
  value: z.union([z.string(), z.array(z.string())]),
});

export const submitFormSchema = z.object({
  answers: z.array(answerSchema).min(1),
});

export type SubmitFormBody = z.infer<typeof submitFormSchema>;
