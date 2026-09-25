import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';
import { describe, expect, it, vi } from 'vitest';

import { Controller } from '@application/contracts/Controller';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import type { GetFormSubmissionsUseCase } from '@application/usecases/form/GetFormSubmissionsUseCase';

import { ExternalGetOwnFormDataController } from './ExternalGetOwnFormDataController';

function createController(options: {
  executeImpl?: () => Promise<GetFormSubmissionsUseCase.Output>;
}) {
  const getFormSubmissionsUseCase = {
    execute: vi.fn(
      options.executeImpl
        ?? (() => Promise.resolve({ form: {} as any, submissions: [], questions: [], nextCursor: undefined })),
    ),
  } as unknown as GetFormSubmissionsUseCase;

  const controller = new ExternalGetOwnFormDataController(getFormSubmissionsUseCase);

  return { controller, getFormSubmissionsUseCase };
}

function request(overrides: Partial<Controller.Request<'apiKey'>> = {}): Controller.Request<'apiKey'> {
  return {
    body: {},
    params: { formId: 'form-1' },
    queryParams: {},
    ip: null,
    userAgent: null,
    accountId: 'account-1',
    apiKeyId: 'key-1',
    scopes: [ApiKeyScope.DATA_READ],
    ...overrides,
  };
}

describe('ExternalGetOwnFormDataController', () => {
  it('denies when the key lacks the data:read scope', async () => {
    const { controller } = createController({});

    await expect(
      controller.execute(request({ scopes: [ApiKeyScope.PORTAL_READ] })),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it('propagates not-found from the use case when the form does not exist', async () => {
    const { controller } = createController({
      executeImpl: () => Promise.reject(new ResourceNotFound('Form')),
    });

    await expect(controller.execute(request())).rejects.toBeInstanceOf(ResourceNotFound);
  });

  it('propagates not-allowed from the use case when the form belongs to another account', async () => {
    const { controller } = createController({
      executeImpl: () => Promise.reject(new NotAllowedError()),
    });

    await expect(controller.execute(request())).rejects.toBeInstanceOf(NotAllowedError);
  });

  it('returns a raw page of submissions with a valid scope, capping limit at 1000', async () => {
    const output = {
      form: {} as any,
      submissions: [{ id: 's1', formId: 'form-1', submittedAt: new Date(), ip: null, userAgent: null, answers: [] }],
      questions: [],
      nextCursor: 'cursor-2',
    };
    const { controller, getFormSubmissionsUseCase } = createController({
      executeImpl: () => Promise.resolve(output),
    });

    const response = await controller.execute(request({ queryParams: { limit: '5000' } }));

    expect(response.body).toEqual({
      submissions: output.submissions,
      questions: output.questions,
      nextCursor: output.nextCursor,
    });
    expect(getFormSubmissionsUseCase.execute).toHaveBeenCalledWith({
      formId: 'form-1',
      accountId: 'account-1',
      limit: 1000,
      cursor: undefined,
    });
  });
});
