import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';

import { MAX_TOOL_RESULT_CHARS } from './formatToolResult';
import { McpDispatcher, SUPPORTED_PROTOCOL_VERSIONS } from './McpDispatcher';
import { McpTool, McpToolContext } from './McpTool';
import { ToolRegistry } from './ToolRegistry';

const context: McpToolContext = { accountId: 'account-1', ip: null, userAgent: null };

class FakeTool extends McpTool {
  readonly name = 'fake_tool';

  readonly title = 'Fake';

  readonly description = 'A fake tool';

  readonly annotations = { readOnlyHint: true };

  protected readonly argsSchema = z.object({ value: z.string().min(1) });

  constructor(public readonly impl: (args: { value: string }, ctx: McpToolContext) => Promise<unknown>) {
    super();
  }

  protected run(args: { value: string }, ctx: McpToolContext) {
    return this.impl(args, ctx);
  }
}

function createDispatcher(impl: FakeTool['impl'] = async () => ({ hello: 'world' })) {
  const tool = new FakeTool(impl);
  const registry = {
    list: () => [tool.definition],
    get: (name: string) => (name === tool.name ? tool : undefined),
  } as unknown as ToolRegistry;

  return { dispatcher: new McpDispatcher(registry), tool };
}

const request = (method: string, params?: unknown, id: string | number = 1) => ({
  jsonrpc: '2.0', id, method, ...(params === undefined ? {} : { params }),
});

describe('McpDispatcher protocol', () => {
  it('answers requests with a response carrying the same id', async () => {
    const { dispatcher } = createDispatcher();

    await expect(dispatcher.handle(request('ping', undefined, 'abc'), context)).resolves.toEqual({
      jsonrpc: '2.0', id: 'abc', result: {},
    });
  });

  it('returns null for notifications and client responses (transport answers 202)', async () => {
    const { dispatcher } = createDispatcher();

    await expect(dispatcher.handle({ jsonrpc: '2.0', method: 'notifications/initialized' }, context)).resolves.toBeNull();
    await expect(dispatcher.handle({ jsonrpc: '2.0', id: 7, result: {} }, context)).resolves.toBeNull();
  });

  it('rejects batches with -32600', async () => {
    const { dispatcher } = createDispatcher();

    await expect(dispatcher.handle([request('ping')], context)).resolves.toMatchObject({
      id: null, error: { code: -32600 },
    });
  });

  it('rejects structurally invalid requests with -32600', async () => {
    const { dispatcher } = createDispatcher();

    for (const raw of [null, 'text', 42, { id: 1, method: 'ping' }, { jsonrpc: '2.0' }]) {
      await expect(dispatcher.handle(raw, context)).resolves.toMatchObject({ error: { code: -32600 } });
    }
  });

  it('answers unknown methods with -32601', async () => {
    const { dispatcher } = createDispatcher();

    await expect(dispatcher.handle(request('resources/list'), context)).resolves.toMatchObject({
      id: 1, error: { code: -32601 },
    });
  });

  describe('initialize', () => {
    it('echoes a supported protocol version and advertises tools', async () => {
      const { dispatcher } = createDispatcher();

      const response = await dispatcher.handle(request('initialize', { protocolVersion: '2025-06-18' }), context);

      expect(response).toMatchObject({
        result: {
          protocolVersion: '2025-06-18',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'collectshare-mcp' },
        },
      });
    });

    it('falls back to the newest supported version', async () => {
      const { dispatcher } = createDispatcher();

      const response = await dispatcher.handle(request('initialize', { protocolVersion: '1999-01-01' }), context);

      expect(response).toMatchObject({ result: { protocolVersion: SUPPORTED_PROTOCOL_VERSIONS[0] } });
    });

    it('requires protocolVersion', async () => {
      const { dispatcher } = createDispatcher();

      await expect(dispatcher.handle(request('initialize', {}), context)).resolves.toMatchObject({
        error: { code: -32602 },
      });
    });
  });

  it('lists tools', async () => {
    const { dispatcher, tool } = createDispatcher();

    await expect(dispatcher.handle(request('tools/list'), context)).resolves.toMatchObject({
      result: { tools: [tool.definition] },
    });
  });
});

