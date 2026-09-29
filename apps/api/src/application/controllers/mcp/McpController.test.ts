import { describe, expect, it, vi } from 'vitest';

import { Controller } from '@application/contracts/Controller';
import { errorResponse, successResponse } from '@application/mcp/jsonRpc';
import type { McpDispatcher } from '@application/mcp/McpDispatcher';

import { McpController } from './McpController';

function setup(dispatchResult: Awaited<ReturnType<McpDispatcher['handle']>>) {
  const dispatcher = { handle: vi.fn().mockResolvedValue(dispatchResult) } as unknown as McpDispatcher;

  return { dispatcher, controller: new McpController(dispatcher) };
}

const request: Controller.Request<'private'> = {
  body: { jsonrpc: '2.0', id: 1, method: 'ping' },
  params: {},
  queryParams: {},
  ip: '1.2.3.4',
  userAgent: 'agent',
  accountId: 'account-1',
};

describe('McpController', () => {
  it('passes the message and the account context to the dispatcher', async () => {
    const { controller, dispatcher } = setup(successResponse(1, {}));

    await controller.execute(request);

    expect(dispatcher.handle).toHaveBeenCalledWith(request.body, {
      accountId: 'account-1', ip: '1.2.3.4', userAgent: 'agent',
    });
  });

  it('answers 200 with the JSON-RPC response', async () => {
    const { controller } = setup(successResponse(1, {}));

    await expect(controller.execute(request)).resolves.toEqual({
      statusCode: 200,
      body: { jsonrpc: '2.0', id: 1, result: {} },
    });
  });

  it('answers 202 without a body when there is nothing to send back', async () => {
    const { controller } = setup(null);

    await expect(controller.execute(request)).resolves.toEqual({ statusCode: 202 });
  });

  it('answers 400 for malformed messages and 200 for other protocol errors', async () => {
    expect((await setup(errorResponse(null, -32600, 'bad')).controller.execute(request)).statusCode).toBe(400);
    expect((await setup(errorResponse(null, -32700, 'bad')).controller.execute(request)).statusCode).toBe(400);
    expect((await setup(errorResponse(1, -32601, 'nope')).controller.execute(request)).statusCode).toBe(200);
    expect((await setup(errorResponse(1, -32602, 'nope')).controller.execute(request)).statusCode).toBe(200);
  });
});
