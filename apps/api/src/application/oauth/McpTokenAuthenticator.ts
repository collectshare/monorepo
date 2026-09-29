import { McpGrantRepository } from '@infra/database/dynamo/repositories/McpGrantRepository';
import { McpTokenRepository } from '@infra/database/dynamo/repositories/McpTokenRepository';
import { Injectable } from '@kernel/decorators/Injectable';

import { MCP_ACCESS_TOKEN_PREFIX, McpTokenService } from './McpTokenService';

/**
 * Resolves a raw MCP access token to the account it acts for. Consumed by the `/mcp`
 * Lambda; anything that is not a live `cs_mat_` token of a non-revoked grant yields `null`.
 */
@Injectable()
export class McpTokenAuthenticator {
  constructor(
    private readonly mcpTokenService: McpTokenService,
    private readonly mcpTokenRepository: McpTokenRepository,
    private readonly mcpGrantRepository: McpGrantRepository,
  ) {}

  async authenticate(rawToken: string | null | undefined): Promise<McpTokenAuthenticator.Identity | null> {
    if (!rawToken || !rawToken.startsWith(MCP_ACCESS_TOKEN_PREFIX)) {
      return null;
    }

    const token = await this.mcpTokenRepository.findByHash(this.mcpTokenService.hashToken(rawToken));

    if (!token || token.kind !== 'access' || token.expiresAt * 1000 <= Date.now()) {
      return null;
    }

    const grant = await this.mcpGrantRepository.findById(token.accountId, token.grantId);

    if (!grant || grant.revokedAt) {
      return null;
    }

    return {
      accountId: token.accountId,
      grantId: token.grantId,
    };
  }
}

export namespace McpTokenAuthenticator {
  export type Identity = {
    accountId: string;
    grantId: string;
  };
}
