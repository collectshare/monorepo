import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { z } from 'zod';

const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
  questionType: z.nativeEnum(QuestionType),
  order: z.number().int().positive(),
  options: z.array(z.string()).optional(),
  max: z.number().int().positive().optional(),
  isRequired: z.boolean().optional(),
});

export const insertQuestionsInFormSchema = z.object({
  questions: z.array(questionSchema).min(1),
});

export type InsertQuestionsInFormBody = z.infer<typeof insertQuestionsInFormSchema>;
