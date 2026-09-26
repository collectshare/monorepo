import { Controller } from '@application/contracts/Controller';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import { UpdateFormDetailsUseCase } from '@application/usecases/form/UpdateFormDetailsUseCase';
import { Injectable } from '@kernel/decorators/Injectable';
import { Schema } from '@kernel/decorators/Schema';
import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';
import { UpdateFormBody, updateFormSchema } from '@application/controllers/form/schemas/updateFormSchema';

@Injectable()
@Schema(updateFormSchema)
export class ExternalUpdateFormController extends Controller<'apiKey', void> {
  constructor(private readonly updateFormDetailsUseCase: UpdateFormDetailsUseCase) {
    super();
  }

  protected override async handle(
    { params, body, accountId, scopes }: Controller.Request<
      'apiKey',
      UpdateFormBody,
      ExternalUpdateFormController.Params
    >,
  ): Promise<Controller.Response<void>> {
    if (!scopes.includes(ApiKeyScope.FORMS_WRITE)) {
      throw new NotAllowedError();
    }

    await this.updateFormDetailsUseCase.execute({
      formId: params.formId,
      accountId,
      ...body,
    });

    return {
      statusCode: 204,
    };
  }
}

export namespace ExternalUpdateFormController {
  export type Params = {
    formId: string;
  };
}
