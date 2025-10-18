import { Controller } from '@application/contracts/Controller';
import { UpdateFormDetailsUseCase } from '@application/usecases/form/UpdateFormDetailsUseCase';
import { Injectable } from '@kernel/decorators/Injectable';
import { Schema } from '@kernel/decorators/Schema';
import { UpdateFormBody, updateFormSchema } from './schemas/updateFormSchema';

@Injectable()
@Schema(updateFormSchema)
export class UpdateFormDetailsController extends Controller<'private', UpdateFormDetailsController.Response> {
  constructor(private readonly updateFormDetailsUseCase: UpdateFormDetailsUseCase) {
    super();
  }

  protected override async handle(
    { params, body, accountId }: Controller.Request<'private', UpdateFormBody, { formId: string }>,
  ): Promise<Controller.Response<void>> {
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

export namespace UpdateFormDetailsController {
  export type Response = void;
}
