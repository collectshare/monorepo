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

  /** A random secret; tokens pass their `cs_mat_`/`cs_mrt_` prefix, authorization codes none. */
  generate(prefix = ''): string {
    return `${prefix}${randomBytes(32).toString('base64url')}`;
  }

  hashToken(rawToken: string): string {
    return createHmac('sha256', this.appConfig.secrets.masterSecret)
      .update(rawToken)
      .digest('hex');
  }

  hashAuthorizationCode(code: string): string {
    return this.hashToken(`oauth-code:${code}`);
  }
}
