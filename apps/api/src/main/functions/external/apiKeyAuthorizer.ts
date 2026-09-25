import 'reflect-metadata';

import { createHmac } from 'crypto';
import { APIGatewayRequestAuthorizerEventV2, APIGatewaySimpleAuthorizerWithContextResult } from 'aws-lambda';
import { ApiKeyRepository } from '@infra/database/dynamo/repositories/ApiKeyRepository';
import { Registry } from '@kernel/di/Registry';
import { AppConfig } from '@shared/config/AppConfig';

export type ApiKeyAuthorizerContext = { accountId: string; apiKeyId: string; scopes: string };

const apiKeyRepository = Registry.getInstance().resolve(ApiKeyRepository);
const appConfig = Registry.getInstance().resolve(AppConfig);

const deny: APIGatewaySimpleAuthorizerWithContextResult<ApiKeyAuthorizerContext> = {
  isAuthorized: false,
  context: { accountId: '', apiKeyId: '', scopes: '' },
};

export const handler = async (
  event: APIGatewayRequestAuthorizerEventV2,
): Promise<APIGatewaySimpleAuthorizerWithContextResult<ApiKeyAuthorizerContext>> => {
  try {
    const rawKey = event.headers?.['x-api-key'] ?? event.headers?.['X-Api-Key'];

    if (!rawKey) { return deny; }
    if (!rawKey.startsWith('cs_sk_')) { return deny; }

    const keyHash = createHmac('sha256', appConfig.secrets.masterSecret)
      .update(rawKey)
      .digest('hex');

    const apiKey = await apiKeyRepository.findByHash(keyHash);

    if (!apiKey) { return deny; }
    if (apiKey.revokedAt) { return deny; }
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) { return deny; }
    if (apiKey.scopes.length === 0) { return deny; }

    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      event: 'api_key_auth',
      apiKeyId: apiKey.id,
      accountId: apiKey.accountId,
      timestamp: new Date().toISOString(),
    }));

    return {
      isAuthorized: true,
      context: {
        accountId: apiKey.accountId,
        apiKeyId: apiKey.id,
        scopes: apiKey.scopes.join(','),
      },
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('ApiKeyAuthorizer error', err);
    return deny;
  }
};