describe('McpDispatcher tools/call', () => {
  const call = (params: unknown) => request('tools/call', params);

  it('wraps a successful result as JSON text with isError false', async () => {
    const { dispatcher } = createDispatcher(async () => ({ hello: 'world' }));

    const response = await dispatcher.handle(call({ name: 'fake_tool', arguments: { value: 'x' } }), context);

    expect(response).toEqual({
      jsonrpc: '2.0',
      id: 1,
      result: { content: [{ type: 'text', text: '{"hello":"world"}' }], isError: false },
    });
  });

  it('passes the authenticated context to the tool', async () => {
    const impl = vi.fn().mockResolvedValue({});
    const { dispatcher } = createDispatcher(impl);

    await dispatcher.handle(call({ name: 'fake_tool', arguments: { value: 'x' } }), context);

    expect(impl).toHaveBeenCalledWith({ value: 'x' }, context);
  });

  it('never lets an accountId argument through', async () => {
    const impl = vi.fn().mockResolvedValue({});
    const { dispatcher, tool } = createDispatcher(impl);
    const execute = vi.spyOn(tool, 'execute');

    await dispatcher.handle(call({ name: 'fake_tool', arguments: { value: 'x', accountId: 'victim' } }), context);

    expect(execute).toHaveBeenCalledWith({ value: 'x' }, context);
  });

  it('reports invalid arguments as an isError result naming the field', async () => {
    const { dispatcher } = createDispatcher();

    const response = await dispatcher.handle(call({ name: 'fake_tool', arguments: {} }), context);

    expect(response).toMatchObject({ result: { isError: true } });
    expect((response as any).result.content[0].text).toContain('value');
  });

  it('reports application errors as isError with their code', async () => {
    const { dispatcher } = createDispatcher(async () => { throw new ResourceNotFound('Dataset not found'); });

    const response = await dispatcher.handle(call({ name: 'fake_tool', arguments: { value: 'x' } }), context);

    expect(response).toMatchObject({ result: { isError: true } });
    expect((response as any).result.content[0].text).toContain('RESOURCE_NOT_FOUND');
    expect((response as any).result.content[0].text).toContain('Dataset not found');
  });

  it('hides unexpected error details', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { dispatcher } = createDispatcher(async () => { throw new Error('db password is hunter2'); });

    const response = await dispatcher.handle(call({ name: 'fake_tool', arguments: { value: 'x' } }), context);

    expect((response as any).result.isError).toBe(true);
    expect((response as any).result.content[0].text).toBe('Internal server error.');
    log.mockRestore();
  });

  it('refuses oversized results instead of truncating them', async () => {
    const { dispatcher } = createDispatcher(async () => ({ blob: 'x'.repeat(MAX_TOOL_RESULT_CHARS) }));

    const response = await dispatcher.handle(call({ name: 'fake_tool', arguments: { value: 'x' } }), context);

    expect((response as any).result.isError).toBe(true);
    expect((response as any).result.content[0].text).toContain('too large');
  });

  it('answers unknown tools and malformed params with -32602', async () => {
    const { dispatcher } = createDispatcher();

    for (const params of [
      { name: 'nope', arguments: {} },
      { arguments: {} },
      { name: '' },
      { name: 'fake_tool', arguments: [] },
      { name: 'fake_tool', arguments: 'x' },
    ]) {
      await expect(dispatcher.handle(call(params), context)).resolves.toMatchObject({ error: { code: -32602 } });
    }
  });

  it('treats missing arguments as an empty object', async () => {
    const { dispatcher } = createDispatcher();

    const response = await dispatcher.handle(call({ name: 'fake_tool' }), context);

    expect(response).toMatchObject({ result: { isError: true } });
  });
});
