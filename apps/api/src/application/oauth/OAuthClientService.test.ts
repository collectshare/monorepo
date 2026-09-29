import { describe, expect, it } from 'vitest';

import type { AppConfig } from '@shared/config/AppConfig';

import { OAuthClientService } from './OAuthClientService';
import { OAuthError } from './OAuthError';

function createService(masterSecret = 'secret-a', extraRedirectUris: string[] = []) {
  return new OAuthClientService({
    secrets: { masterSecret },
    oauth: { extraRedirectUris },
  } as AppConfig);
}

describe('OAuthClientService', () => {
  it('registers a client and returns a verifiable client_id', () => {
    const service = createService();

    const registered = service.register({
      redirectUris: ['https://claude.ai/api/mcp/auth_callback'],
      clientName: 'Claude',
    });

    expect(service.verify(registered.clientId)).toEqual({
      clientId: registered.clientId,
      clientName: 'Claude',
      redirectUris: ['https://claude.ai/api/mcp/auth_callback'],
    });
  });

  it('falls back to a default name and truncates long ones', () => {
    const service = createService();
    const uris = ['http://localhost:1234/cb'];

    expect(service.register({ redirectUris: uris }).clientName).toBe('MCP client');
    expect(service.register({ redirectUris: uris, clientName: 'x'.repeat(500) }).clientName).toHaveLength(100);
  });

  it('accepts loopback redirect URIs', () => {
    expect(() => createService().register({ redirectUris: ['http://localhost:53682/callback'] })).not.toThrow();
  });

  it('rejects redirect URIs outside the allow-list', () => {
    expect(() => createService().register({ redirectUris: ['https://evil.example/cb'] }))
      .toThrowError(expect.objectContaining({ error: 'invalid_redirect_uri' }));
  });

  it('rejects an empty redirect_uris list', () => {
    expect(() => createService().register({ redirectUris: [] })).toThrow(OAuthError);
  });

  it('honors configured extra redirect URIs', () => {
    const service = createService('secret-a', ['cursor://anysphere.cursor-retrieval/oauth/callback']);

    expect(() => service.register({ redirectUris: ['cursor://anysphere.cursor-retrieval/oauth/callback'] })).not.toThrow();
  });

  it('rejects a tampered payload', () => {
    const service = createService();
    const { clientId } = service.register({ redirectUris: ['http://localhost:1234/cb'] });
    const [, signature] = clientId.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({
      v: 1, ru: ['https://evil.example/cb'], cn: 'x', iat: 1,
    })).toString('base64url');

    expect(() => service.verify(`${forgedPayload}.${signature}`))
      .toThrowError(expect.objectContaining({ error: 'invalid_client' }));
  });

  it('rejects a client_id signed with another secret', () => {
    const { clientId } = createService('secret-a').register({ redirectUris: ['http://localhost:1234/cb'] });

    expect(() => createService('secret-b').verify(clientId))
      .toThrowError(expect.objectContaining({ error: 'invalid_client' }));
  });

  it('rejects garbage client ids', () => {
    const service = createService();

    for (const value of ['', 'abc', 'a.b.c', '.']) {
      expect(() => service.verify(value)).toThrow(OAuthError);
    }
  });
});
