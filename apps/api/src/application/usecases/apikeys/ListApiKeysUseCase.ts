import { ApiKey } from '@monorepo/shared/entities/ApiKey';
import { ApiKeyRepository } from '@infra/database/dynamo/repositories/ApiKeyRepository';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class ListApiKeysUseCase {
  constructor(private readonly apiKeyRepository: ApiKeyRepository) {}

  async execute({ accountId }: ListApiKeysUseCase.Input): Promise<ListApiKeysUseCase.Output> {
    const apiKeys = await this.apiKeyRepository.findByAccountId(accountId);
    return { apiKeys: apiKeys.filter(k => !k.revokedAt) };
  }
}

export namespace ListApiKeysUseCase {
  export type Input = { accountId: string };
  export type Output = { apiKeys: ApiKey[] };
}
