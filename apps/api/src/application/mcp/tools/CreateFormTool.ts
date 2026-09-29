import { z } from 'zod';

import { CreateFormController } from '@application/controllers/form/CreateFormController';
import { createFormSchema } from '@application/controllers/form/schemas/createFormSchema';
import { Injectable } from '@kernel/decorators/Injectable';

import { McpTool, McpToolContext } from '../McpTool';

const argsSchema = createFormSchema;

@Injectable()
export class CreateFormTool extends McpTool<typeof argsSchema> {
  readonly name = 'create_form';

  readonly title = 'Create a form';

  readonly description = 'Creates a new form in the connected account and returns its formId. Add questions afterwards with insert_questions.';

  readonly annotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };

  protected readonly argsSchema = argsSchema;

  constructor(private readonly createFormController: CreateFormController) {
    super();
  }

  protected run(args: z.infer<typeof argsSchema>, context: McpToolContext) {
    return this.callPrivate(this.createFormController, { body: args }, context);
  }
}
