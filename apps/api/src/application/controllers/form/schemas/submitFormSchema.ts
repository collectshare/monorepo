import { z } from 'zod';

const fileSchema = z.object({
  name: z.string(),
  type: z.string(),
  content: z.string(), // base64
});

const answerSchema = z.object({
  questionId: z.string().min(1),
  value: z.union([z.string(), z.array(z.string()), z.number(), fileSchema]),
});

export const submitFormSchema = z.object({
  answers: z.array(answerSchema).min(1),
});

export type SubmitFormBody = z.infer<typeof submitFormSchema>;
