import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import type { Question } from '@monorepo/shared/entities/Question';
import { describe, expect, it, vi } from 'vitest';

import type { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import type { QuestionRepository } from '@infra/database/dynamo/repositories/QuestionRepository';
import type { QuestionClassificationCacheRepository } from '@infra/database/dynamo/repositories/QuestionClassificationCacheRepository';
import type { QuestionAnonymizationClassifier } from '@infra/services/QuestionAnonymizationClassifier';
import type { JevQuestionClassifier } from '@infra/services/JevQuestionClassifier';

import { InsertQuestionsInFormUseCase } from './InsertQuestionsInFormUseCase';

describe('InsertQuestionsInFormUseCase classification', () => {
  it('uses Jev when confident and falls back to Gemini on error or low confidence', async () => {
    const saveMany = vi.fn();
    const put = vi.fn();
    const jevClassify = vi.fn(async () => new Map<string, JevQuestionClassifier.Verdict>([
      ['confident', { needsAnonymization: false, probability: 0.1, ms: 1, usage: {} as never }],
      ['unsure', { needsAnonymization: true, probability: 0.55, ms: 1, usage: {} as never }],
      ['failed', { error: 'timeout', ms: 8000 }],
    ]));
    const geminiClassify = vi.fn(async (items: QuestionAnonymizationClassifier.Item[]) => new Map(
      items.map((item) => [item.id, {
        needsAnonymization: true,
        confidence: 0.8,
        reason: 'gemini',
        classifiedAt: '2026-01-01T00:00:00.000Z',
      }]),
    ));

    const useCase = new InsertQuestionsInFormUseCase(
      { findById: async () => ({ id: 'form', accountId: 'acc' }) } as unknown as FormRepository,
      { findByFormId: async () => [], deleteMany: vi.fn(), saveMany } as unknown as QuestionRepository,
      { get: async () => null, put } as unknown as QuestionClassificationCacheRepository,
      { classify: geminiClassify } as unknown as QuestionAnonymizationClassifier,
      { classify: jevClassify } as unknown as JevQuestionClassifier,
    );

    await useCase.execute({
      accountId: 'acc',
      formId: 'form',
      questions: [
        { id: 'confident', text: 'Você gostou do evento?', questionType: QuestionType.TEXT, order: 1 },
        { id: 'unsure', text: 'O que achou da palestra?', questionType: QuestionType.TEXT, order: 2 },
        { id: 'failed', text: 'Qual sua cor favorita?', questionType: QuestionType.TEXT, order: 3 },
      ],
    });

    expect(geminiClassify).toHaveBeenCalledTimes(1);
    expect(geminiClassify.mock.calls[0][0].map((item) => item.id)).toEqual(['unsure', 'failed']);

    const saved = new Map((saveMany.mock.calls[0][0] as Question[]).map((q) => [q.id, q]));
    expect(saved.get('confident')?.anonymizationSuggestion).toMatchObject({
      needsAnonymization: false,
      confidence: 0.9,
    });
    expect(saved.get('unsure')?.anonymizationSuggestion?.reason).toBe('gemini');
    expect(saved.get('failed')?.anonymizationSuggestion?.reason).toBe('gemini');
    expect(put).toHaveBeenCalledTimes(3);
  });
});
