import { z } from 'zod';
import { passwordSchema } from './passwordSchema';

export const confirmForgotPasswordSchema = z.object({
  email: z.string().min(1, '"email" is required').email('Invalid email'),
  confirmationCode: z.string().min(1, '"confirmationCode" is required'),
  password: passwordSchema,
});

export type ConfirmForgotPasswordBody = z.infer<typeof confirmForgotPasswordSchema>;
