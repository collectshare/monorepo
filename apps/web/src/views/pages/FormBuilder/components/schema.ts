import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import z from 'zod';

const textFieldSchema = z.object({
  id: z.string().optional(),
  text: z.string({ required_error: 'O nome da pergunta é obrigatório' }).min(1, 'O nome da pergunta é obrigatório'),
  questionType: z.literal(QuestionType.TEXT),
  options: z.array(z.string()).optional(),
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
});

export const fieldSchema = z.discriminatedUnion('questionType', [
  textFieldSchema,
  optionFieldSchema,
]);

export const formBuilderFormData = z.object({
  name: z.string({ required_error: 'O nome é obrigatório' }).min(1, 'O nome é obrigatório'),
  fields: z.array(fieldSchema),
});
