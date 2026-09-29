import { z } from 'zod';

import { GetFormController } from '@application/controllers/form/GetFormController';
import { Injectable } from '@kernel/decorators/Injectable';

import { McpTool, McpToolContext } from '../McpTool';

const argsSchema = z.object({
  formId: z.string().min(1).describe('Id of the form.'),
});

@Injectable()
export class GetFormTool extends McpTool<typeof argsSchema> {
  readonly name = 'get_form';

  readonly title = 'Get a form';

  readonly description = 'Returns a form and its questions, given the form id.';

  readonly annotations = { readOnlyHint: true, openWorldHint: false };

  protected readonly argsSchema = argsSchema;

  constructor(private readonly getFormController: GetFormController) {
    super();
  }

  protected run({ formId }: z.infer<typeof argsSchema>, context: McpToolContext) {
    return this.callPublic(this.getFormController, { params: { formId } }, context);
  }
}
