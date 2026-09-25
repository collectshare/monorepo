import { Controller } from '@application/contracts/Controller';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import { ListFormsUseCase } from '@application/usecases/form/ListFormsUseCase';
import { Injectable } from '@kernel/decorators/Injectable';
import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';
import { Form } from '@monorepo/shared/entities/Form';

@Injectable()
export class ExternalListFormsController extends Controller<
  'apiKey',
  ExternalListFormsController.Response
> {
  constructor(private readonly listFormsUseCase: ListFormsUseCase) {
    super();
  }

  protected override async handle(
    { accountId, scopes }: Controller.Request<'apiKey'>,
  ): Promise<Controller.Response<ExternalListFormsController.Response>> {
    if (!scopes.includes(ApiKeyScope.DATA_READ)) {
      throw new NotAllowedError();
    }

    const { forms } = await this.listFormsUseCase.execute({ accountId });

    return {
      statusCode: 200,
      body: {
        forms,
      },
    };
  }
}

export namespace ExternalListFormsController {
  export type Response = {
    forms: Form[];
  };
}
