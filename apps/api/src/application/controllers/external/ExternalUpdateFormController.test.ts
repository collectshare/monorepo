import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';
import { describe, expect, it, vi } from 'vitest';

import { Controller } from '@application/contracts/Controller';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import type { UpdateFormDetailsUseCase } from '@application/usecases/form/UpdateFormDetailsUseCase';
import type { UpdateFormBody } from '@application/controllers/form/schemas/updateFormSchema';

import { ExternalUpdateFormController } from './ExternalUpdateFormController';

function createController(options: {
  executeImpl?: () => Promise<void>;
}) {
  const updateFormDetailsUseCase = {
    execute: vi.fn(options.executeImpl ?? (() => Promise.resolve())),
  } as unknown as UpdateFormDetailsUseCase;

  const controller = new ExternalUpdateFormController(updateFormDetailsUseCase);

  return { controller, updateFormDetailsUseCase };
}

function request(
  overrides: Partial<Controller.Request<'apiKey', UpdateFormBody, { formId: string }>> = {},
): Controller.Request<'apiKey', UpdateFormBody, { formId: string }> {
  return {
    body: {
      title: 'Minha pesquisa atualizada',
      isAnonymous: true,
      onePage: false,
      isPublished: true,
    },
    params: { formId: 'form-1' },
    queryParams: {},
    ip: null,
    userAgent: null,
    accountId: 'account-1',
    apiKeyId: 'key-1',
    scopes: [ApiKeyScope.FORMS_WRITE],
    ...overrides,
  };
}

describe('ExternalUpdateFormController', () => {
  it('denies when the key lacks the forms:write scope', async () => {
    const { controller } = createController({});

    await expect(
      controller.execute(request({ scopes: [ApiKeyScope.FORMS_READ] })),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it('updates the form with a valid scope and body', async () => {
    const { controller, updateFormDetailsUseCase } = createController({});

    const response = await controller.execute(request());

    expect(response).toEqual({ statusCode: 204 });
    expect(updateFormDetailsUseCase.execute).toHaveBeenCalledWith({
      formId: 'form-1',
      accountId: 'account-1',
      title: 'Minha pesquisa atualizada',
      isAnonymous: true,
      onePage: false,
      isPublished: true,
    });
  });

  it('propagates not-allowed from the use case when the form belongs to another account', async () => {
    const { controller } = createController({
      executeImpl: () => Promise.reject(new NotAllowedError()),
    });

    await expect(controller.execute(request())).rejects.toBeInstanceOf(NotAllowedError);
  });

  it('propagates not-found from the use case when the form does not exist', async () => {
    const { controller } = createController({
      executeImpl: () => Promise.reject(new ResourceNotFound('Form not found')),
    });

    await expect(controller.execute(request())).rejects.toBeInstanceOf(ResourceNotFound);
  });
});
