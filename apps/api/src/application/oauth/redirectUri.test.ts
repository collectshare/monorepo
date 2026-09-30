import { describe, expect, it } from 'vitest';

import { BUILT_IN_REDIRECT_URIS, isRedirectUriAllowed, redirectUriMatches } from './redirectUri';

describe('isRedirectUriAllowed', () => {
  it('accepts the built-in claude callbacks', () => {
    for (const uri of BUILT_IN_REDIRECT_URIS) {
      expect(isRedirectUriAllowed(uri, BUILT_IN_REDIRECT_URIS)).toBe(true);
    }
  });

  it('accepts http loopback URIs on any port and path', () => {
    expect(isRedirectUriAllowed('http://localhost:53682/callback', [])).toBe(true);
    expect(isRedirectUriAllowed('http://127.0.0.1:8080/cb', [])).toBe(true);
    expect(isRedirectUriAllowed('http://[::1]:9000/cb', [])).toBe(true);
  });

  it('rejects unknown hosts', () => {
    expect(isRedirectUriAllowed('https://evil.example/cb', BUILT_IN_REDIRECT_URIS)).toBe(false);
  });

  it('rejects http on a non-loopback host', () => {
    expect(isRedirectUriAllowed('http://claude.ai/api/mcp/auth_callback', BUILT_IN_REDIRECT_URIS)).toBe(false);
    expect(isRedirectUriAllowed('http://example.com/cb', [])).toBe(false);
  });

  it('rejects look-alike hosts and prefixes', () => {
    expect(isRedirectUriAllowed('https://claude.ai.evil.example/api/mcp/auth_callback', BUILT_IN_REDIRECT_URIS)).toBe(false);
    expect(isRedirectUriAllowed('https://claude.ai/api/mcp/auth_callback/extra', BUILT_IN_REDIRECT_URIS)).toBe(false);
  });

  it('rejects fragments, credentials and malformed URIs', () => {
    expect(isRedirectUriAllowed('http://localhost:1/cb#frag', [])).toBe(false);
    expect(isRedirectUriAllowed('http://user:pass@localhost:1/cb', [])).toBe(false);
    expect(isRedirectUriAllowed('not a uri', [])).toBe(false);
  });

  it('accepts configured extra URIs by exact match only', () => {
    expect(isRedirectUriAllowed('cursor://anysphere.cursor-retrieval/oauth/callback', ['cursor://anysphere.cursor-retrieval/oauth/callback'])).toBe(true);
    expect(isRedirectUriAllowed('cursor://other/oauth/callback', ['cursor://anysphere.cursor-retrieval/oauth/callback'])).toBe(false);
  });
});

describe('redirectUriMatches', () => {
  it('matches an exact registered URI', () => {
    expect(redirectUriMatches(['https://claude.ai/api/mcp/auth_callback'], 'https://claude.ai/api/mcp/auth_callback')).toBe(true);
  });

  it('does not match a different path or host', () => {
    expect(redirectUriMatches(['https://claude.ai/api/mcp/auth_callback'], 'https://claude.ai/other')).toBe(false);
    expect(redirectUriMatches(['https://claude.ai/api/mcp/auth_callback'], 'https://evil.example/api/mcp/auth_callback')).toBe(false);
  });

  it('lets loopback URIs differ only by port', () => {
    expect(redirectUriMatches(['http://localhost:53682/callback'], 'http://localhost:60000/callback')).toBe(true);
    expect(redirectUriMatches(['http://localhost:53682/callback'], 'http://localhost:60000/other')).toBe(false);
    expect(redirectUriMatches(['http://localhost:53682/callback'], 'http://127.0.0.1:53682/callback')).toBe(false);
  });

  it('does not apply port flexibility to non-loopback URIs', () => {
    expect(redirectUriMatches(['https://claude.ai/cb'], 'https://claude.ai:8443/cb')).toBe(false);
  });
});
