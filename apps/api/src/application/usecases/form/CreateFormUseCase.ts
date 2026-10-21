import { Form } from '@monorepo/shared/entities/Form';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class CreateFormUseCase {
  constructor(private readonly formRepository: FormRepository) { }

  async execute({
    accountId,
    title,
    description,
    descriptionAlign,
    onePage,
    tags,
  }: CreateFormUseCase.Input): Promise<CreateFormUseCase.Output> {
    const form = new Form({
      accountId,
      title,
      description,
      descriptionAlign,
      onePage,
      tags,
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
    descriptionAlign?: Form.DescriptionAlign;
    onePage: boolean;
    tags?: string[];
  };

  export type Output = {
    formId: string;
  };
}
