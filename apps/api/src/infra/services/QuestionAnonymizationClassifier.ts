import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { AnonymizationSuggestion } from '@monorepo/shared/types/AnonymizationSuggestion';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';

const TIMEOUT_MS = 3_000;
const MODEL_NAME = 'gemini-3.6-flash';

const PROMPT_INSTRUCTION = 'Você classifica perguntas de formulário quanto a coleta de dado pessoal (PII) que deveria ser anonimizado antes da publicação dos dados. Responda apenas com base no texto e tipo da pergunta a seguir, sem inventar contexto adicional.';

@Injectable()
export class QuestionAnonymizationClassifier {
  private readonly client: GoogleGenerativeAI;

  constructor(private readonly appConfig: AppConfig) {
    this.client = new GoogleGenerativeAI(this.appConfig.gemini.apiKey);
  }

  async classify(text: string, questionType: QuestionType): Promise<AnonymizationSuggestion | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const model = this.client.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              needsAnonymization: { type: SchemaType.BOOLEAN },
              confidence: { type: SchemaType.NUMBER },
              reason: { type: SchemaType.STRING },
            },
            required: ['needsAnonymization', 'confidence', 'reason'],
          },
        },
      });

      const result = await model.generateContent(
        {
          contents: [{
            role: 'user',
            parts: [{ text: `${PROMPT_INSTRUCTION}\n\nPergunta: "${text}"\nTipo: ${questionType}` }],
          }],
        },
        { signal: controller.signal },
      );

      const parsed = JSON.parse(result.response.text());

      if (
        typeof parsed.needsAnonymization !== 'boolean' ||
        typeof parsed.confidence !== 'number' ||
        typeof parsed.reason !== 'string'
      ) {
        return null;
      }

      return {
        needsAnonymization: parsed.needsAnonymization,
        confidence: parsed.confidence,
        reason: parsed.reason,
        classifiedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('QuestionAnonymizationClassifier failed to classify question', error);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
