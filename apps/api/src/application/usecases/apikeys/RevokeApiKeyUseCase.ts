import { ResourceNotFound } from '@application/errors/application/ResourceNotFound';
import { ApiKeyRepository } from '@infra/database/dynamo/repositories/ApiKeyRepository';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class RevokeApiKeyUseCase {
  constructor(private readonly apiKeyRepository: ApiKeyRepository) {}

  async execute({ accountId, keyId }: RevokeApiKeyUseCase.Input): Promise<void> {
    const keys = await this.apiKeyRepository.findByAccountId(accountId);
    const key = keys.find(k => k.id === keyId);

    if (!key) {
      throw new ResourceNotFound('ApiKey');
    }

    await this.apiKeyRepository.revoke(accountId, keyId);
  }
}

export namespace RevokeApiKeyUseCase {
  export type Input = { accountId: string; keyId: string };
}
