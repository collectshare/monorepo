import { Controller } from '@application/contracts/Controller';
import { CreateFormUseCase } from '@application/usecases/form/CreateFormUseCase';
import { Injectable } from '@kernel/decorators/Injectable';
import { Schema } from '@kernel/decorators/Schema';
import { CreateFormBody, createFormSchema } from './schemas/createFormSchema';

@Injectable()
@Schema(createFormSchema)
export class CreateFormController extends Controller<'private', CreateFormController.Response> {
  constructor(private readonly createFormUseCase: CreateFormUseCase) {
    super();
  }

  protected override async handle({
    body,
    accountId,
  }: Controller.Request<'private', CreateFormBody>): Promise<
    Controller.Response<CreateFormController.Response>
  > {
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

export namespace CreateFormController {
  export type Response = {
    formId: string;
  };
}
