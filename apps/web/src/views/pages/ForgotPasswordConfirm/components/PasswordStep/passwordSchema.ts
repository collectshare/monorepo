import z from 'zod';

import { passwordSchema as basePasswordSchema } from '@/app/schemas/passwordSchema';

export const passwordSchema = z.object({
  newPassword: basePasswordSchema,
  confirmNewPassword: basePasswordSchema,
})
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'A nova senha e sua confirmação devem ser idênticas',
    path: ['confirmNewPassword'],
  });
