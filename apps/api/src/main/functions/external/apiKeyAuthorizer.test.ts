import 'reflect-metadata';

import { createHmac } from 'crypto';
import type { APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiKey } from '@monorepo/shared/entities/ApiKey';
import { ApiKeyScope } from '@monorepo/shared/enums/ApiKeyScope';

const { MASTER_SECRET } = vi.hoisted(() => ({ MASTER_SECRET: 'test-master-secret' }));

vi.mock('@shared/config/env', () => ({
  env: {
    COGNITO_CLIENT_ID: 'test',
    COGNITO_CLIENT_SECRET: 'test',
    COGNITO_POOL_ID: 'test',
    MAIN_TABLE_NAME: 'test-table',
    MAIN_BUCKET: 'test-bucket',
    ALGOLIA_APP_ID: 'test',
    ALGOLIA_ADMIN_API_KEY: 'test',
    ALGOLIA_INDEX_NAME: 'test',
    ALGOLIA_TRENDING_INDEX_NAME: 'test',
    MASTER_SECRET,
    EXPORT_SECRET: 'test',
    GEMINI_API_KEY: 'test',
  },
}));

import { ApiKeyRepository } from '@infra/database/dynamo/repositories/ApiKeyRepository';
import { handler } from './apiKeyAuthorizer';

function hash(rawKey: string): string {
  return createHmac('sha256', MASTER_SECRET).update(rawKey).digest('hex');
}

function event(headers: Record<string, string> = {}): APIGatewayRequestAuthorizerEventV2 {
  return { headers } as APIGatewayRequestAuthorizerEventV2;
}

function fakeApiKey(overrides: Partial<ApiKey.Attributes> = {}): ApiKey {
  return new ApiKey({
    accountId: 'account-1',
    keyPrefix: 'cs_sk_abcd',
    keyHash: hash('cs_sk_valid-key'),
    name: 'Test key',
    scopes: [ApiKeyScope.PORTAL_READ],
    ...overrides,
  });
}

describe('apiKeyAuthorizer', () => {
  let findByHash: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    findByHash = vi.spyOn(ApiKeyRepository.prototype, 'findByHash');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('denies when the x-api-key header is missing', async () => {
    const result = await handler(event());

    expect(result).toEqual({ isAuthorized: false, context: { accountId: '', apiKeyId: '', scopes: '' } });
    expect(findByHash).not.toHaveBeenCalled();
  });

  it('denies when the key does not start with the cs_sk_ prefix', async () => {
    const result = await handler(event({ 'x-api-key': 'wrong-prefix' }));

    expect(result.isAuthorized).toBe(false);
    expect(findByHash).not.toHaveBeenCalled();
  });

  it('hashes the raw key with HMAC-SHA256 using the master secret before looking it up', async () => {
    findByHash.mockResolvedValue(null);

    await handler(event({ 'x-api-key': 'cs_sk_valid-key' }));

    expect(findByHash).toHaveBeenCalledWith(hash('cs_sk_valid-key'));
  });

  it('denies when no key matches the hash', async () => {
    findByHash.mockResolvedValue(null);

    const result = await handler(event({ 'x-api-key': 'cs_sk_unknown' }));

    expect(result.isAuthorized).toBe(false);
  });

  it('denies a revoked key', async () => {
    findByHash.mockResolvedValue(fakeApiKey({ revokedAt: new Date() }));

    const result = await handler(event({ 'x-api-key': 'cs_sk_valid-key' }));

    expect(result.isAuthorized).toBe(false);
  });

  it('denies an expired key', async () => {
    findByHash.mockResolvedValue(fakeApiKey({ expiresAt: new Date(Date.now() - 1000) }));

    const result = await handler(event({ 'x-api-key': 'cs_sk_valid-key' }));

    expect(result.isAuthorized).toBe(false);
  });

  it('denies a key that has no scopes', async () => {
    findByHash.mockResolvedValue(fakeApiKey({ scopes: [] }));

    const result = await handler(event({ 'x-api-key': 'cs_sk_valid-key' }));

    expect(result.isAuthorized).toBe(false);
  });

  it('authorizes a valid key and forwards its account, id and scopes', async () => {
    findByHash.mockResolvedValue(fakeApiKey({
      id: 'key-1',
      accountId: 'account-1',
      scopes: [ApiKeyScope.PORTAL_READ, ApiKeyScope.FORMS_WRITE],
    }));

    const result = await handler(event({ 'x-api-key': 'cs_sk_valid-key' }));

    expect(result).toEqual({
      isAuthorized: true,
      context: { accountId: 'account-1', apiKeyId: 'key-1', scopes: 'portal:read,forms:write' },
    });
  });

  it('accepts the header regardless of casing (X-Api-Key)', async () => {
    findByHash.mockResolvedValue(fakeApiKey());

    const result = await handler(event({ 'X-Api-Key': 'cs_sk_valid-key' }));

    expect(result.isAuthorized).toBe(true);
  });

  it('denies without throwing when the repository lookup fails', async () => {
    findByHash.mockRejectedValue(new Error('dynamo unavailable'));

    const result = await handler(event({ 'x-api-key': 'cs_sk_valid-key' }));

    expect(result.isAuthorized).toBe(false);
  });
});
