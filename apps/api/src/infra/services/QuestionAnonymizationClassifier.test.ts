import { AnonymizationSuggestion } from '@monorepo/shared/types/AnonymizationSuggestion';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@shared/config/env', () => ({ env: {} }));
vi.mock('@typesafe-ai/sdk', () => ({ TypeSafeClient: class {}, noul: vi.fn(), choice: vi.fn() }));
vi.mock('@google/generative-ai', () => ({ GoogleGenerativeAI: class {}, SchemaType: {} }));

import { GeminiAnonymizationProvider } from './anonymization/GeminiAnonymizationProvider';
import { JevAnonymizationProvider } from './anonymization/JevAnonymizationProvider';
import { QuestionAnonymizationClassifier } from './QuestionAnonymizationClassifier';

const suggestion = (needsAnonymization: boolean): AnonymizationSuggestion => ({
  needsAnonymization,
  confidence: 0.9,
  reason: 'r',
  classifiedAt: '2026-09-28T00:00:00.000Z',
});

const item = (id: string) => ({ id, text: `pergunta ${id}`, questionType: QuestionType.TEXT });

describe('QuestionAnonymizationClassifier', () => {
  const jevClassify = vi.fn();
  const geminiClassify = vi.fn();
  const classifier = new QuestionAnonymizationClassifier(
    { classify: jevClassify } as unknown as JevAnonymizationProvider,
    { classify: geminiClassify } as unknown as GeminiAnonymizationProvider,
  );

  beforeEach(() => {
    jevClassify.mockReset();
    geminiClassify.mockReset();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  it('does not call Gemini when Jev classifies every question', async () => {
    jevClassify.mockResolvedValue(new Map([['a', suggestion(true)], ['b', suggestion(false)]]));

    const results = await classifier.classify([item('a'), item('b')]);

    expect(geminiClassify).not.toHaveBeenCalled();
    expect(results.get('a')).toEqual(suggestion(true));
    expect(results.get('b')).toEqual(suggestion(false));
  });

  it('sends only the questions Jev could not classify to Gemini', async () => {
    jevClassify.mockResolvedValue(new Map([
      ['a', suggestion(true)],
      ['b', null],
      ['c', suggestion(false)],
      ['d', null],
      ['e', suggestion(true)],
    ]));
    geminiClassify.mockResolvedValue(new Map([['b', suggestion(false)], ['d', suggestion(true)]]));

    const results = await classifier.classify(['a', 'b', 'c', 'd', 'e'].map(item));

    expect(geminiClassify).toHaveBeenCalledTimes(1);
    expect(geminiClassify.mock.calls[0][0].map((i: { id: string }) => i.id)).toEqual(['b', 'd']);
    expect([...results.values()].every((value) => value !== null)).toBe(true);
    expect(results.get('b')).toEqual(suggestion(false));
    expect(results.get('d')).toEqual(suggestion(true));
  });

  it('sends the whole batch to Gemini when Jev fails for every question', async () => {
    jevClassify.mockResolvedValue(new Map([['a', null], ['b', null]]));
    geminiClassify.mockResolvedValue(new Map([['a', suggestion(true)], ['b', suggestion(true)]]));

    const results = await classifier.classify([item('a'), item('b')]);

    expect(geminiClassify.mock.calls[0][0].map((i: { id: string }) => i.id)).toEqual(['a', 'b']);
    expect(results.get('a')).toEqual(suggestion(true));
  });

  it('returns null when both providers fail', async () => {
    jevClassify.mockResolvedValue(new Map([['a', null]]));
    geminiClassify.mockResolvedValue(new Map([['a', null]]));

    const results = await classifier.classify([item('a')]);

    expect(results.get('a')).toBeNull();
  });

  it('logs batch counts without the question text', async () => {
    jevClassify.mockResolvedValue(new Map([
      ['a', suggestion(true)],
      ['b', suggestion(true)],
      ['c', suggestion(true)],
      ['d', null],
      ['e', null],
    ]));
    geminiClassify.mockResolvedValue(new Map([['d', suggestion(true)], ['e', null]]));

    await classifier.classify(['a', 'b', 'c', 'd', 'e'].map(item));

    const [, payload] = vi.mocked(console.info).mock.calls[0];
    expect(payload).toEqual({ total: 5, jev: 3, gemini: 1, unresolved: 1 });
  });

  it('does not call any provider for an empty batch', async () => {
    const results = await classifier.classify([]);

    expect(results.size).toBe(0);
    expect(jevClassify).not.toHaveBeenCalled();
    expect(geminiClassify).not.toHaveBeenCalled();
  });
});
