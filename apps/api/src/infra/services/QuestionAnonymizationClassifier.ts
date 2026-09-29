import { AnonymizationSuggestion } from '@monorepo/shared/types/AnonymizationSuggestion';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { Injectable } from '@kernel/decorators/Injectable';
import { GeminiAnonymizationProvider } from './anonymization/GeminiAnonymizationProvider';
import { JevAnonymizationProvider } from './anonymization/JevAnonymizationProvider';

@Injectable()
export class QuestionAnonymizationClassifier {
  constructor(
    private readonly jevProvider: JevAnonymizationProvider,
    private readonly geminiProvider: GeminiAnonymizationProvider,
  ) {}

  async classify(
    items: QuestionAnonymizationClassifier.Item[],
  ): Promise<Map<string, AnonymizationSuggestion | null>> {
    const results = new Map<string, AnonymizationSuggestion | null>(
      items.map((item) => [item.id, null]),
    );

    if (items.length === 0) {
      return results;
    }

    const jevResults = await this.jevProvider.classify(items);
    let resolvedByJev = 0;

    for (const [id, suggestion] of jevResults) {
      if (suggestion) {
        results.set(id, suggestion);
        resolvedByJev += 1;
      }
    }

    const pending = items.filter((item) => !results.get(item.id));
    let resolvedByGemini = 0;

    if (pending.length > 0) {
      const geminiResults = await this.geminiProvider.classify(pending);

      for (const [id, suggestion] of geminiResults) {
        if (suggestion) {
          results.set(id, suggestion);
          resolvedByGemini += 1;
        }
      }
    }

    console.info('QuestionAnonymizationClassifier classified batch', {
      total: items.length,
      jev: resolvedByJev,
      gemini: resolvedByGemini,
      unresolved: items.length - resolvedByJev - resolvedByGemini,
    });

    return results;
  }
}

export namespace QuestionAnonymizationClassifier {
  export type Item = {
    id: string;
    text: string;
    questionType: QuestionType;
  };
}
