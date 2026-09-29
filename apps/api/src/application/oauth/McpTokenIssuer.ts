import { randomUUID } from 'node:crypto';

import { McpTokenRepository } from '@infra/database/dynamo/repositories/McpTokenRepository';
import { Injectable } from '@kernel/decorators/Injectable';

import {
  MCP_ACCESS_TOKEN_TTL_SECONDS,
  MCP_REFRESH_TOKEN_TTL_SECONDS,
  McpTokenService,
} from './McpTokenService';

/** Mints an access + refresh token pair for a grant and persists their hashes. */
@Injectable()
export class McpTokenIssuer {
  constructor(
    private readonly mcpTokenService: McpTokenService,
    private readonly mcpTokenRepository: McpTokenRepository,
  ) {}

  async issue({ accountId, grantId }: McpTokenIssuer.Input): Promise<McpTokenIssuer.Output> {
    const accessToken = this.mcpTokenService.generateAccessToken();
    const refreshToken = this.mcpTokenService.generateRefreshToken();

    const now = Date.now();
    const createdAt = new Date(now).toISOString();
    const nowInSeconds = Math.floor(now / 1000);

    await Promise.all([
      this.mcpTokenRepository.create({
        id: randomUUID(),
        accountId,
        grantId,
        kind: 'access',
        tokenHash: this.mcpTokenService.hashToken(accessToken),
        createdAt,
        expiresAt: nowInSeconds + MCP_ACCESS_TOKEN_TTL_SECONDS,
      }),
      this.mcpTokenRepository.create({
        id: randomUUID(),
        accountId,
        grantId,
        kind: 'refresh',
        tokenHash: this.mcpTokenService.hashToken(refreshToken),
        createdAt,
        expiresAt: nowInSeconds + MCP_REFRESH_TOKEN_TTL_SECONDS,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: MCP_ACCESS_TOKEN_TTL_SECONDS,
    };
  }
}

export namespace McpTokenIssuer {
  export type Input = {
    accountId: string;
    grantId: string;
  };

  export type Output = {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
