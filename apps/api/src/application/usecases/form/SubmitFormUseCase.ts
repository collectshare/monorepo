import { Answer } from '@monorepo/shared/entities/Answer';
import { FormSubmission } from '@monorepo/shared/entities/FormSubmission';
import { MissingRequiredAnswersError } from '@application/errors/application/MissingRequiredAnswersError';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { QuestionRepository } from '@infra/database/dynamo/repositories/QuestionRepository';
import { SubmitFormUnitOfWork } from '@infra/database/dynamo/uow/SubmitFormUnitOfWork';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class SubmitFormUseCase {
  constructor(
    private readonly submitFormUow: SubmitFormUnitOfWork,
    private readonly formRepository: FormRepository,
    private readonly questionRepository: QuestionRepository,
  ) { }

  async execute({
    formId,
    answers: answersData,
    ip,
    userAgent,
  }: SubmitFormUseCase.Input): Promise<SubmitFormUseCase.Output> {
    const [form, questions] = await Promise.all([
      this.formRepository.findById(formId),
      this.questionRepository.findByFormId(formId),
    ]);

    if (!form) {
      throw new ResourceNotFound('Form');
    }

    const answeredQuestionIds = new Set(answersData.map(a => a.questionId));
    const missingAnswers: string[] = [];

    for (const question of questions) {
      if (question.isRequired && !answeredQuestionIds.has(question.id)) {
        missingAnswers.push(question.id);
      }
    }

    if (missingAnswers.length > 0) {
      throw new MissingRequiredAnswersError(missingAnswers);
    }

    const submission = new FormSubmission({
      formId,
      ip: form.isAnonymous ? null : ip,
      userAgent: form.isAnonymous ? null : userAgent,
    });

    const answers = answersData.map(
      a =>
        new Answer({
          ...a,
          submissionId: submission.id,
        }),
    );

    await this.submitFormUow.run({
      submission,
      answers,
    });

    return {
      submissionId: submission.id,
    };
  }
}

export namespace SubmitFormUseCase {
  export type Input = {
    formId: string;
    answers: Array<{
      questionId: string;
      value: string | string[];
    }>;
    ip: string | null;
    userAgent: string | null;
  };

  export type Output = {
    submissionId: string;
  };
}
