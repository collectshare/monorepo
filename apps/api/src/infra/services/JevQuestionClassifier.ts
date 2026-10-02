import { boolean, decide, type TokenUsage } from '@tanstack/ai';
import { createTypesafeDecider } from '@tanstack/ai-typesafe';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';

const TIMEOUT_MS = 8_000;
const MODEL_NAME = 'jev-latest';

const PII_QUESTION = boolean({
  instructions: 'Esta pergunta de formulário coleta dado pessoal (PII) que deveria ser anonimizado antes da publicação dos dados? Responda apenas com base no texto e tipo da pergunta, sem inventar contexto adicional.',
  criteria: {
    true: 'A resposta identifica ou pode identificar a pessoa: nome, CPF, RG, e-mail, telefone, endereço, data de nascimento, saúde, religião, etnia, orientação sexual, biometria etc.',
    false: 'A resposta é opinião, preferência, avaliação ou outro dado que não identifica a pessoa.',
  },
});

/**
 * Shadow classifier (audit only): its result is logged next to Gemini's and never persisted.
 * Disabled (no calls) when TYPESAFE_API_KEY is empty.
 */
@Injectable()
export class JevQuestionClassifier {
  private readonly adapter: ReturnType<typeof createTypesafeDecider<typeof MODEL_NAME>> | null;

  constructor(appConfig: AppConfig) {
    const { apiKey } = appConfig.typesafe;
    this.adapter = apiKey ? createTypesafeDecider(MODEL_NAME, apiKey) : null;
  }

  get enabled(): boolean {
    return this.adapter !== null;
  }

  async classify(
    items: JevQuestionClassifier.Item[],
  ): Promise<Map<string, JevQuestionClassifier.Verdict>> {
    const results = new Map<string, JevQuestionClassifier.Verdict>();
    const adapter = this.adapter;

    if (!adapter || items.length === 0) {
      return results;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      await Promise.all(
        items.map(async (item) => {
          const startedAt = Date.now();

          try {
            const result = await decide({
              adapter,
              state: { pergunta: item.text, tipo: item.questionType },
              questions: { pii: PII_QUESTION },
              abortSignal: controller.signal,
              debug: false,
            });

            results.set(item.id, {
              needsAnonymization: result.pii.value,
              probability: result.pii.probability,
              ms: Date.now() - startedAt,
              usage: result.meta.usage,
            });
          } catch (error) {
            results.set(item.id, {
              error: error instanceof Error ? error.message : String(error),
              ms: Date.now() - startedAt,
            });
          }
        }),
      );

      return results;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export namespace JevQuestionClassifier {
  export type Item = {
    id: string;
    text: string;
    questionType: QuestionType;
  };

  export type Verdict =
    | {
      needsAnonymization: boolean;
      probability: number;
      ms: number;
      usage: TokenUsage;
    }
    | { error: string; ms: number };
}
