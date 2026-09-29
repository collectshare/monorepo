import { choice, noul, TypeSafeClient } from '@typesafe-ai/sdk';
import { AnonymizationSuggestion } from '@monorepo/shared/types/AnonymizationSuggestion';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';

const TIMEOUT_MS = 8_000;
const PII_THRESHOLD = 0.5;

const PII_QUESTION = 'A pergunta coleta dado pessoal que deveria ser anonimizado antes da publicação dos dados';

const CATEGORY_QUESTION = 'Que tipo de dado pessoal a pergunta coleta?';

const CATEGORY_CRITERIA = {
  identificador: 'Nome, CPF, RG ou outro documento de identificação',
  contato: 'E-mail, telefone ou endereço',
  sensivel: 'Saúde, religião, orientação sexual, etnia, opinião política ou dado biométrico',
  financeiro: 'Renda, conta bancária ou cartão',
  nenhum: 'Não coleta dado pessoal',
} as const;

type Category = keyof typeof CATEGORY_CRITERIA;

const CATEGORY_REASONS: Record<Exclude<Category, 'nenhum'>, string> = {
  identificador: 'A pergunta parece coletar um identificador pessoal, como nome ou documento.',
  contato: 'A pergunta parece coletar um dado de contato, como e-mail, telefone ou endereço.',
  sensivel: 'A pergunta parece coletar um dado pessoal sensível.',
  financeiro: 'A pergunta parece coletar um dado financeiro pessoal.',
};

const GENERIC_PII_REASON = 'A pergunta parece coletar dado pessoal.';
const NO_PII_REASON = 'A pergunta não parece coletar dado pessoal.';

@Injectable()
export class JevAnonymizationProvider {
  private readonly client: TypeSafeClient;

  constructor(private readonly appConfig: AppConfig) {
    this.client = new TypeSafeClient({
      apiKey: this.appConfig.typesafe.apiKey,
      timeout: TIMEOUT_MS,
    });
  }

  async classify(
    items: JevAnonymizationProvider.Item[],
  ): Promise<Map<string, AnonymizationSuggestion | null>> {
    const results = new Map<string, AnonymizationSuggestion | null>(
      items.map((item) => [item.id, null]),
    );

    if (items.length === 0) {
      return results;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      await Promise.all(
        items.map(async (item) => {
          try {
            results.set(item.id, await this.classifyOne(item, controller.signal));
          } catch (error) {
            console.error('JevAnonymizationProvider failed to classify question', {
              questionId: item.id,
              error,
            });
          }
        }),
      );

      return results;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async classifyOne(
    item: JevAnonymizationProvider.Item,
    signal: AbortSignal,
  ): Promise<AnonymizationSuggestion | null> {
    const { answers } = await this.client.systemOne(
      {
        state: { pergunta: item.text, tipo: item.questionType },
        questions: {
          pii: noul(PII_QUESTION),
          category: choice(CATEGORY_QUESTION, CATEGORY_CRITERIA),
        },
      },
      { signal },
    );

    const probability = answers.pii.noul;

    if (typeof probability !== 'number' || !Number.isFinite(probability)) {
      return null;
    }

    const needsAnonymization = probability >= PII_THRESHOLD;

    return {
      needsAnonymization,
      confidence: Math.max(probability, 1 - probability),
      reason: JevAnonymizationProvider.buildReason(needsAnonymization, answers.category.choice),
      classifiedAt: new Date().toISOString(),
    };
  }

  private static buildReason(needsAnonymization: boolean, category: Category): string {
    if (!needsAnonymization) {
      return NO_PII_REASON;
    }

    return category === 'nenhum' ? GENERIC_PII_REASON : CATEGORY_REASONS[category] ?? GENERIC_PII_REASON;
  }
}

export namespace JevAnonymizationProvider {
  export type Item = {
    id: string;
    text: string;
    questionType: QuestionType;
  };
}
