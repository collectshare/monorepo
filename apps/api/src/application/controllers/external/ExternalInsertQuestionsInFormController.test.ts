import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { describe, expect, it, vi } from 'vitest';

import { Controller } from '@application/contracts/Controller';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import type { InsertQuestionsInFormUseCase } from '@application/usecases/form/InsertQuestionsInFormUseCase';
import type { InsertQuestionsInFormBody } from '@application/controllers/form/schemas/insertQuestionsInFormSchema';

import { ExternalInsertQuestionsInFormController } from './ExternalInsertQuestionsInFormController';

function createController(options: {
  executeImpl?: () => Promise<void>;
}) {
  const insertQuestionsInFormUseCase = {
    execute: vi.fn(options.executeImpl ?? (() => Promise.resolve())),
  } as unknown as InsertQuestionsInFormUseCase;

  const controller = new ExternalInsertQuestionsInFormController(insertQuestionsInFormUseCase);

  return { controller, insertQuestionsInFormUseCase };
}

function request(
  overrides: Partial<Controller.Request<'apiKey', InsertQuestionsInFormBody, { formId: string }>> = {},
): Controller.Request<'apiKey', InsertQuestionsInFormBody, { formId: string }> {
  return {
    body: {
      questions: [
        { text: 'Qual sua idade?', questionType: QuestionType.TEXT, order: 1 },
      ],
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

describe('ExternalInsertQuestionsInFormController', () => {
  it('denies when the key lacks the forms:write scope', async () => {
    const { controller } = createController({});

    await expect(
      controller.execute(request({ scopes: [ApiKeyScope.FORMS_READ] })),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it('replaces the form questions with a valid scope and body', async () => {
    const { controller, insertQuestionsInFormUseCase } = createController({});

    const response = await controller.execute(request());

    expect(response).toEqual({ statusCode: 204 });
    expect(insertQuestionsInFormUseCase.execute).toHaveBeenCalledWith({
      questions: [{ text: 'Qual sua idade?', questionType: QuestionType.TEXT, order: 1 }],
      formId: 'form-1',
      accountId: 'account-1',
    });
  });

  it('rejects an empty questions array', () => {
    const { controller } = createController({});

    expect(() =>
      controller.execute(request({ body: { questions: [] } })),
    ).toThrow();
  });

  it('propagates not-allowed from the use case when the form belongs to another account', async () => {
    const { controller } = createController({
      executeImpl: () => Promise.reject(new NotAllowedError()),
    });

    await expect(controller.execute(request())).rejects.toBeInstanceOf(NotAllowedError);
  });
});
