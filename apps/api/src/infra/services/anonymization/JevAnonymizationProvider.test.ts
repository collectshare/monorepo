import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { systemOne } = vi.hoisted(() => ({ systemOne: vi.fn() }));

vi.mock('@shared/config/env', () => ({ env: {} }));

vi.mock('@typesafe-ai/sdk', () => ({
  TypeSafeClient: class {
    systemOne = systemOne;
  },
  noul: (instructions: string) => ({ type: 'noul', instructions }),
  choice: (instructions: string, criteria: unknown) => ({ type: 'choice', instructions, criteria }),
}));

import { AppConfig } from '@shared/config/AppConfig';
import { JevAnonymizationProvider } from './JevAnonymizationProvider';

const appConfig = { typesafe: { apiKey: 'test-key' } } as AppConfig;

function answer(noul: number, category: string) {
  return {
    answers: {
      pii: { type: 'noul', noul },
      category: { type: 'choice', choice: category, confidence: 0.9, probabilities: {} },
    },
  };
}

const item = (id: string, text: string) => ({ id, text, questionType: QuestionType.TEXT });

describe('JevAnonymizationProvider', () => {
  beforeEach(() => {
    systemOne.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('maps a high PII probability to needsAnonymization with the category reason', async () => {
    systemOne.mockResolvedValue(answer(0.93, 'sensivel'));

    const results = await new JevAnonymizationProvider(appConfig).classify([item('q1', 'Qual a sua religião?')]);
    const suggestion = results.get('q1');

    expect(suggestion).toMatchObject({
      needsAnonymization: true,
      confidence: 0.93,
      reason: 'A pergunta parece coletar um dado pessoal sensível.',
    });
    expect(suggestion?.classifiedAt).toEqual(expect.any(String));
  });

  it('maps a low PII probability to no anonymization with confidence of the decision', async () => {
    systemOne.mockResolvedValue(answer(0.04, 'nenhum'));

    const results = await new JevAnonymizationProvider(appConfig).classify([item('q1', 'Qual sua cor favorita?')]);

    expect(results.get('q1')).toMatchObject({
      needsAnonymization: false,
      confidence: 0.96,
      reason: 'A pergunta não parece coletar dado pessoal.',
    });
  });

  it('treats exactly 0.5 as needing anonymization', async () => {
    systemOne.mockResolvedValue(answer(0.5, 'contato'));

    const results = await new JevAnonymizationProvider(appConfig).classify([item('q1', 'Como falamos com você?')]);

    expect(results.get('q1')).toMatchObject({ needsAnonymization: true, confidence: 0.5 });
  });

  it('ignores the category when the PII probability is low', async () => {
    systemOne.mockResolvedValue(answer(0.05, 'financeiro'));

    const results = await new JevAnonymizationProvider(appConfig).classify([item('q1', 'Quantos itens?')]);

    expect(results.get('q1')).toMatchObject({
      needsAnonymization: false,
      reason: 'A pergunta não parece coletar dado pessoal.',
    });
  });

  it('uses the generic PII reason when PII is detected with category "nenhum"', async () => {
    systemOne.mockResolvedValue(answer(0.8, 'nenhum'));

    const results = await new JevAnonymizationProvider(appConfig).classify([item('q1', 'Algo ambíguo')]);

    expect(results.get('q1')?.reason).toBe('A pergunta parece coletar dado pessoal.');
  });

  it('sends only the question text and type in the state, one call per question', async () => {
    systemOne.mockResolvedValue(answer(0.1, 'nenhum'));

    await new JevAnonymizationProvider(appConfig).classify([
      item('q1', 'Primeira pergunta'),
      item('q2', 'Segunda pergunta'),
    ]);

    expect(systemOne).toHaveBeenCalledTimes(2);
    const states = systemOne.mock.calls.map(([request]) => request.state);
    expect(states).toEqual([
      { pergunta: 'Primeira pergunta', tipo: QuestionType.TEXT },
      { pergunta: 'Segunda pergunta', tipo: QuestionType.TEXT },
    ]);
  });

  it('returns null only for the question whose call failed', async () => {
    systemOne
      .mockResolvedValueOnce(answer(0.9, 'contato'))
      .mockRejectedValueOnce(new Error('boom'));

    const results = await new JevAnonymizationProvider(appConfig).classify([
      item('q1', 'Qual seu e-mail?'),
      item('q2', 'Qual seu telefone?'),
    ]);

    expect(results.get('q1')).not.toBeNull();
    expect(results.get('q2')).toBeNull();
  });

  it('returns null for a malformed response', async () => {
    systemOne.mockResolvedValue({ answers: { pii: { type: 'noul' }, category: { choice: 'nenhum' } } });

    const results = await new JevAnonymizationProvider(appConfig).classify([item('q1', 'Qualquer coisa')]);

    expect(results.get('q1')).toBeNull();
  });

  it('does not log the question text on failure', async () => {
    systemOne.mockRejectedValue(new Error('boom'));

    await new JevAnonymizationProvider(appConfig).classify([item('q1', 'Qual o seu CPF secreto?')]);

    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('CPF secreto');
  });

  it('does not call the API for an empty batch', async () => {
    const results = await new JevAnonymizationProvider(appConfig).classify([]);

    expect(results.size).toBe(0);
    expect(systemOne).not.toHaveBeenCalled();
  });
});
