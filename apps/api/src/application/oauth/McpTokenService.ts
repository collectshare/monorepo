import { createHmac, randomBytes } from 'node:crypto';

import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';

export const MCP_ACCESS_TOKEN_PREFIX = 'cs_mat_';
export const MCP_REFRESH_TOKEN_PREFIX = 'cs_mrt_';

export const MCP_ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
export const MCP_REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
export const OAUTH_CODE_TTL_SECONDS = 60;

/** Generates opaque OAuth secrets and derives the HMAC stored in DynamoDB in place of them. */
@Injectable()
export class McpTokenService {
  constructor(private readonly appConfig: AppConfig) {}

  generateAccessToken(): string {
    return `${MCP_ACCESS_TOKEN_PREFIX}${randomBytes(32).toString('base64url')}`;
  }

  generateRefreshToken(): string {
    return `${MCP_REFRESH_TOKEN_PREFIX}${randomBytes(32).toString('base64url')}`;
  }

  generateAuthorizationCode(): string {
    return randomBytes(32).toString('base64url');
  }

  hashToken(rawToken: string): string {
    return this.hmac(rawToken);
  }

  hashAuthorizationCode(code: string): string {
    return this.hmac(`oauth-code:${code}`);
  }

  private hmac(value: string): string {
    return createHmac('sha256', this.appConfig.secrets.masterSecret)
      .update(value)
      .digest('hex');
  }
}
