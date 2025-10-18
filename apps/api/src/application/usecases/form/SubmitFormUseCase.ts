import { Answer } from '@application/entities/Answer';
import { FormSubmission } from '@application/entities/FormSubmission';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { SubmitFormUnitOfWork } from '@infra/database/dynamo/uow/SubmitFormUnitOfWork';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class SubmitFormUseCase {
  constructor(
    private readonly submitFormUow: SubmitFormUnitOfWork,
    private readonly formRepository: FormRepository,
  ) {}

  async execute({
    formId,
    answers: answersData,
    ip,
    userAgent,
  }: SubmitFormUseCase.Input): Promise<SubmitFormUseCase.Output> {
    const form = await this.formRepository.findById(formId);

    if (!form) {
      throw new ResourceNotFound();
    }

    const submission = new FormSubmission({
      formId,
      ip: form.isAnonymous ? null : ip,
      userAgent: form.isAnonymous ? null : userAgent,
    });

    const answers = answersData.map(a => new Answer({
      ...a,
      submissionId: submission.id,
    }));

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
