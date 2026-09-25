import { Controller } from '@application/contracts/Controller';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import { GetPublishedFormDataQuery } from '@application/queries/GetPublishedFormDataQuery';
import { FormRepository } from '@infra/database/dynamo/repositories/FormRepository';
import { Injectable } from '@kernel/decorators/Injectable';
import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 1000;

@Injectable()
export class ExternalGetPublishedFormDataController extends Controller<
  'apiKey',
  ExternalGetPublishedFormDataController.Response
> {
  constructor(
    private readonly formRepository: FormRepository,
    private readonly getPublishedFormDataQuery: GetPublishedFormDataQuery,
  ) {
    super();
  }

  protected override async handle(
    { params, queryParams, scopes }: Controller.Request<
      'apiKey',
      any,
      ExternalGetPublishedFormDataController.Params,
      ExternalGetPublishedFormDataController.QueryParams
    >,
  ): Promise<Controller.Response<ExternalGetPublishedFormDataController.Response>> {
    if (!scopes.includes(ApiKeyScope.PORTAL_READ)) {
      throw new NotAllowedError();
    }

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

export namespace ExternalGetPublishedFormDataController {
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
