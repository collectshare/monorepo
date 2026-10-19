import { Question } from '@monorepo/shared/entities/Question';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { describe, expect, it, vi } from 'vitest';

import type { AnswerRepository } from '@infra/database/dynamo/repositories/AnswerRepository';
import type { FormSubmissionRepository } from '@infra/database/dynamo/repositories/FormSubmissionRepository';
import type { QuestionRepository } from '@infra/database/dynamo/repositories/QuestionRepository';
import type { AnonymizationEngine } from '@infra/services/AnonymizationEngine';

import { GetPublishedFormDataQuery } from './GetPublishedFormDataQuery';

describe('GetPublishedFormDataQuery', () => {
  it('drops answers to deleted questions and FILE questions, resolving the rest', async () => {
    const question = { id: 'q-text', formId: 'form-1', questionType: QuestionType.TEXT } as unknown as Question;
    const fileQuestion = { id: 'q-file', formId: 'form-1', questionType: QuestionType.FILE } as unknown as Question;
    const submittedAt = new Date('2026-01-01');

    const query = new GetPublishedFormDataQuery(
      {
        findByFormIdPaginated: vi.fn().mockResolvedValue({ submissions: [{ id: 'sub-1', submittedAt }] }),
      } as unknown as FormSubmissionRepository,
      {
        findBySubmissionId: vi.fn().mockResolvedValue([
          { questionId: 'q-text', value: 'ok' },
          { questionId: 'q-file', value: 'file.pdf' },
          { questionId: 'q-deleted', value: 'raw cpf 123.456.789-00' },
        ]),
      } as unknown as AnswerRepository,
      { findByFormId: vi.fn().mockResolvedValue([question, fileQuestion]) } as unknown as QuestionRepository,
      { resolve: vi.fn((_q, value) => `resolved:${value}`) } as unknown as AnonymizationEngine,
    );

    const { rows } = await query.execute({ formId: 'form-1', limit: 10 });

    expect(rows).toEqual([
      { submissionId: 'sub-1', submittedAt, answers: [{ questionId: 'q-text', value: 'resolved:ok' }] },
    ]);
  });
});
