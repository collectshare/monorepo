import { Controller } from '@application/contracts/Controller';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import { GetFormSubmissionsUseCase } from '@application/usecases/form/GetFormSubmissionsUseCase';
import { Injectable } from '@kernel/decorators/Injectable';
import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';
import { Question } from '@monorepo/shared/entities/Question';
import { GetFormSubmissionsQuery } from '@application/queries/GetFormSubmissionsQuery';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 1000;

@Injectable()
export class ExternalGetOwnFormDataController extends Controller<
  'apiKey',
  ExternalGetOwnFormDataController.Response
> {
  constructor(private readonly getFormSubmissionsUseCase: GetFormSubmissionsUseCase) {
    super();
  }

  protected override async handle(
    { params, queryParams, accountId, scopes }: Controller.Request<
      'apiKey',
      any,
      ExternalGetOwnFormDataController.Params,
      ExternalGetOwnFormDataController.QueryParams
    >,
  ): Promise<Controller.Response<ExternalGetOwnFormDataController.Response>> {
    if (!scopes.includes(ApiKeyScope.FORMS_READ)) {
      throw new NotAllowedError();
    }

    const limit = Math.min(Number(queryParams.limit) || DEFAULT_LIMIT, MAX_LIMIT);

    const { submissions, questions, nextCursor } = await this.getFormSubmissionsUseCase.execute({
      formId: params.formId,
      accountId,
      limit,
      cursor: queryParams.cursor,
    });

    return {
      statusCode: 200,
      body: {
        submissions,
        questions,
        nextCursor,
      },
    };
  }
}

export namespace ExternalGetOwnFormDataController {
  export type Response = {
    submissions: GetFormSubmissionsQuery.SubmissionWithAnswers[];
    questions: Question[];
    nextCursor?: string;
  };

  export type Params = {
    formId: string;
  };

  export type QueryParams = {
    cursor?: string;
    limit?: string;
  };
}
