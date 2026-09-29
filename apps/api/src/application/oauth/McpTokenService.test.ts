import { describe, expect, it } from 'vitest';

import type { AppConfig } from '@shared/config/AppConfig';

import {
  MCP_ACCESS_TOKEN_PREFIX,
  MCP_REFRESH_TOKEN_PREFIX,
  McpTokenService,
} from './McpTokenService';

const service = new McpTokenService({ secrets: { masterSecret: 'secret-a' } } as AppConfig);

describe('McpTokenService', () => {
  it('generates prefixed, unique, high-entropy tokens', () => {
    const first = service.generateAccessToken();
    const second = service.generateAccessToken();

    expect(first.startsWith(MCP_ACCESS_TOKEN_PREFIX)).toBe(true);
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThan(MCP_ACCESS_TOKEN_PREFIX.length + 40);
    expect(service.generateRefreshToken().startsWith(MCP_REFRESH_TOKEN_PREFIX)).toBe(true);
  });

  it('hashes deterministically and never returns the raw value', () => {
    const token = service.generateAccessToken();

    expect(service.hashToken(token)).toBe(service.hashToken(token));
    expect(service.hashToken(token)).not.toContain(token);
    expect(service.hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('depends on the master secret', () => {
    const other = new McpTokenService({ secrets: { masterSecret: 'secret-b' } } as AppConfig);

    expect(other.hashToken('same')).not.toBe(service.hashToken('same'));
  });

  it('keeps authorization code hashes in a different namespace than token hashes', () => {
    expect(service.hashAuthorizationCode('value')).not.toBe(service.hashToken('value'));
  });
});
