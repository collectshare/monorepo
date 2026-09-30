import { z } from 'zod';

import { ListFormsController } from '@application/controllers/form/ListFormsController';
import { Injectable } from '@kernel/decorators/Injectable';

import { McpTool, McpToolContext } from '../McpTool';

const argsSchema = z.object({});

@Injectable()
export class ListFormsTool extends McpTool<typeof argsSchema> {
  readonly name = 'list_forms';

  readonly title = 'List my forms';

  readonly description = 'Lists the forms owned by the connected Collectshare account.';

  readonly annotations = { readOnlyHint: true, openWorldHint: false };

  protected readonly argsSchema = argsSchema;

  constructor(private readonly listFormsController: ListFormsController) {
    super();
  }

  protected run(_args: z.infer<typeof argsSchema>, context: McpToolContext) {
    return this.callPrivate(this.listFormsController, {}, context);
  }
}
