import { Controller } from '@application/contracts/Controller';
import { AlgoliaGateway } from '@infra/gateways/AlgoliaGateway';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class SearchDatasetsController extends Controller<'public', SearchDatasetsController.Response> {
  constructor(private readonly algoliaGateway: AlgoliaGateway) {
    super();
  }

  protected override async handle(
    { queryParams }: Controller.Request<'public', any, Record<string, never>, SearchDatasetsController.QueryParams>,
  ): Promise<Controller.Response<SearchDatasetsController.Response>> {
    const results = await this.algoliaGateway.search(queryParams.q ?? '');

    return {
      statusCode: 200,
      body: {
        results,
      },
    };
  }
}

export namespace SearchDatasetsController {
  export type Response = {
    results: AlgoliaGateway.DatasetRecord[];
  };

  export type QueryParams = {
    q?: string;
  };
}
