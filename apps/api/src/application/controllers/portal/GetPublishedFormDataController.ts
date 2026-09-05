import { Controller } from '@application/contracts/Controller';
import { GetPublishedFormDataQuery } from '@application/queries/GetPublishedFormDataQuery';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { Injectable } from '@kernel/decorators/Injectable';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class GetPublishedFormDataController extends Controller<'public', GetPublishedFormDataController.Response> {
  constructor(
    private readonly formRepository: FormRepository,
    private readonly getPublishedFormDataQuery: GetPublishedFormDataQuery,
  ) {
    super();
  }

  protected override async handle(
    { params, queryParams }: Controller.Request<
      'public',
      any,
      GetPublishedFormDataController.Params,
      GetPublishedFormDataController.QueryParams
    >,
  ): Promise<Controller.Response<GetPublishedFormDataController.Response>> {
    const form = await this.formRepository.findById(params.formId);

    if (!form || !form.isPublished) {
      throw new ResourceNotFound('Dataset not found');
    }

    const limit = Math.min(Number(queryParams.limit) || DEFAULT_LIMIT, MAX_LIMIT);

    const { rows, nextCursor } = await this.getPublishedFormDataQuery.execute({
      formId: params.formId,
      limit,
      cursor: queryParams.cursor,
    });

    return {
      statusCode: 200,
      body: {
        rows,
        nextCursor,
      },
    };
  }
}

export namespace GetPublishedFormDataController {
  export type Response = {
    rows: GetPublishedFormDataQuery.Row[];
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
