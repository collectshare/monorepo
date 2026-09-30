import { describe, expect, it, vi } from 'vitest';

import type { Controller } from '@application/contracts/Controller';

import { lambdaMcpAdapter } from './lambdaMcpAdapter';

const ISSUER = 'https://api.test';
const RESOURCE_METADATA = `${ISSUER}/.well-known/oauth-protected-resource/mcp`;

function setup(options: {
  identity?: { accountId: string; grantId: string } | null;
  controllerResponse?: Controller.Response<unknown>;
  authenticateError?: Error;
} = {}) {
  const authenticator = {
    authenticate: options.authenticateError
      ? vi.fn().mockRejectedValue(options.authenticateError)
      : vi.fn().mockResolvedValue(options.identity === undefined ? { accountId: 'account-1', grantId: 'g1' } : options.identity),
  };
  const controller = {
    execute: vi.fn().mockResolvedValue(options.controllerResponse ?? { statusCode: 200, body: { jsonrpc: '2.0', id: 1, result: {} } }),
  } as unknown as Controller<'private', unknown> & { execute: ReturnType<typeof vi.fn> };

  return {
    authenticator,
    controller,
    handler: lambdaMcpAdapter({ controller, authenticator, issuer: ISSUER }),
  };
}

function event(overrides: {
  method?: string;
  headers?: Record<string, string>;
  body?: string | null;
} = {}) {
  return {
    body: overrides.body === undefined ? JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }) : overrides.body,
    headers: overrides.headers ?? {},
    requestContext: { http: { method: overrides.method ?? 'POST', sourceIp: '1.2.3.4', userAgent: 'agent' } },
  } as any;
}

describe('lambdaMcpAdapter', () => {
  it('answers 401 with the OAuth discovery challenge when there are no credentials', async () => {
    const { handler, controller, authenticator } = setup({ identity: null });

    const result = await handler(event()) as any;

    expect(result.statusCode).toBe(401);
    expect(result.headers['WWW-Authenticate']).toBe(`Bearer resource_metadata="${RESOURCE_METADATA}"`);
    expect(authenticator.authenticate).toHaveBeenCalledWith(null);
    expect(controller.execute).not.toHaveBeenCalled();
  });

  it('adds error="invalid_token" when a token was presented but is not valid', async () => {
    const { handler, controller } = setup({ identity: null });

    const result = await handler(event({ headers: { authorization: 'Bearer cs_mat_expired' } })) as any;

    expect(result.statusCode).toBe(401);
    expect(result.headers['WWW-Authenticate']).toBe(`Bearer resource_metadata="${RESOURCE_METADATA}", error="invalid_token"`);
    expect(controller.execute).not.toHaveBeenCalled();
  });

  it('ignores x-api-key entirely', async () => {
    const { handler, authenticator } = setup({ identity: null });

    const result = await handler(event({ headers: { 'x-api-key': 'cs_sk_valid' } })) as any;

    expect(result.statusCode).toBe(401);
    expect(authenticator.authenticate).toHaveBeenCalledWith(null);
  });

  it('hands whatever Bearer token it gets (even a PAT) to the MCP authenticator, which rejects it', async () => {
    const { handler, authenticator } = setup({ identity: null });

    const result = await handler(event({ headers: { authorization: 'Bearer cs_sk_valid' } })) as any;

    expect(result.statusCode).toBe(401);
    expect(authenticator.authenticate).toHaveBeenCalledWith('cs_sk_valid');
  });

  it('treats non-Bearer schemes as no credentials', async () => {
    const { handler, authenticator } = setup({ identity: null });

    await handler(event({ headers: { authorization: 'Basic abc' } }));

    expect(authenticator.authenticate).toHaveBeenCalledWith(null);
  });

  it('runs the controller as the token account and returns its JSON', async () => {
    const { handler, controller, authenticator } = setup();

    const result = await handler(event({ headers: { authorization: 'Bearer cs_mat_valid' } })) as any;

    expect(authenticator.authenticate).toHaveBeenCalledWith('cs_mat_valid');
    expect(controller.execute).toHaveBeenCalledWith(expect.objectContaining({
      accountId: 'account-1',
      ip: '1.2.3.4',
      userAgent: 'agent',
      body: { jsonrpc: '2.0', id: 1, method: 'ping' },
    }));
    expect(result.statusCode).toBe(200);
    expect(result.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(result.body)).toEqual({ jsonrpc: '2.0', id: 1, result: {} });
  });

  it('returns 202 with no body for notifications', async () => {
    const { handler } = setup({ controllerResponse: { statusCode: 202 } });

    const result = await handler(event({ headers: { authorization: 'Bearer cs_mat_valid' } })) as any;

    expect(result).toEqual({ statusCode: 202, headers: undefined, body: undefined });
  });

  it('answers GET with 405 and Allow: POST without authenticating', async () => {
    const { handler, authenticator } = setup();

    const result = await handler(event({ method: 'GET' })) as any;

    expect(result).toEqual({ statusCode: 405, headers: { Allow: 'POST' } });
    expect(authenticator.authenticate).not.toHaveBeenCalled();
  });

  it('answers malformed JSON with a -32700 JSON-RPC error', async () => {
    const { handler, controller } = setup();

    const result = await handler(event({ headers: { authorization: 'Bearer cs_mat_valid' }, body: '{oops' })) as any;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toMatchObject({ jsonrpc: '2.0', id: null, error: { code: -32700 } });
    expect(controller.execute).not.toHaveBeenCalled();
  });

  it('does not parse form bodies: content-type is irrelevant', async () => {
    const { handler } = setup();

    const result = await handler(event({
      headers: { authorization: 'Bearer cs_mat_valid', 'content-type': 'application/x-www-form-urlencoded' },
      body: 'a=1',
    })) as any;

    expect(result.statusCode).toBe(400);
  });

  it('reports infrastructure failures as 500, not as an auth challenge', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { handler } = setup({ authenticateError: new Error('dynamo down') });

    const result = await handler(event({ headers: { authorization: 'Bearer cs_mat_valid' } })) as any;

    expect(result.statusCode).toBe(500);
    expect(result.headers?.['WWW-Authenticate']).toBeUndefined();
    expect(JSON.parse(result.body)).toMatchObject({ error: { code: -32603 } });
    log.mockRestore();
  });
});
