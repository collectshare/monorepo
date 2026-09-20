import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { AnonymizationSuggestion } from '@monorepo/shared/types/AnonymizationSuggestion';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';

const TIMEOUT_MS = 8_000;
const MODEL_NAME = 'gemini-3.6-flash';

const PROMPT_INSTRUCTION = 'Você classifica perguntas de formulário quanto a coleta de dado pessoal (PII) que deveria ser anonimizado antes da publicação dos dados. Responda apenas com base no texto e tipo de cada pergunta a seguir, sem inventar contexto adicional. Devolva um item por pergunta recebida, ecoando o campo "id" de cada uma exatamente como informado.';

@Injectable()
export class QuestionAnonymizationClassifier {
  private readonly client: GoogleGenerativeAI;

  constructor(private readonly appConfig: AppConfig) {
    this.client = new GoogleGenerativeAI(this.appConfig.gemini.apiKey);
  }

  async classify(
    items: QuestionAnonymizationClassifier.Item[],
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
      const model = this.client.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                needsAnonymization: { type: SchemaType.BOOLEAN },
                confidence: { type: SchemaType.NUMBER },
                reason: { type: SchemaType.STRING },
              },
              required: ['id', 'needsAnonymization', 'confidence', 'reason'],
            },
          },
        },
      });

      const questionsList = items
        .map((item) => `- id: "${item.id}", tipo: ${item.questionType}, pergunta: "${item.text}"`)
        .join('\n');

      const result = await model.generateContent(
        {
          contents: [{
            role: 'user',
            parts: [{ text: `${PROMPT_INSTRUCTION}\n\nPerguntas:\n${questionsList}` }],
          }],
        },
        { signal: controller.signal },
      );

      const parsed = JSON.parse(result.response.text());

      if (!Array.isArray(parsed)) {
        return results;
      }

      for (const entry of parsed) {
        if (
          !entry ||
          typeof entry.id !== 'string' ||
          typeof entry.needsAnonymization !== 'boolean' ||
          typeof entry.confidence !== 'number' ||
          typeof entry.reason !== 'string' ||
          !results.has(entry.id)
        ) {
          continue;
        }

        results.set(entry.id, {
          needsAnonymization: entry.needsAnonymization,
          confidence: entry.confidence,
          reason: entry.reason,
          classifiedAt: new Date().toISOString(),
        });
      }

      return results;
    } catch (error) {
      console.error('QuestionAnonymizationClassifier failed to classify questions', error);
      return results;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export namespace QuestionAnonymizationClassifier {
  export type Item = {
    id: string;
    text: string;
    questionType: QuestionType;
  };
}
