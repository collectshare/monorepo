import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import z from 'zod';

const generalizationConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('date_truncate'), precision: z.enum(['year', 'month']) }),
  z.object({ type: z.literal('numeric_range'), step: z.number().positive() }),
  z.object({ type: z.literal('text_prefix'), chars: z.number().int().positive() }),
  z.object({ type: z.literal('cep_region'), precision: z.enum(['state', 'ddd']) }),
]);

const anonymizationFields = {
  piiStrategy: z.enum(['pseudonymize', 'generalize', 'suppress']).nullable().optional(),
  generalizationConfig: generalizationConfigSchema.optional(),
};

const noOptionsFieldSchema = z.object({
  id: z.string().optional(),
  text: z.string({ required_error: 'O nome da pergunta é obrigatório' }).min(1, 'O nome da pergunta é obrigatório'),
  questionType: z.enum([QuestionType.TEXT, QuestionType.STARS, QuestionType.FILE]),
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().optional(),
  max: z.number().optional(),
  ...anonymizationFields,
});

const optionFieldSchema = z.object({
  id: z.string().optional(),
  text: z.string({ required_error: 'O nome da pergunta é obrigatório' }).min(1, 'O nome da pergunta é obrigatório'),
  questionType: z.enum([
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.CHECKBOX,
    QuestionType.DROPDOWN,
  ]),
  options: z.array(
    z.string({ required_error: 'As opções devem ser preenchidas' })
      .trim(),
  )
    .min(1, 'É necessária pelo menos uma opção para este tipo de pergunta')
    .refine((options) => new Set(options).size === options.length, {
      message: 'As opções devem ser únicas',
    })
    .refine((options) => options.every((option) => option.length > 0), {
      message: 'Todas as opções devem estar preenchidas',
    }),
  isRequired: z.boolean().optional(),
  ...anonymizationFields,
});

export const fieldSchema = z.discriminatedUnion('questionType', [
  noOptionsFieldSchema,
  optionFieldSchema,
]).refine(
  (field) => field.piiStrategy !== 'generalize' || field.generalizationConfig !== undefined,
  { message: 'Selecione como o dado deve ser generalizado', path: ['generalizationConfig'] },
);

export const formBuilderFormData = z.object({
  name: z.string({ required_error: 'O nome é obrigatório' }).min(1, 'O nome é obrigatório'),
  fields: z.array(fieldSchema),
});
