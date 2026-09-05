import { createHmac, randomBytes } from 'crypto';
import { ApiKey } from '@monorepo/shared/entities/ApiKey';
import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';
import { ApiKeyRepository } from '@infra/database/dynamo/repositories/ApiKeyRepository';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';

@Injectable()
export class CreateApiKeyUseCase {
  constructor(
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly appConfig: AppConfig,
  ) {}

  async execute({ accountId, name, scopes }: CreateApiKeyUseCase.Input): Promise<CreateApiKeyUseCase.Output> {
    const rawKey = `cs_sk_${randomBytes(32).toString('hex')}`;

    const keyHash = createHmac('sha256', this.appConfig.secrets.masterSecret)
      .update(rawKey)
      .digest('hex');

    const keyPrefix = rawKey.slice(0, 12);

    const apiKey = new ApiKey({
      accountId,
      keyPrefix,
      keyHash,
      name,
      scopes,
    });

    await this.apiKeyRepository.create(apiKey);

    return {
      apiKey,
      rawKey,
    };
  }
}

export namespace CreateApiKeyUseCase {
  export type Input = {
    accountId: string;
    name: string;
    scopes: ApiKeyScope[];
  };

  export type Output = {
    apiKey: ApiKey;
    rawKey: string;
  };
}
