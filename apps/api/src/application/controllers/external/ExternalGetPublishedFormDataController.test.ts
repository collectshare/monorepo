import { Form } from '@monorepo/shared/entities/Form';
import { Question } from '@monorepo/shared/entities/Question';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';
import { describe, expect, it, vi } from 'vitest';

import { Controller } from '@application/contracts/Controller';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import type { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import type { QuestionRepository } from '@infra/database/dynamo/repositories/QuestionRepository';
import type { GetPublishedFormDataQuery } from '@application/queries/GetPublishedFormDataQuery';

import { ExternalGetPublishedFormDataController } from './ExternalGetPublishedFormDataController';

function createForm(attrs: Partial<Form.Attributes> = {}): Form {
  return new Form({
    accountId: 'account-1',
    title: 'Form',
    isPublished: true,
    ...attrs,
  } as Form.Attributes);
}

function createController(options: {
  form?: Form | null;
  questions?: Question[];
  queryResult?: GetPublishedFormDataQuery.Output;
}) {
  const formRepository = {
    findById: vi.fn().mockResolvedValue(options.form ?? null),
  } as unknown as FormRepository;

  const questionRepository = {
    findByFormId: vi.fn().mockResolvedValue(options.questions ?? []),
  } as unknown as QuestionRepository;

  const getPublishedFormDataQuery = {
    execute: vi.fn().mockResolvedValue(options.queryResult ?? { rows: [], nextCursor: undefined }),
  } as unknown as GetPublishedFormDataQuery;

  const controller = new ExternalGetPublishedFormDataController(
    formRepository,
    questionRepository,
    getPublishedFormDataQuery,
  );

  return { controller, formRepository, questionRepository, getPublishedFormDataQuery };
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
    scopes: [ApiKeyScope.PORTAL_READ],
    ...overrides,
  };
}

describe('ExternalGetPublishedFormDataController', () => {
  it('denies when the key lacks the portal:read scope', async () => {
    const { controller } = createController({ form: createForm() });

    await expect(
      controller.execute(request({ scopes: [ApiKeyScope.FORMS_READ] })),
    ).rejects.toBeInstanceOf(NotAllowedError);
  });

  it('returns not found when the form does not exist', async () => {
    const { controller } = createController({ form: null });

    await expect(controller.execute(request())).rejects.toBeInstanceOf(ResourceNotFound);
  });

  it('returns not found when the form is not published', async () => {
    const { controller } = createController({ form: createForm({ isPublished: false }) });

    await expect(controller.execute(request())).rejects.toBeInstanceOf(ResourceNotFound);
  });

  it('returns a page of rows and the form\'s questions for a published form with a valid scope', async () => {
    const question = new Question({
      formId: 'form-1',
      text: 'How was your day?',
      questionType: QuestionType.TEXT,
      order: 0,
      anonymizationSuggestion: { needsAnonymization: true } as any,
    });
    const queryResult = { rows: [{ submissionId: 's1', submittedAt: new Date(), answers: [] }], nextCursor: 'cursor-2' };
    const { controller, questionRepository, getPublishedFormDataQuery } = createController({
      form: createForm(),
      questions: [question],
      queryResult,
    });

    const response = await controller.execute(request());

    expect(response.body).toEqual({
      questions: [{ ...question, anonymizationSuggestion: undefined }],
      rows: queryResult.rows,
      nextCursor: queryResult.nextCursor,
    });
    expect(questionRepository.findByFormId).toHaveBeenCalledWith('form-1');
    expect(getPublishedFormDataQuery.execute).toHaveBeenCalledWith({
      formId: 'form-1',
      limit: 20,
      cursor: undefined,
    });
  });

  it('caps the requested limit at 1000', async () => {
    const { controller, getPublishedFormDataQuery } = createController({ form: createForm() });

    await controller.execute(request({ queryParams: { limit: '5000' } }));

    expect(getPublishedFormDataQuery.execute).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 1000 }),
    );
  });
});
