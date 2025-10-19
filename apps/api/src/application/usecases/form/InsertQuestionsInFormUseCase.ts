import { Question, QuestionType } from '@monorepo/shared/entities/Question';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { QuestionRepository } from '@infra/database/dynamo/repositories/QuestionRepository';
import { Injectable } from '@kernel/decorators/Injectable';

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
    const existingQuestionIds = new Set(existingQuestions.map(q => q.id));

    const incomingQuestions = questionsData.map(
      q =>
        new Question({
          ...q,
          formId: form.id,
        }),
    );

    const incomingQuestionIds = new Set(incomingQuestions.map(q => q.id));

    const questionIdsToDelete = [...existingQuestionIds].filter(id => !incomingQuestionIds.has(id));

    if (questionIdsToDelete.length > 0) {
      await this.questionRepository.deleteMany(formId, questionIdsToDelete);
    }

    await this.questionRepository.saveMany(incomingQuestions);
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
    }>;
  };
}
