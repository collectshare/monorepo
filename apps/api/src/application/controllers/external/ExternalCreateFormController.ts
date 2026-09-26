import { Controller } from '@application/contracts/Controller';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import { CreateFormUseCase } from '@application/usecases/form/CreateFormUseCase';
import { Injectable } from '@kernel/decorators/Injectable';
import { Schema } from '@kernel/decorators/Schema';
import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';
import { CreateFormBody, createFormSchema } from '@application/controllers/form/schemas/createFormSchema';

@Injectable()
@Schema(createFormSchema)
export class ExternalCreateFormController extends Controller<
  'apiKey',
  ExternalCreateFormController.Response
> {
  constructor(private readonly createFormUseCase: CreateFormUseCase) {
    super();
  }

  protected override async handle(
    { body, accountId, scopes }: Controller.Request<'apiKey', CreateFormBody>,
  ): Promise<Controller.Response<ExternalCreateFormController.Response>> {
    if (!scopes.includes(ApiKeyScope.FORMS_WRITE)) {
      throw new NotAllowedError();
    }

    const { formId } = await this.createFormUseCase.execute({
      ...body,
      accountId,
    });

    return {
      statusCode: 201,
      body: {
        formId,
      },
    };
  }
}

export namespace ExternalCreateFormController {
  export type Response = {
    formId: string;
  };
}
