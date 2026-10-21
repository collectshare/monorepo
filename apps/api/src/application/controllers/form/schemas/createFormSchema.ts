import { z } from 'zod';

export const createFormSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().describe('Markdown: paragraphs, line breaks, **bold**, *italic*, [links](https://…) and lists. HTML is ignored.'),
  descriptionAlign: z.enum(['left', 'center', 'right']).optional().describe('Alignment of the whole description on the response page. Omitted = center on create, unchanged on update.'),
  tags: z.array(z.string()).optional(),
  onePage: z.boolean().default(false),
});

export type CreateFormBody = z.infer<typeof createFormSchema>;
