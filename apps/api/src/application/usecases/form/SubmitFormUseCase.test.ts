import { Form } from '@monorepo/shared/entities/Form';
import { describe, expect, it, vi } from 'vitest';

import type { AppConfig } from '@shared/config/AppConfig';
import type { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import type { QuestionRepository } from '@infra/database/dynamo/repositories/QuestionRepository';
import type { SubmitFormUnitOfWork } from '@infra/database/dynamo/uow/SubmitFormUnitOfWork';

import { SubmitFormUseCase } from './SubmitFormUseCase';

describe('SubmitFormUseCase', () => {
  it('never stores the respondent IP or user agent (every form is anonymous)', async () => {
    const form = new Form({ accountId: 'account-1', title: 'Form', onePage: false });
    const submitFormUow = { run: vi.fn().mockResolvedValue(undefined) } as unknown as SubmitFormUnitOfWork;
    const formRepository = { findById: vi.fn().mockResolvedValue(form) } as unknown as FormRepository;
    const questionRepository = { findByFormId: vi.fn().mockResolvedValue([]) } as unknown as QuestionRepository;

    const useCase = new SubmitFormUseCase(submitFormUow, formRepository, questionRepository, {} as AppConfig);

    await useCase.execute({ formId: form.id, answers: [] });

    const { submission } = vi.mocked(submitFormUow.run).mock.calls[0][0];
    expect(submission).toMatchObject({ ip: null, userAgent: null });
  });
});
