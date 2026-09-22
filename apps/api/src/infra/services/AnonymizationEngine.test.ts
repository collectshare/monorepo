import { Question } from '@monorepo/shared/entities/Question';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import type { AppConfig } from '@shared/config/AppConfig';
import { describe, expect, it } from 'vitest';
import { AnonymizationEngine } from './AnonymizationEngine';

function createEngine(exportSecret = 'test-export-secret'): AnonymizationEngine {
  const appConfig = { secrets: { exportSecret } } as unknown as AppConfig;
  return new AnonymizationEngine(appConfig);
}

function createQuestion(attrs: Partial<Question.Attributes> & Pick<Question.Attributes, 'formId'>): Question {
  return new Question({
    text: 'Qual o seu CPF?',
    questionType: QuestionType.TEXT,
    order: 0,
    ...attrs,
  });
}

describe('AnonymizationEngine', () => {
  describe('hash', () => {
    it('is deterministic for the same value and formId', () => {
      const engine = createEngine();

      expect(engine.hash('12345678900', 'form-1')).toBe(engine.hash('12345678900', 'form-1'));
    });

    it('scopes the hash per formId, so the same value never joins across forms', () => {
      const engine = createEngine();

      const hashInFormA = engine.hash('12345678900', 'form-a');
      const hashInFormB = engine.hash('12345678900', 'form-b');

      expect(hashInFormA).not.toBe(hashInFormB);
    });

    it('produces different hashes for different values within the same form', () => {
      const engine = createEngine();

      const hash1 = engine.hash('12345678900', 'form-1');
      const hash2 = engine.hash('98765432100', 'form-1');

      expect(hash1).not.toBe(hash2);
    });

    it('produces different hashes when the export secret changes', () => {
      const engineA = createEngine('secret-a');
      const engineB = createEngine('secret-b');

      expect(engineA.hash('12345678900', 'form-1')).not.toBe(engineB.hash('12345678900', 'form-1'));
    });
  });

  describe('generalize', () => {
    it('truncates dates to the year', () => {
      const engine = createEngine();

      expect(engine.generalize('1990-05-20', { type: 'date_truncate', precision: 'year' })).toBe('1990');
    });

    it('truncates dates to the year-month', () => {
      const engine = createEngine();

      expect(engine.generalize('1990-05-20', { type: 'date_truncate', precision: 'month' })).toBe('1990-05');
    });

    it('buckets numeric values into a range using the configured step', () => {
      const engine = createEngine();

      expect(engine.generalize('27', { type: 'numeric_range', step: 10 })).toBe('20-29');
    });

    it('returns the raw value when a numeric_range value is not a number', () => {
      const engine = createEngine();

      expect(engine.generalize('not-a-number', { type: 'numeric_range', step: 10 })).toBe('not-a-number');
    });

    it('keeps only the configured prefix length for text_prefix', () => {
      const engine = createEngine();

      expect(engine.generalize('São Paulo', { type: 'text_prefix', chars: 3 })).toBe('São');
    });

    it('resolves a CEP to its state region', () => {
      const engine = createEngine();

      expect(engine.generalize('01310-100', { type: 'cep_region', precision: 'state' })).toBe('SP');
    });

    it('resolves a CEP to its 3-digit regional prefix when precision is ddd', () => {
      const engine = createEngine();

      expect(engine.generalize('01310-100', { type: 'cep_region', precision: 'ddd' })).toBe('013');
    });

    it('falls back to the raw 2-digit prefix for an unknown CEP prefix', () => {
      const engine = createEngine();

      expect(engine.generalize('00000-000', { type: 'cep_region', precision: 'state' })).toBe('00');
    });
  });

  describe('resolve', () => {
    it('passes the value through untouched when there is no strategy or suggestion', () => {
      const engine = createEngine();
      const question = createQuestion({ formId: 'form-1' });

      expect(engine.resolve(question, '12345678900')).toBe('12345678900');
    });

    it('suppresses the value when piiStrategy is "suppress"', () => {
      const engine = createEngine();
      const question = createQuestion({ formId: 'form-1', piiStrategy: 'suppress' });

      expect(engine.resolve(question, '12345678900')).toBeNull();
    });

    it('suppresses every item when the value is an array', () => {
      const engine = createEngine();
      const question = createQuestion({ formId: 'form-1', piiStrategy: 'suppress' });

      expect(engine.resolve(question, ['a', 'b'])).toBeNull();
    });

    it('generalizes the value when piiStrategy is "generalize" with a config', () => {
      const engine = createEngine();
      const question = createQuestion({
        formId: 'form-1',
        piiStrategy: 'generalize',
        generalizationConfig: { type: 'date_truncate', precision: 'year' },
      });

      expect(engine.resolve(question, '1990-05-20')).toBe('1990');
    });

    it('generalizes every item when the value is an array', () => {
      const engine = createEngine();
      const question = createQuestion({
        formId: 'form-1',
        piiStrategy: 'generalize',
        generalizationConfig: { type: 'text_prefix', chars: 2 },
      });

      expect(engine.resolve(question, ['abcdef', 'ghijkl'])).toEqual(['ab', 'gh']);
    });

    it('falls back to hashing (pseudonymize) when "generalize" has no usable config', () => {
      const engine = createEngine();
      const question = createQuestion({ formId: 'form-1', piiStrategy: 'generalize' });

      const result = engine.resolve(question, '12345678900');

      expect(result).toBe(engine.hash('12345678900', 'form-1'));
      expect(result).not.toBe('12345678900');
    });

    it('hashes the value when piiStrategy is "pseudonymize", scoped to the form', () => {
      const engine = createEngine();
      const question = createQuestion({ formId: 'form-1', piiStrategy: 'pseudonymize' });

      expect(engine.resolve(question, '12345678900')).toBe(engine.hash('12345678900', 'form-1'));
    });

    it('hashes every item when pseudonymizing an array value', () => {
      const engine = createEngine();
      const question = createQuestion({ formId: 'form-1', piiStrategy: 'pseudonymize' });

      expect(engine.resolve(question, ['a', 'b'])).toEqual([
        engine.hash('a', 'form-1'),
        engine.hash('b', 'form-1'),
      ]);
    });

    it('pseudonymizes with a hash scoped to the question formId when no explicit piiStrategy is set but the classifier flagged it', () => {
      const engine = createEngine();
      const question = createQuestion({
        formId: 'form-1',
        anonymizationSuggestion: {
          needsAnonymization: true,
          confidence: 0.9,
          reason: 'Texto contém a palavra-chave "cpf"',
          classifiedAt: new Date().toISOString(),
        },
      });

      expect(engine.resolve(question, '12345678900')).toBe(engine.hash('12345678900', 'form-1'));
    });

    it('does not anonymize when the classifier suggestion says anonymization is not needed', () => {
      const engine = createEngine();
      const question = createQuestion({
        formId: 'form-1',
        anonymizationSuggestion: {
          needsAnonymization: false,
          confidence: 0.9,
          reason: 'Não é PII',
          classifiedAt: new Date().toISOString(),
        },
      });

      expect(engine.resolve(question, 'resposta qualquer')).toBe('resposta qualquer');
    });

    it('produces non-joinable pseudonyms across two forms for the same respondent value', () => {
      const engine = createEngine();
      const questionInFormA = createQuestion({ formId: 'form-a', piiStrategy: 'pseudonymize' });
      const questionInFormB = createQuestion({ formId: 'form-b', piiStrategy: 'pseudonymize' });

      const resultA = engine.resolve(questionInFormA, '12345678900');
      const resultB = engine.resolve(questionInFormB, '12345678900');

      expect(resultA).not.toBe(resultB);
    });

    it('preserves null values regardless of strategy', () => {
      const engine = createEngine();
      const question = createQuestion({ formId: 'form-1', piiStrategy: 'pseudonymize' });

      expect(engine.resolve(question, null)).toBeNull();
    });
  });
});
