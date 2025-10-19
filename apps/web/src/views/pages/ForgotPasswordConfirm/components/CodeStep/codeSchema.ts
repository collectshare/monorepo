import z from 'zod';

export const codeSchema = z.object({
  code: z.string({
    message: 'O código é obrigatório',
  }).min(6, 'O código deve ter 6 caracteres').max(6, 'O código deve ter 6 caracteres'),
});
