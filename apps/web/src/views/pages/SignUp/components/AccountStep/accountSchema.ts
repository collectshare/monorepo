import z from 'zod';

import { passwordSchema } from '@/app/schemas/passwordSchema';

export const accountSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  password: passwordSchema,
});
