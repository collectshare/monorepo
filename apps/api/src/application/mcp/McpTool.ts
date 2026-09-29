import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Controller } from '@application/contracts/Controller';

export type McpToolAnnotations = {
  title?: string;
  readOnlyHint: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
};

export type McpToolContext = {
  accountId: string;
  ip: string | null;
  userAgent: string | null;
};

export type McpToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: McpToolAnnotations;
};

type ControllerRequestParts = {
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
  queryParams?: Record<string, unknown>;
};

/**
 * A tool is a thin adapter: flat MCP arguments (validated by `argsSchema`) are mapped to the
 * `body/params/queryParams` of an existing controller, which is executed in-process on behalf of
 * the authenticated account. The account never comes from the arguments.
 */
export abstract class McpTool<TArgsSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  abstract readonly name: string;

  abstract readonly title: string;

  abstract readonly description: string;

  abstract readonly annotations: McpToolAnnotations;

  protected abstract readonly argsSchema: TArgsSchema;

  protected abstract run(args: z.infer<TArgsSchema>, context: McpToolContext): Promise<unknown>;

  get definition(): McpToolDefinition {
    return {
      name: this.name,
      title: this.title,
      description: this.description,
      inputSchema: this.buildInputSchema(),
      annotations: { title: this.title, ...this.annotations },
    };
  }

  /** Validates the arguments (throws `ZodError`) and runs the tool. */
  async execute(rawArgs: Record<string, unknown>, context: McpToolContext): Promise<unknown> {
    const args = this.argsSchema.parse(rawArgs);

    return this.run(args, context);
  }

  private buildInputSchema(): Record<string, unknown> {
    const schema = zodToJsonSchema(this.argsSchema, {
      $refStrategy: 'none',
      target: 'jsonSchema7',
    }) as Record<string, unknown>;

    delete schema.$schema;

    return { type: 'object', ...schema };
  }

  protected callPrivate(
    controller: Controller<'private', any>,
    { body = {}, params = {}, queryParams = {} }: ControllerRequestParts,
    { accountId, ip, userAgent }: McpToolContext,
  ): Promise<unknown> {
    return this.toResult(controller.execute({ body, params, queryParams, accountId, ip, userAgent }));
  }

  protected callPublic(
    controller: Controller<'public', any>,
    { body = {}, params = {}, queryParams = {} }: ControllerRequestParts,
    { ip, userAgent }: McpToolContext,
  ): Promise<unknown> {
    return this.toResult(controller.execute({ body, params, queryParams, accountId: null, ip, userAgent }));
  }

  private async toResult(response: Promise<Controller.Response<any>>): Promise<unknown> {
    const { body } = await response;

    // Controllers answering 204 have no body; give the model an explicit acknowledgement.
    return body === undefined ? { ok: true } : body;
  }
}
