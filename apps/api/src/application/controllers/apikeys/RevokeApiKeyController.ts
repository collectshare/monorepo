import { Controller } from '@application/contracts/Controller';
import { RevokeApiKeyUseCase } from '@application/usecases/apikeys/RevokeApiKeyUseCase';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class RevokeApiKeyController extends Controller<'private', void> {
  constructor(private readonly revokeApiKeyUseCase: RevokeApiKeyUseCase) {
    super();
  }

  protected override async handle(
    { params, accountId }: Controller.Request<'private', Record<string, unknown>, { keyId: string }>,
  ): Promise<Controller.Response<void>> {
    await this.revokeApiKeyUseCase.execute({ accountId, keyId: params.keyId });

    return { statusCode: 204 };
  }
}
