import { Question } from '@monorepo/shared/entities/Question';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { QuestionRepository } from '@infra/database/dynamo/repositories/QuestionRepository';
import { Injectable } from '@kernel/decorators/Injectable';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';

@Injectable()
export class InsertQuestionsInFormUseCase {
  constructor(
    private readonly formRepository: FormRepository,
    private readonly questionRepository: QuestionRepository,
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

    for (const question of incomingQuestions) {
      const existingQuestion = existingQuestionMap.get(question.id);

      if (!existingQuestion) {
        questionsToSave.push(question);
        continue;
      }

      const hasChanged =
        existingQuestion.text !== question.text ||
        existingQuestion.questionType !== question.questionType ||
        existingQuestion.order !== question.order ||
        (existingQuestion.max ?? null) !== (question.max ?? null) ||
        (existingQuestion.isRequired ?? false) !== (question.isRequired ?? false) ||
        JSON.stringify(existingQuestion.options?.sort((a, b) => a.localeCompare(b)) ?? []) !==
        JSON.stringify(question.options?.sort((a, b) => a.localeCompare(b)) ?? []);

      if (hasChanged) {
        questionsToSave.push(question);
      }
    }

    if (questionsToSave.length > 0) {
      await this.questionRepository.saveMany(questionsToSave);
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
