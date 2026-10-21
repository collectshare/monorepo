import { z } from 'zod';

import { updateFormSchema } from '@application/controllers/form/schemas/updateFormSchema';
import { UpdateFormDetailsController } from '@application/controllers/form/UpdateFormDetailsController';
import { Injectable } from '@kernel/decorators/Injectable';

import { McpTool, McpToolContext } from '../McpTool';

const argsSchema = updateFormSchema.extend({
  formId: z.string().min(1).describe('Id of the form to update. It must belong to the connected account.'),
});

@Injectable()
export class UpdateFormTool extends McpTool<typeof argsSchema> {
  readonly name = 'update_form';

  readonly title = 'Update form details';

  readonly description = 'Replaces the details of one of your forms (title, description, tags, flags). Title, description and tags are replaced (omitted description/tags are cleared); omitted onePage and descriptionAlign keep their current value.';

  readonly annotations = { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false };

  protected readonly argsSchema = argsSchema;

  constructor(private readonly updateFormDetailsController: UpdateFormDetailsController) {
    super();
  }

  protected run({ formId, ...body }: z.infer<typeof argsSchema>, context: McpToolContext) {
    return this.callPrivate(this.updateFormDetailsController, { params: { formId }, body }, context);
  }
}
