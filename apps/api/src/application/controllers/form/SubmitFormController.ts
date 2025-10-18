import { Controller } from '@application/contracts/Controller';
import { SubmitFormUseCase } from '@application/usecases/form/SubmitFormUseCase';
import { Injectable } from '@kernel/decorators/Injectable';
import { Schema } from '@kernel/decorators/Schema';
import { SubmitFormBody, submitFormSchema } from './schemas/submitFormSchema';

@Injectable()
@Schema(submitFormSchema)
export class SubmitFormController extends Controller<'public', SubmitFormController.Response> {
  constructor(private readonly submitFormUseCase: SubmitFormUseCase) {
    super();
  }

  protected override async handle(
    { params, body, ip, userAgent }: Controller.Request<'public', SubmitFormBody, { formId: string }>,
  ): Promise<Controller.Response<SubmitFormController.Response>> {
    const { submissionId } = await this.submitFormUseCase.execute({
      formId: params.formId,
      answers: body.answers,
      ip,
      userAgent,
    });

    return {
      statusCode: 201,
      body: {
        submissionId,
      },
    };
  }
}

export namespace SubmitFormController {
  export type Response = {
    submissionId: string;
  };
}
