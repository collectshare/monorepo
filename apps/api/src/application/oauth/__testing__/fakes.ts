import type { AccountRepository } from '@infra/database/dynamo/repositories/AccountRepository';
import type { McpGrantRepository } from '@infra/database/dynamo/repositories/McpGrantRepository';
import type { McpTokenRepository } from '@infra/database/dynamo/repositories/McpTokenRepository';
import type { OAuthCodeRepository } from '@infra/database/dynamo/repositories/OAuthCodeRepository';
import type { McpGrantItem } from '@infra/database/dynamo/items/McpGrantItem';
import type { McpTokenItem } from '@infra/database/dynamo/items/McpTokenItem';
import type { OAuthCodeItem } from '@infra/database/dynamo/items/OAuthCodeItem';
import type { AppConfig } from '@shared/config/AppConfig';

import { AuthorizationRequestValidator } from '../AuthorizationRequestValidator';
import { McpTokenAuthenticator } from '../McpTokenAuthenticator';
import { McpTokenIssuer } from '../McpTokenIssuer';
import { McpTokenService } from '../McpTokenService';
import { OAuthClientService } from '../OAuthClientService';

export const ISSUER = 'https://api.test';

export function createFakeAppConfig(): AppConfig {
  return {
    secrets: { masterSecret: 'test-master-secret' },
    oauth: { issuer: ISSUER, webAppUrl: 'https://app.test', extraRedirectUris: [] },
  } as unknown as AppConfig;
}

/** In-memory stand-ins for the DynamoDB repositories, honoring the same contracts. */
export function createFakeRepositories() {
  const codes = new Map<string, OAuthCodeItem.Attributes>();
  const grants = new Map<string, McpGrantItem.Attributes>();
  const tokens = new Map<string, McpTokenItem.Attributes>();
  const accounts = new Set<string>(['account-1']);

  const oauthCodeRepository = {
    create: async (attrs: OAuthCodeItem.Attributes) => { codes.set(attrs.codeHash, attrs); },
    consume: async (codeHash: string) => {
      const found = codes.get(codeHash) ?? null;
      codes.delete(codeHash);
      return found;
    },
  } as unknown as OAuthCodeRepository;

  const mcpGrantRepository = {
    create: async (attrs: McpGrantItem.Attributes) => { grants.set(attrs.id, attrs); },
    findById: async (_accountId: string, grantId: string) => grants.get(grantId) ?? null,
    revoke: async (_accountId: string, grantId: string) => {
      const grant = grants.get(grantId);
      if (grant && !grant.revokedAt) { grants.set(grantId, { ...grant, revokedAt: new Date().toISOString() }); }
    },
  } as unknown as McpGrantRepository;

  const mcpTokenRepository = {
    create: async (attrs: McpTokenItem.Attributes) => { tokens.set(attrs.id, attrs); },
    findByHash: async (tokenHash: string) => (
      [...tokens.values()].find(token => token.tokenHash === tokenHash) ?? null
    ),
    markUsed: async (_accountId: string, tokenId: string) => {
      const token = tokens.get(tokenId);
      if (!token || token.usedAt) { return false; }
      tokens.set(tokenId, { ...token, usedAt: new Date().toISOString() });
      return true;
    },
  } as unknown as McpTokenRepository;

  const accountRepository = {
    findById: async (id: string) => (accounts.has(id) ? { id } : null),
  } as unknown as AccountRepository;

  return {
    codes,
    grants,
    tokens,
    accounts,
    oauthCodeRepository,
    mcpGrantRepository,
    mcpTokenRepository,
    accountRepository,
  };
}

export function createOAuthServices() {
  const appConfig = createFakeAppConfig();
  const repositories = createFakeRepositories();

  const mcpTokenService = new McpTokenService(appConfig);
  const oauthClientService = new OAuthClientService(appConfig);
  const authorizationRequestValidator = new AuthorizationRequestValidator(oauthClientService, appConfig);
  const mcpTokenIssuer = new McpTokenIssuer(mcpTokenService, repositories.mcpTokenRepository);
  const mcpTokenAuthenticator = new McpTokenAuthenticator(
    mcpTokenService,
    repositories.mcpTokenRepository,
    repositories.mcpGrantRepository,
  );

  return {
    appConfig,
    ...repositories,
    mcpTokenService,
    oauthClientService,
    authorizationRequestValidator,
    mcpTokenIssuer,
    mcpTokenAuthenticator,
  };
}
