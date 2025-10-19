import { Controller } from '@application/contracts/Controller';
import { Form } from '@monorepo/shared/entities/Form';
import { Question } from '@monorepo/shared/entities/Question';
import { GetFormUseCase } from '@application/usecases/form/GetFormUseCase';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class GetFormController extends Controller<'public', GetFormController.Response> {
  constructor(private readonly getFormUseCase: GetFormUseCase) {
    super();
  }

  protected override async handle(
    { params }: Controller.Request<'public', any, GetFormController.Params>,
  ): Promise<Controller.Response<GetFormController.Response>> {
    const { form, questions } = await this.getFormUseCase.execute({
      formId: params.formId,
    });

    return {
      statusCode: 200,
      body: {
        form,
        questions,
      },
    };
  }
}

export namespace GetFormController {
  export type Response = {
    form: Form;
    questions: Question[];
  };

  export type Params = {
    formId: string;
  };
}
