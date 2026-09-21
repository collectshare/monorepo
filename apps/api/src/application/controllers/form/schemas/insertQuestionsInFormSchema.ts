import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { z } from 'zod';

const generalizationConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('date_truncate'), precision: z.enum(['year', 'month']) }),
  z.object({ type: z.literal('numeric_range'), step: z.number().positive() }),
  z.object({ type: z.literal('text_prefix'), chars: z.number().int().positive() }),
  z.object({ type: z.literal('cep_region'), precision: z.enum(['state', 'ddd']) }),
]);

const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
  questionType: z.nativeEnum(QuestionType),
  order: z.number().int().positive(),
  options: z.array(z.string()).optional(),
  max: z.number().int().positive().optional(),
  isRequired: z.boolean().optional(),
  piiStrategy: z.enum(['pseudonymize', 'generalize', 'suppress']).nullable().optional(),
  generalizationConfig: generalizationConfigSchema.optional(),
}).refine(
  (question) => question.piiStrategy !== 'generalize' || question.generalizationConfig !== undefined,
  { message: 'generalizationConfig is required when piiStrategy is "generalize"', path: ['generalizationConfig'] },
);

export const insertQuestionsInFormSchema = z.object({
  questions: z.array(questionSchema).min(1),
});

export type InsertQuestionsInFormBody = z.infer<typeof insertQuestionsInFormSchema>;
