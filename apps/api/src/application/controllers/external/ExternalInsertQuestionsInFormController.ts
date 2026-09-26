import { Controller } from '@application/contracts/Controller';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import { InsertQuestionsInFormUseCase } from '@application/usecases/form/InsertQuestionsInFormUseCase';
import { Injectable } from '@kernel/decorators/Injectable';
import { Schema } from '@kernel/decorators/Schema';
import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';
import {
  InsertQuestionsInFormBody,
  insertQuestionsInFormSchema,
} from '@application/controllers/form/schemas/insertQuestionsInFormSchema';

@Injectable()
@Schema(insertQuestionsInFormSchema)
export class ExternalInsertQuestionsInFormController extends Controller<'apiKey', void> {
  constructor(
    private readonly insertQuestionsInFormUseCase: InsertQuestionsInFormUseCase,
  ) { super(); }

  protected override async handle(
    { body, params, accountId, scopes }: Controller.Request<
      'apiKey',
      InsertQuestionsInFormBody,
      ExternalInsertQuestionsInFormController.Params
    >,
  ): Promise<Controller.Response<void>> {
    if (!scopes.includes(ApiKeyScope.FORMS_WRITE)) {
      throw new NotAllowedError();
    }

    await this.insertQuestionsInFormUseCase.execute({
      ...body,
      formId: params.formId,
      accountId,
    });

    return {
      statusCode: 204,
    };
  }
}

export namespace ExternalInsertQuestionsInFormController {
  export type Params = {
    formId: string;
  };
}
