import 'reflect-metadata';

import { createHmac } from 'crypto';
import { APIGatewayRequestAuthorizerEventV2, APIGatewaySimpleAuthorizerWithContextResult } from 'aws-lambda';
import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';
import { ApiKeyRepository } from '@infra/database/dynamo/repositories/ApiKeyRepository';
import { Registry } from '@kernel/di/Registry';
import { AppConfig } from '@shared/config/AppConfig';

const apiKeyRepository = Registry.getInstance().resolve(ApiKeyRepository);
const appConfig = Registry.getInstance().resolve(AppConfig);

const deny: APIGatewaySimpleAuthorizerWithContextResult<{ accountId: string; apiKeyId: string }> = {
  isAuthorized: false,
  context: { accountId: '', apiKeyId: '' },
};

export const handler = async (
  event: APIGatewayRequestAuthorizerEventV2,
): Promise<APIGatewaySimpleAuthorizerWithContextResult<{ accountId: string; apiKeyId: string }>> => {
  try {
    const authHeader =
      event.headers?.['authorization'] ??
      event.headers?.['Authorization'] ??
      event.headers?.['x-api-key'] ??
      event.headers?.['X-Api-Key'];

    if (!authHeader) { return deny; }

    const rawKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!rawKey.startsWith('cs_sk_')) { return deny; }

    const keyHash = createHmac('sha256', appConfig.secrets.masterSecret)
      .update(rawKey)
      .digest('hex');

    const apiKey = await apiKeyRepository.findByHash(keyHash);

    if (!apiKey) { return deny; }
    if (apiKey.revokedAt) { return deny; }
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) { return deny; }
    if (!apiKey.scopes.includes(ApiKeyScope.PORTAL_READ)) { return deny; }

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
      },
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('ApiKeyAuthorizer error', err);
    return deny;
  }
};
