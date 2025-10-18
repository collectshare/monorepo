import { z } from 'zod';

export const passwordSchema = z
  .string()
  .nonempty('Senha é obrigatório')
  .min(8, 'Senha deve conter pelo menos 8 dígitos')
  .trim()
  .refine((password) => /[A-Z]/.test(password), {
    message: 'Senha deve conter ao menos 1 caractere maiúsculo',
  })
  .refine((password) => /[a-z]/.test(password), {
    message: 'Senha deve conter ao menos 1 caractere minusculo',
  })
  .refine((password) => /[0-9]/.test(password), {
    message: 'Senha deve conter ao menos 1 número',
  })
  .refine((password) => /[!@#$%^&*]/.test(password), {
    message: 'Senha deve conter ao menos 1 caractere especial',
  });
