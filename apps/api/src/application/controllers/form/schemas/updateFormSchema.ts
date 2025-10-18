import { z } from 'zod';

export const updateFormSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isAnonymous: z.boolean().default(true),
  onePage: z.boolean().default(false),
});

export type UpdateFormBody = z.infer<typeof updateFormSchema>;
