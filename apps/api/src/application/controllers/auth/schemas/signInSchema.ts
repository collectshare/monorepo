import { z } from 'zod';
import { passwordSchema } from './passwordSchema';

export const signInSchema = z.object({
  email: z.string().min(1, '"email" is required').email('Invalid email'),
  password: passwordSchema,
});

export type SignInBody = z.infer<typeof signInSchema>;
