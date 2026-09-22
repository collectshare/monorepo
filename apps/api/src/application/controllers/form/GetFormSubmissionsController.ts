import { Controller } from '@application/contracts/Controller';
import { GetFormSubmissionsQuery } from '@application/queries/GetFormSubmissionsQuery';
import { Question } from '@monorepo/shared/entities/Question';
import { GetFormSubmissionsUseCase } from '@application/usecases/form/GetFormSubmissionsUseCase';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class GetFormSubmissionsController extends Controller<'private', GetFormSubmissionsController.Response> {
  constructor(private readonly getFormSubmissionsUseCase: GetFormSubmissionsUseCase) {
    super();
  }

  protected override async handle(
    { params, accountId }: Controller.Request<'private', any, { formId: string }>,
  ): Promise<Controller.Response<GetFormSubmissionsController.Response>> {
    const { submissions, questions } = await this.getFormSubmissionsUseCase.execute({
      formId: params.formId,
      accountId,
    });

    return {
      statusCode: 200,
      body: {
        submissions,
        questions,
      },
    };
  }
}

export namespace GetFormSubmissionsController {
  export type Response = {
    submissions: GetFormSubmissionsQuery.SubmissionWithAnswers[];
    questions: Question[];
  };
}
