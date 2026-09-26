import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';
import { describe, expect, it, vi } from 'vitest';

import { Controller } from '@application/contracts/Controller';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import type { CreateFormUseCase } from '@application/usecases/form/CreateFormUseCase';
import type { CreateFormBody } from '@application/controllers/form/schemas/createFormSchema';

import { ExternalCreateFormController } from './ExternalCreateFormController';

function createController(options: {
  executeImpl?: () => Promise<CreateFormUseCase.Output>;
}) {
  const createFormUseCase = {
    execute: vi.fn(options.executeImpl ?? (() => Promise.resolve({ formId: 'form-1' }))),
  } as unknown as CreateFormUseCase;

  const controller = new ExternalCreateFormController(createFormUseCase);

  return { controller, createFormUseCase };
}

function request(
  overrides: Partial<Controller.Request<'apiKey', CreateFormBody>> = {},
): Controller.Request<'apiKey', CreateFormBody> {
  return {
    body: {
      title: 'Minha pesquisa',
      isAnonymous: true,
      onePage: false,
      isPublished: true,
    },
    params: {},
    queryParams: {},
    ip: null,
    userAgent: null,
    accountId: 'account-1',
    apiKeyId: 'key-1',
    scopes: [ApiKeyScope.FORMS_WRITE],
    ...overrides,
  };
}

describe('ExternalCreateFormController', () => {
  it('denies when the key lacks the forms:write scope', async () => {
    const { controller } = createController({});

    await expect(
      controller.execute(request({ scopes: [ApiKeyScope.FORMS_READ] })),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it('creates a form with a valid scope and body', async () => {
    const { controller, createFormUseCase } = createController({
      executeImpl: () => Promise.resolve({ formId: 'form-1' }),
    });

    const response = await controller.execute(request());

    expect(response).toEqual({ statusCode: 201, body: { formId: 'form-1' } });
    expect(createFormUseCase.execute).toHaveBeenCalledWith({
      title: 'Minha pesquisa',
      isAnonymous: true,
      onePage: false,
      isPublished: true,
      accountId: 'account-1',
    });
  });

  it('rejects a body missing the required title', () => {
    const { controller } = createController({});

    expect(() =>
      controller.execute(request({ body: { isAnonymous: true, onePage: false, isPublished: true } as CreateFormBody })),
    ).toThrow();
  });
});
