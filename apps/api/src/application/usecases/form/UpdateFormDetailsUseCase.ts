import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { Injectable } from '@kernel/decorators/Injectable';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';

export type UpdateFormDetailsUseCaseRequest = {
  formId: string;
  accountId: string;
  title: string;
  description?: string;
  onePage: boolean;
  tags?: string[];
  isAnonymous?: boolean;
};

@Injectable()
export class UpdateFormDetailsUseCase {
  constructor(private readonly formRepository: FormRepository) { }

  async execute({ formId, accountId, title, description, onePage, tags, isAnonymous }: UpdateFormDetailsUseCaseRequest): Promise<void> {
    const form = await this.formRepository.findById(formId);

    if (!form) {
      throw new ResourceNotFound('Form not found');
    }

    if (form.accountId !== accountId) {
      throw new NotAllowedError();
    }

    form.title = title;
    form.description = description;
    form.onePage = onePage;
    form.tags = tags;
    form.isAnonymous = isAnonymous;

    await this.formRepository.update(form);
  }
}
