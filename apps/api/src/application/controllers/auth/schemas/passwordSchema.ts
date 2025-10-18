import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(1, '"password" is required')
  .min(8, '"password" should be at least 8 characters long')
  .trim()
  .refine((password) => /[A-Z]/.test(password), {
    message: '"password" must contain at least 1 uppercase letter',
  })
  .refine((password) => /[a-z]/.test(password), {
    message: '"password" must contain at least 1 lowercase letter',
  })
  .refine((password) => /[0-9]/.test(password), {
    message: '"password" must contain at least 1 number',
  })
  .refine((password) => /[!@#$%^&*]/.test(password), {
    message: '"password" must contain at least 1 special character',
  });
