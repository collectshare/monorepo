import { z } from 'zod';
import { passwordSchema } from './passwordSchema';

export const signUpSchema = z.object({
  account: z.object({
    email: z.string().min(1, '"email" is required').email('Invalid email'),
    password: passwordSchema,
  }),
  profile: z.object({
    name: z.string().min(1, '"name" is required'),
    birthDate: z.string()
      .min(1, '"birthDate" is required')
      .date('"birthDate" should be a valid date (YYYY-MM-DD)')
      .transform(date => new Date(date)),
  }),
});

export type SignUpBody = z.infer<typeof signUpSchema>;
