import { Controller } from '@application/contracts/Controller';
import { ListApiKeysUseCase } from '@application/usecases/apikeys/ListApiKeysUseCase';
import { Injectable } from '@kernel/decorators/Injectable';
import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';

@Injectable()
export class ListApiKeysController extends Controller<'private', ListApiKeysController.Response> {
  constructor(private readonly listApiKeysUseCase: ListApiKeysUseCase) {
    super();
  }

  protected override async handle(
    { accountId }: Controller.Request<'private'>,
  ): Promise<Controller.Response<ListApiKeysController.Response>> {
    const { apiKeys } = await this.listApiKeysUseCase.execute({ accountId });

    return {
      statusCode: 200,
      body: {
        apiKeys: apiKeys.map(k => ({
          id: k.id,
          name: k.name,
          keyPrefix: k.keyPrefix,
          scopes: k.scopes,
          createdAt: k.createdAt.toISOString(),
        })),
      },
    };
  }
}

export namespace ListApiKeysController {
  export type Response = {
    apiKeys: Array<{
      id: string;
      name: string;
      keyPrefix: string;
      scopes: ApiKeyScope[];
      createdAt: string;
    }>;
  };
}
