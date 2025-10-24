import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import { GetFormSubmissionsQuery } from '@application/queries/GetFormSubmissionsQuery';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { StorageGateway } from '@infra/gateways/StorageGateway';
import { Injectable } from '@kernel/decorators/Injectable';
import { QuestionType } from '@monorepo/shared/enums/QuestionType';

@Injectable()
export class GetFormSubmissionsUseCase {
  constructor(
    private readonly formRepository: FormRepository,
    private readonly getFormSubmissionsQuery: GetFormSubmissionsQuery,
    private readonly storageGateway: StorageGateway,
  ) { }

  async execute({
    formId,
    accountId,
  }: GetFormSubmissionsUseCase.Input): Promise<GetFormSubmissionsUseCase.Output> {
    const form = await this.formRepository.findById(formId);

    if (!form) {
      throw new ResourceNotFound('Form');
    }

    if (form.accountId !== accountId) {
      throw new NotAllowedError();
    }

    const { questions, submissions } = await this.getFormSubmissionsQuery.execute(
      formId,
    );

    const fileQuestions = questions.filter(
      (q) => q.questionType === QuestionType.FILE,
    );

    if (fileQuestions.length > 0) {
      await Promise.all(
        submissions.flatMap(({ answers }) =>
          answers
            .filter((answer) =>
              fileQuestions.some((q) => q.id === answer.questionId),
            )
            .map(async (answer) => {
              answer.value = await this.storageGateway.getSignedUrl(
                answer.value as string,
              );
            }),
        ),
      );
    }

    return { questions, submissions };
  }
}

export namespace GetFormSubmissionsUseCase {
  export type Input = {
    formId: string;
    accountId: string;
  };

  export type Output = GetFormSubmissionsQuery.Output;
}
