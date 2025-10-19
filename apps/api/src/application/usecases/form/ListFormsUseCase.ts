import { Form } from '@monorepo/shared/entities/Form';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class ListFormsUseCase {
  constructor(
    private readonly formRepository: FormRepository,
  ) { }

  async execute({ accountId }: ListFormsUseCase.Input): Promise<ListFormsUseCase.Output> {
    const forms = await this.formRepository.findByAccountId(accountId);

    return {
      forms,
    };
  }
}

export namespace ListFormsUseCase {
  export type Input = {
    accountId: string;
  };

  export type Output = {
    forms: Form[];
  };
}
