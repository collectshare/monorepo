import { describe, expect, it, vi } from 'vitest';

import type { Controller } from '@application/contracts/Controller';

import { lambdaHttpAdapter } from './lambdaHttpAdapter';

function createControllerStub() {
  return {
    execute: vi.fn().mockResolvedValue({ statusCode: 200, body: { ok: true } }),
  } as unknown as Controller<any, unknown>;
}

function baseEvent(requestContext: Record<string, unknown>) {
  return {
    body: null,
    pathParameters: { formId: 'form-1' },
    queryStringParameters: {},
    requestContext: {
      http: { sourceIp: '127.0.0.1', userAgent: 'test-agent' },
      ...requestContext,
    },
  } as any;
}

describe('lambdaHttpAdapter', () => {
  it('extracts accountId from a Cognito JWT authorizer', async () => {
    const controller = createControllerStub();
    const handler = lambdaHttpAdapter(controller);

    await handler(baseEvent({ authorizer: { jwt: { claims: { internalId: 'account-1' } } } }));

    expect(controller.execute).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: 'account-1', apiKeyId: undefined, scopes: undefined }),
    );
  });

  it('extracts accountId, apiKeyId and scopes from an API-key Lambda authorizer', async () => {
    const controller = createControllerStub();
    const handler = lambdaHttpAdapter(controller);

    await handler(baseEvent({
      authorizer: { lambda: { accountId: 'account-1', apiKeyId: 'key-1', scopes: 'portal:read,forms:read' } },
    }));

    expect(controller.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'account-1',
        apiKeyId: 'key-1',
        scopes: ['portal:read', 'forms:read'],
      }),
    );
  });

  it('leaves accountId null for a public route with no authorizer', async () => {
    const controller = createControllerStub();
    const handler = lambdaHttpAdapter(controller);

    await handler(baseEvent({}));

    expect(controller.execute).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: null, apiKeyId: undefined, scopes: undefined }),
    );
  });
});
