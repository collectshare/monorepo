import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';
import { describe, expect, it, vi } from 'vitest';

import { Controller } from '@application/contracts/Controller';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import type { ListFormsUseCase } from '@application/usecases/form/ListFormsUseCase';

import { ExternalListFormsController } from './ExternalListFormsController';

function createController(options: {
  executeImpl?: () => Promise<ListFormsUseCase.Output>;
}) {
  const listFormsUseCase = {
    execute: vi.fn(options.executeImpl ?? (() => Promise.resolve({ forms: [] }))),
  } as unknown as ListFormsUseCase;

  const controller = new ExternalListFormsController(listFormsUseCase);

  return { controller, listFormsUseCase };
}

function request(overrides: Partial<Controller.Request<'apiKey'>> = {}): Controller.Request<'apiKey'> {
  return {
    body: {},
    params: {},
    queryParams: {},
    ip: null,
    userAgent: null,
    accountId: 'account-1',
    apiKeyId: 'key-1',
    scopes: [ApiKeyScope.FORMS_READ],
    ...overrides,
  };
}

describe('ExternalListFormsController', () => {
  it('denies when the key lacks the forms:read scope', async () => {
    const { controller } = createController({});

    await expect(
      controller.execute(request({ scopes: [ApiKeyScope.PORTAL_READ] })),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it('returns the account\'s forms with a valid scope', async () => {
    const output = { forms: [{ id: 'form-1' } as any] };
    const { controller, listFormsUseCase } = createController({
      executeImpl: () => Promise.resolve(output),
    });

    const response = await controller.execute(request());

    expect(response).toEqual({ statusCode: 200, body: { forms: output.forms } });
    expect(listFormsUseCase.execute).toHaveBeenCalledWith({ accountId: 'account-1' });
  });
});
