import { Question } from '@monorepo/shared/entities/Question';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { QuestionRepository } from '@infra/database/dynamo/repositories/QuestionRepository';
import { QuestionClassificationCacheRepository } from '@infra/database/dynamo/repositories/QuestionClassificationCacheRepository';
import { QuestionAnonymizationClassifier } from '@infra/services/QuestionAnonymizationClassifier';
import { PiiHeuristics } from '@infra/services/PiiHeuristics';
import { Injectable } from '@kernel/decorators/Injectable';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';
import { hashQuestionContent } from '@shared/utils/hashQuestionContent';

type ClassificationSource = 'heuristic' | 'cache' | 'llm';

@Injectable()
export class InsertQuestionsInFormUseCase {
  constructor(
    private readonly formRepository: FormRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly questionClassificationCacheRepository: QuestionClassificationCacheRepository,
    private readonly questionAnonymizationClassifier: QuestionAnonymizationClassifier,
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
      const results = await this.questionAnonymizationClassifier.classify(
        remaining.map((question) => ({
          id: question.id,
          text: question.text,
          questionType: question.questionType,
        })),
      );

      await Promise.all(
        remaining.map(async (question) => {
          const suggestion = results.get(question.id) ?? null;
          question.anonymizationSuggestion = suggestion;
          sources.set(question.id, 'llm');

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
      });
    }
  }
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
    }>;
  };
}
