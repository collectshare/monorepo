import { Form } from '@application/entities/Form';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class CreateFormUseCase {
  constructor(private readonly formRepository: FormRepository) { }

  async execute({
    accountId,
    title,
    description,
    onePage,
    tags,
    isAnonymous,
  }: CreateFormUseCase.Input): Promise<CreateFormUseCase.Output> {
    const form = new Form({
      accountId,
      title,
      description,
      onePage,
      tags,
      isAnonymous,
    });

    await this.formRepository.create(form);

    return {
      formId: form.id,
    };
  }
}

export namespace CreateFormUseCase {
  export type Input = {
    accountId: string;
    title: string;
    description?: string;
    onePage: boolean;
    tags?: string[];
    isAnonymous?: boolean;
  };

  export type Output = {
    formId: string;
  };
}
