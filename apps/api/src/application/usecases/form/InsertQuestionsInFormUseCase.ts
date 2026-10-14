import { Question } from '@monorepo/shared/entities/Question';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { QuestionRepository } from '@infra/database/dynamo/repositories/QuestionRepository';
import { QuestionClassificationCacheRepository } from '@infra/database/dynamo/repositories/QuestionClassificationCacheRepository';
import { QuestionAnonymizationClassifier } from '@infra/services/QuestionAnonymizationClassifier';
import { JevQuestionClassifier } from '@infra/services/JevQuestionClassifier';
import { PiiHeuristics } from '@infra/services/PiiHeuristics';
import { Injectable } from '@kernel/decorators/Injectable';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { GeneralizationConfig } from '@monorepo/shared/types/GeneralizationConfig';
import { AnonymizationSuggestion } from '@monorepo/shared/types/AnonymizationSuggestion';
import { hashQuestionContent } from '@shared/utils/hashQuestionContent';

type ClassificationSource = 'heuristic' | 'cache' | 'jev' | 'gemini';

// Jev verdicts below this confidence go to Gemini instead.
const JEV_MIN_CONFIDENCE = 0.6;

@Injectable()
export class InsertQuestionsInFormUseCase {
  constructor(
    private readonly formRepository: FormRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly questionClassificationCacheRepository: QuestionClassificationCacheRepository,
    private readonly questionAnonymizationClassifier: QuestionAnonymizationClassifier,
    private readonly jevQuestionClassifier: JevQuestionClassifier,
  ) { }

  async execute({
    accountId,
    formId,
    questions: questionsData,
  }: InsertQuestionsInFormUseCase.Input): Promise<void> {
    const form = await this.formRepository.findById(formId);

    if (!form) {
      throw new ResourceNotFound('Form');
    }

    if (form.accountId !== accountId) {
      throw new NotAllowedError();
    }

    const existingQuestions = await this.questionRepository.findByFormId(formId);
    const existingQuestionMap = new Map(existingQuestions.map((q) => [q.id, q]));

    const incomingQuestions = questionsData.map(
      (q) =>
        new Question({
          ...q,
          formId: form.id,
        }),
    );

    const incomingQuestionIds = new Set(incomingQuestions.map((q) => q.id));

    const questionIdsToDelete = [...existingQuestionMap.keys()].filter(
      (id) => !incomingQuestionIds.has(id),
    );

    if (questionIdsToDelete.length > 0) {
      await this.questionRepository.deleteMany(formId, questionIdsToDelete);
    }

    const questionsToSave: Question[] = [];
    const questionsToClassify: Question[] = [];

    for (const question of incomingQuestions) {
      const existingQuestion = existingQuestionMap.get(question.id);

      if (!existingQuestion) {
        questionsToSave.push(question);
        questionsToClassify.push(question);
        continue;
      }

      const contentChanged =
        existingQuestion.text !== question.text ||
        existingQuestion.questionType !== question.questionType;

      const hasChanged =
        contentChanged ||
        existingQuestion.order !== question.order ||
        (existingQuestion.max ?? null) !== (question.max ?? null) ||
        (existingQuestion.isRequired ?? false) !== (question.isRequired ?? false) ||
        (existingQuestion.piiStrategy ?? null) !== (question.piiStrategy ?? null) ||
        JSON.stringify(existingQuestion.generalizationConfig ?? null) !==
        JSON.stringify(question.generalizationConfig ?? null) ||
        JSON.stringify(existingQuestion.options?.sort((a, b) => a.localeCompare(b)) ?? []) !==
        JSON.stringify(question.options?.sort((a, b) => a.localeCompare(b)) ?? []);

      if (!hasChanged) {
        continue;
      }

      if (!contentChanged) {
        question.anonymizationSuggestion = existingQuestion.anonymizationSuggestion;
        questionsToSave.push(question);
        continue;
      }

      questionsToSave.push(question);
      questionsToClassify.push(question);
    }

    if (questionsToClassify.length > 0) {
      await this.classifyQuestions(questionsToClassify, formId);
    }

    if (questionsToSave.length > 0) {
      await this.questionRepository.saveMany(questionsToSave);
    }
  }

