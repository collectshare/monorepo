import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { describe, expect, it } from 'vitest';
import { PiiHeuristics } from './PiiHeuristics';

describe('PiiHeuristics', () => {
  const piiKeywordExamples: Array<{ keyword: string; text: string }> = [
    { keyword: 'cpf', text: 'Qual o seu CPF?' },
    { keyword: 'rg', text: 'Informe o número do seu RG' },
    { keyword: 'cnpj', text: 'Qual o CNPJ da empresa?' },
    { keyword: 'endereco', text: 'Qual o seu endereço completo?' },
    { keyword: 'e-mail', text: 'Digite seu e-mail para contato' },
    { keyword: 'email', text: 'Digite seu email para contato' },
    { keyword: 'telefone', text: 'Qual o seu telefone?' },
    { keyword: 'celular', text: 'Informe seu número de celular' },
    { keyword: 'nascimento', text: 'Qual sua data de nascimento?' },
    { keyword: 'cep', text: 'Qual o CEP da sua residência?' },
    { keyword: 'identidade', text: 'Número do documento de identidade' },
    { keyword: 'passaporte', text: 'Número do passaporte' },
  ];

  it.each(piiKeywordExamples)(
    'flags "$text" as needing anonymization due to the "$keyword" keyword',
    ({ keyword, text }) => {
      const suggestion = PiiHeuristics.evaluate(text, QuestionType.TEXT);

      expect(suggestion).not.toBeNull();
      expect(suggestion?.needsAnonymization).toBe(true);
      expect(suggestion?.confidence).toBe(1);
      expect(suggestion?.reason).toContain(keyword);
    },
  );

  it('is case-insensitive and accent-insensitive when matching keywords', () => {
    const suggestion = PiiHeuristics.evaluate('Qual o seu ENDEREÇO?', QuestionType.TEXT);

    expect(suggestion?.needsAnonymization).toBe(true);
    expect(suggestion?.reason).toContain('endereco');
  });

  it('returns null when the text has no PII keyword', () => {
    const suggestion = PiiHeuristics.evaluate('Qual a sua cor favorita?', QuestionType.MULTIPLE_CHOICE);

    expect(suggestion).toBeNull();
  });

  it('is not influenced by the question type, since no type is inherently identifiable', () => {
    const textSuggestion = PiiHeuristics.evaluate('Qual seu CPF?', QuestionType.TEXT);
    const fileSuggestion = PiiHeuristics.evaluate('Qual seu CPF?', QuestionType.FILE);

    expect(textSuggestion?.needsAnonymization).toBe(true);
    expect(fileSuggestion?.needsAnonymization).toBe(true);
  });

  it('sets classifiedAt to an ISO timestamp', () => {
    const suggestion = PiiHeuristics.evaluate('Qual o seu CPF?', QuestionType.TEXT);

    expect(suggestion?.classifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
