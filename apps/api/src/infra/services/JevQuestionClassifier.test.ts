import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { AppConfig } from '@shared/config/AppConfig';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { JevQuestionClassifier } from './JevQuestionClassifier';

const makeClassifier = (apiKey: string) =>
  new JevQuestionClassifier({ typesafe: { apiKey } } as AppConfig);

const items: JevQuestionClassifier.Item[] = [
  { id: 'q1', text: 'Qual o nome da sua mãe?', questionType: QuestionType.TEXT },
  { id: 'q2', text: 'Você gostou do evento?', questionType: QuestionType.TEXT },
];

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('JevQuestionClassifier', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('makes no calls and is disabled when the API key is empty', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const classifier = makeClassifier('');
    const results = await classifier.classify(items);

    expect(classifier.enabled).toBe(false);
    expect(results.size).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls decide once per question and maps value, probability and usage', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      const p = body.state.pergunta.includes('nome') ? 0.91 : 0.12;

      return jsonResponse({
        model: 'jev-1.13.0',
        answers: { pii: { type: 'noul', noul: p } },
        usage: { input_tokens: 90, output_tokens: 1 },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const results = await makeClassifier('ts-key').classify(items);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(results.get('q1')).toMatchObject({
      needsAnonymization: true,
      probability: 0.91,
      usage: { promptTokens: 90, completionTokens: 1, totalTokens: 91 },
    });
    expect(results.get('q2')).toMatchObject({ needsAnonymization: false, probability: 0.12 });
  });

  it('records an error per question instead of throwing on HTTP failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ detail: 'nope' }, 401)));

    const results = await makeClassifier('ts-key').classify(items);

    expect(results.get('q1')).toMatchObject({ error: expect.stringContaining('401') });
    expect(results.get('q2')).toMatchObject({ error: expect.stringContaining('401') });
  });

  it('aborts after the timeout and records the error', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      ),
    );

    const pending = makeClassifier('ts-key').classify(items.slice(0, 1));
    await vi.advanceTimersByTimeAsync(8_000);
    const results = await pending;
    vi.useRealTimers();

    expect(results.get('q1')).toMatchObject({ error: expect.any(String) });
  });
});