  private async classifyQuestions(questions: Question[], formId: string): Promise<void> {
    const sources = new Map<string, ClassificationSource>();
    const hashByQuestionId = new Map<string, string>();
    const remaining: Question[] = [];

    await Promise.all(
      questions.map(async (question) => {
        const heuristicResult = PiiHeuristics.evaluate(question.text, question.questionType);

        if (heuristicResult) {
          question.anonymizationSuggestion = heuristicResult;
          sources.set(question.id, 'heuristic');
          return;
        }

        const hash = hashQuestionContent(question.questionType, question.text);
        hashByQuestionId.set(question.id, hash);

        const cached = await this.questionClassificationCacheRepository.get(hash);

        if (cached) {
          question.anonymizationSuggestion = cached;
          sources.set(question.id, 'cache');
          return;
        }

        remaining.push(question);
      }),
    );

    if (remaining.length > 0) {
      const items = remaining.map((question) => ({
        id: question.id,
        text: question.text,
        questionType: question.questionType,
      }));

      // Jev is primary; Gemini only classifies what Jev failed on or was unsure about.
      const jevResults = await this.jevQuestionClassifier.classify(items);
      const suggestions = new Map<string, AnonymizationSuggestion | null>();

      for (const question of remaining) {
        const suggestion = toJevSuggestion(jevResults.get(question.id));

        if (suggestion) {
          suggestions.set(question.id, suggestion);
          sources.set(question.id, 'jev');
        }
      }

      const fallbackItems = items.filter((item) => !suggestions.has(item.id));

      if (fallbackItems.length > 0) {
        const geminiResults = await this.questionAnonymizationClassifier.classify(fallbackItems);

        for (const item of fallbackItems) {
          suggestions.set(item.id, geminiResults.get(item.id) ?? null);
          sources.set(item.id, 'gemini');
        }
      }

      await Promise.all(
        remaining.map(async (question) => {
          const suggestion = suggestions.get(question.id) ?? null;
          question.anonymizationSuggestion = suggestion;

          if (!suggestion) {
            return;
          }

          const hash = hashByQuestionId.get(question.id);

          if (hash) {
            await this.questionClassificationCacheRepository.put(hash, suggestion);
          }
        }),
      );
    }

    for (const question of questions) {
      console.info('InsertQuestionsInFormUseCase classified question', {
        questionId: question.id,
        formId,
        source: sources.get(question.id) ?? null,
        needsAnonymization: question.anonymizationSuggestion?.needsAnonymization ?? null,
        confidence: question.anonymizationSuggestion?.confidence ?? null,
      });
    }
  }
}

function toJevSuggestion(
  verdict: JevQuestionClassifier.Verdict | undefined,
): AnonymizationSuggestion | null {
  if (!verdict || !('needsAnonymization' in verdict)) {
    return null;
  }

  // Jev's probability is P(true); confidence is that of the chosen answer.
  const confidence = verdict.needsAnonymization ? verdict.probability : 1 - verdict.probability;

  if (confidence < JEV_MIN_CONFIDENCE) {
    return null;
  }

  return {
    needsAnonymization: verdict.needsAnonymization,
    confidence,
    reason: verdict.needsAnonymization
      ? `Classificação automática: ${Math.round(confidence * 100)}% de chance de coletar dado pessoal.`
      : `Classificação automática: ${Math.round(confidence * 100)}% de chance de não coletar dado pessoal.`,
    classifiedAt: new Date().toISOString(),
  };
}

export namespace InsertQuestionsInFormUseCase {
  export type Input = {
    accountId: string;
    formId: string;
    questions: Array<{
      id?: string;
      text: string;
      questionType: QuestionType;
      order: number;
      options?: string[];
      max?: number;
      isRequired?: boolean;
      piiStrategy?: 'pseudonymize' | 'generalize' | 'suppress' | null;
      generalizationConfig?: GeneralizationConfig;
    }>;
  };
}
