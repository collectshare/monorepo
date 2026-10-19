import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { AppConfig } from '@shared/config/AppConfig';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuestionAnonymizationClassifier } from './QuestionAnonymizationClassifier';

describe('QuestionAnonymizationClassifier', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends only id, type and text of each question to Gemini, never answers or options', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: '[]' }] } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const leaky = {
      id: 'q1',
      text: 'Qual seu e-mail?',
      questionType: QuestionType.TEXT,
      options: ['opção secreta'],
      answers: ['resposta secreta fulano@example.com'],
    };

    await new QuestionAnonymizationClassifier({ gemini: { apiKey: 'g-key' } } as AppConfig)
      .classify([leaky as QuestionAnonymizationClassifier.Item]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    const prompt: string = body.contents[0].parts[0].text;
    expect(body.contents).toHaveLength(1);
    expect(body.contents[0].parts).toHaveLength(1);
    expect(prompt.split('Perguntas:\n')[1]).toBe('- id: "q1", tipo: TEXT, pergunta: "Qual seu e-mail?"');
    expect(String(init.body)).not.toMatch(/secret/);
  });
});
