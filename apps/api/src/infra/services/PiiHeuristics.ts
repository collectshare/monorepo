import { AnonymizationSuggestion } from '@monorepo/shared/types/AnonymizationSuggestion';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { normalizeQuestionText } from '@shared/utils/hashQuestionContent';

// Matched against normalized (lowercase, accent-stripped) text.
// `questionType` is intentionally unused today: no QuestionType value
// (TEXT | MULTIPLE_CHOICE | CHECKBOX | DROPDOWN | STARS | FILE) is
// inherently PII-identifiable. Kept in the signature so a future
// identifiable type can be wired in without touching call sites.
const PII_KEYWORDS = [
  'cpf', 'rg', 'cnpj', 'endereco', 'e-mail', 'email', 'telefone', 'celular',
  'nascimento', 'cep', 'identidade', 'passaporte',
];

export const PiiHeuristics = {
  evaluate(text: string, _questionType: QuestionType): AnonymizationSuggestion | null {
    const normalizedText = normalizeQuestionText(text);
    const matchedKeyword = PII_KEYWORDS.find((keyword) => normalizedText.includes(keyword));

    if (!matchedKeyword) {
      return null;
    }

    return {
      needsAnonymization: true,
      confidence: 1,
      reason: `Texto contém a palavra-chave "${matchedKeyword}", indicando possível dado pessoal.`,
      classifiedAt: new Date().toISOString(),
    };
  },
};
