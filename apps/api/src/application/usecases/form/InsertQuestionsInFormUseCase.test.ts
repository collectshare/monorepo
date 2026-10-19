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

  it('shares one deadline between Jev and Gemini and skips Gemini when it runs out', async () => {
    vi.useFakeTimers();

    try {
      const saveMany = vi.fn();
      const jevClassify = vi.fn(async (items: JevQuestionClassifier.Item[], _timeoutMs: number) => {
        vi.advanceTimersByTime(9_500);
        return new Map<string, JevQuestionClassifier.Verdict>(
          items.map((item) => [item.id, { error: 'aborted', ms: 9_500 }]),
        );
      });
      const geminiClassify = vi.fn();

      const useCase = new InsertQuestionsInFormUseCase(
        { findById: async () => ({ id: 'form', accountId: 'acc' }) } as unknown as FormRepository,
        { findByFormId: async () => [], deleteMany: vi.fn(), saveMany } as unknown as QuestionRepository,
        { get: async () => null, put: vi.fn() } as unknown as QuestionClassificationCacheRepository,
        { classify: geminiClassify } as unknown as QuestionAnonymizationClassifier,
        { classify: jevClassify } as unknown as JevQuestionClassifier,
      );

      await useCase.execute({
        accountId: 'acc',
        formId: 'form',
        questions: [{ id: 'q', text: 'Qual sua cor favorita?', questionType: QuestionType.TEXT, order: 1 }],
      });

      expect(jevClassify.mock.calls[0][1]).toBe(4_000);
      expect(geminiClassify).not.toHaveBeenCalled();
      expect((saveMany.mock.calls[0][0] as Question[])[0].anonymizationSuggestion).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('saves reordered options in the order sent', async () => {
    const saveMany = vi.fn();
    const existing = {
      id: 'q1', formId: 'form', text: 'Cor favorita?', questionType: QuestionType.MULTIPLE_CHOICE, order: 1,
      options: ['Azul', 'Verde', 'Amarelo'],
    } as Question;

    const useCase = new InsertQuestionsInFormUseCase(
      { findById: async () => ({ id: 'form', accountId: 'acc' }) } as unknown as FormRepository,
      { findByFormId: async () => [existing], deleteMany: vi.fn(), saveMany } as unknown as QuestionRepository,
      {} as QuestionClassificationCacheRepository,
      {} as QuestionAnonymizationClassifier,
      {} as JevQuestionClassifier,
    );

    await useCase.execute({
      accountId: 'acc',
      formId: 'form',
      questions: [{ ...existing, options: ['Verde', 'Amarelo', 'Azul'] }],
    });

    expect(saveMany).toHaveBeenCalledTimes(1);
    expect((saveMany.mock.calls[0][0] as Question[])[0].options).toEqual(['Verde', 'Amarelo', 'Azul']);
    expect(existing.options).toEqual(['Azul', 'Verde', 'Amarelo']);
  });
});
