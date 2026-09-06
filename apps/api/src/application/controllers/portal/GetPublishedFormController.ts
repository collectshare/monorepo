import { Controller } from '@application/contracts/Controller';
import { Form } from '@monorepo/shared/entities/Form';
import { Question } from '@monorepo/shared/entities/Question';
import { GetPublishedFormQuery } from '@application/queries/GetPublishedFormQuery';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class GetPublishedFormController extends Controller<'public', GetPublishedFormController.Response> {
  constructor(private readonly getPublishedFormQuery: GetPublishedFormQuery) {
    super();
  }

  protected override async handle(
    { params }: Controller.Request<'public', any, GetPublishedFormController.Params>,
  ): Promise<Controller.Response<GetPublishedFormController.Response>> {
    const { form, questions } = await this.getPublishedFormQuery.execute(params.formId);

    return {
      statusCode: 200,
      body: {
        form,
        questions: questions.map(({ anonymizationSuggestion: _anonymizationSuggestion, ...question }) => question),
      },
    };
  }
}

export namespace GetPublishedFormController {
  export type Response = {
    form: Form;
    questions: Question[];
  };

  export type Params = {
    formId: string;
  };
}
