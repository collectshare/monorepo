import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import { GetFormSubmissionsQuery } from '@application/queries/GetFormSubmissionsQuery';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class GetFormSubmissionsUseCase {
  constructor(
    private readonly formRepository: FormRepository,
    private readonly getFormSubmissionsQuery: GetFormSubmissionsQuery,
  ) {}

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

    return this.getFormSubmissionsQuery.execute(formId);
  }
}

export namespace GetFormSubmissionsUseCase {
  export type Input = {
    formId: string;
    accountId: string;
  };

  export type Output = GetFormSubmissionsQuery.Output;
}
