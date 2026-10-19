import { z } from 'zod';

export const updateFormSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // No defaults here (unlike createFormSchema): an omitted flag keeps the form's
  // current value, so a partial PUT can't silently republish an unpublished form.
  isAnonymous: z.boolean().optional(),
  onePage: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export type UpdateFormBody = z.infer<typeof updateFormSchema>;
