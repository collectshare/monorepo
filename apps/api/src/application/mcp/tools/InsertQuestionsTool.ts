import { z } from 'zod';

import { InsertQuestionsInFormController } from '@application/controllers/form/InsertQuestionsInFormController';
import { insertQuestionsInFormSchema } from '@application/controllers/form/schemas/insertQuestionsInFormSchema';
import { Injectable } from '@kernel/decorators/Injectable';

import { McpTool, McpToolContext } from '../McpTool';

const argsSchema = insertQuestionsInFormSchema.extend({
  formId: z.string().min(1).describe('Id of the form. It must belong to the connected account.'),
});

@Injectable()
export class InsertQuestionsTool extends McpTool<typeof argsSchema> {
  readonly name = 'insert_questions';

  readonly title = 'Replace form questions';

  readonly description = 'Replaces the full question set of one of your forms. Questions with an existing "id" are updated, questions without "id" are created, and existing questions missing from the list are DELETED.';

  readonly annotations = { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false };

  protected readonly argsSchema = argsSchema;

  constructor(private readonly insertQuestionsInFormController: InsertQuestionsInFormController) {
    super();
  }

  protected run({ formId, ...body }: z.infer<typeof argsSchema>, context: McpToolContext) {
    return this.callPrivate(this.insertQuestionsInFormController, { params: { formId }, body }, context);
  }
}
