import { Controller } from '@application/contracts/Controller';
import { NotAllowedError } from '@application/errors/application/NotAllowedError';
import { AlgoliaGateway } from '@infra/gateways/AlgoliaGateway';
import { Injectable } from '@kernel/decorators/Injectable';
import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';

@Injectable()
export class ExternalSearchDatasetsController extends Controller<
  'apiKey',
  ExternalSearchDatasetsController.Response
> {
  constructor(private readonly algoliaGateway: AlgoliaGateway) {
    super();
  }

  protected override async handle(
    { queryParams, scopes }: Controller.Request<
      'apiKey',
      any,
      Record<string, never>,
      ExternalSearchDatasetsController.QueryParams
    >,
  ): Promise<Controller.Response<ExternalSearchDatasetsController.Response>> {
    if (!scopes.includes(ApiKeyScope.PORTAL_READ)) {
      throw new NotAllowedError();
    }

    const results = await this.algoliaGateway.search(queryParams.q ?? '', queryParams.sort);

    return {
      statusCode: 200,
      body: {
        results,
      },
    };
  }
}

export namespace ExternalSearchDatasetsController {
  export type Response = {
    results: AlgoliaGateway.DatasetRecord[];
  };

  export type QueryParams = {
    q?: string;
    sort?: AlgoliaGateway.Sort;
  };
}
