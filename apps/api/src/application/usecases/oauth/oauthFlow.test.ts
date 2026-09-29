import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOAuthServices } from '@application/oauth/__testing__/fakes';
import { computeS256Challenge } from '@application/oauth/pkce';
import { OAuthError } from '@application/oauth/OAuthError';

import { DecideAuthorizationUseCase } from './DecideAuthorizationUseCase';
import { ExchangeAuthorizationCodeUseCase } from './ExchangeAuthorizationCodeUseCase';
import { RefreshMcpTokenUseCase } from './RefreshMcpTokenUseCase';
import { RegisterOAuthClientUseCase } from './RegisterOAuthClientUseCase';
import { ValidateAuthorizationRequestUseCase } from './ValidateAuthorizationRequestUseCase';

const REDIRECT_URI = 'https://claude.ai/api/mcp/auth_callback';
const CODE_VERIFIER = 'a-very-long-and-random-code-verifier-for-tests-1234567890';

function setup() {
  const services = createOAuthServices();

  const register = new RegisterOAuthClientUseCase(services.oauthClientService);
  const validate = new ValidateAuthorizationRequestUseCase(services.authorizationRequestValidator);
  const decide = new DecideAuthorizationUseCase(
    services.authorizationRequestValidator,
    services.mcpTokenService,
    services.oauthCodeRepository,
  );
  const exchange = new ExchangeAuthorizationCodeUseCase(
    services.oauthClientService,
    services.authorizationRequestValidator,
    services.mcpTokenService,
    services.mcpTokenIssuer,
    services.oauthCodeRepository,
    services.mcpGrantRepository,
  );
  const refresh = new RefreshMcpTokenUseCase(
    services.oauthClientService,
    services.authorizationRequestValidator,
    services.mcpTokenService,
    services.mcpTokenIssuer,
    services.mcpTokenRepository,
    services.mcpGrantRepository,
    services.accountRepository,
  );

  return { ...services, register, validate, decide, exchange, refresh };
}

async function registeredClient(register: RegisterOAuthClientUseCase, redirectUri = REDIRECT_URI) {
  return register.execute({ redirectUris: [redirectUri], clientName: 'Claude' });
}

function authorizeParams(clientId: string, overrides: Record<string, string | undefined> = {}) {
  return {
    clientId,
    redirectUri: REDIRECT_URI,
    responseType: 'code',
    codeChallenge: computeS256Challenge(CODE_VERIFIER),
    codeChallengeMethod: 'S256',
    ...overrides,
  };
}

async function approve(ctx: ReturnType<typeof setup>, clientId: string, accountId = 'account-1') {
  const { redirectTo } = await ctx.decide.execute({
    ...authorizeParams(clientId),
    accountId,
    decision: 'approve',
    state: 'xyz',
  });

  return new URL(redirectTo).searchParams.get('code')!;
}

async function rejection(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error as OAuthError;
  }

  throw new Error('Expected the promise to reject');
}

describe('authorization request validation', () => {
  it('returns the client name and redirect host for a valid request', async () => {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);

    await expect(ctx.validate.execute(authorizeParams(clientId))).resolves.toEqual({
      clientName: 'Claude',
      redirectHost: 'claude.ai',
    });
  });

  it('rejects an unregistered redirect_uri', async () => {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);

    const error = await rejection(ctx.validate.execute(authorizeParams(clientId, { redirectUri: 'https://claude.com/api/mcp/auth_callback' })));

    expect(error.error).toBe('invalid_request');
  });

  it('rejects an unknown client_id', async () => {
    const ctx = setup();

    const error = await rejection(ctx.validate.execute(authorizeParams('bogus')));

    expect(error.error).toBe('invalid_request');
    expect(error.statusCode).toBe(400);
  });

  it('rejects a missing, plain or malformed PKCE challenge', async () => {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);

    for (const overrides of [
      { codeChallenge: undefined },
      { codeChallengeMethod: 'plain' },
      { codeChallengeMethod: undefined },
      { codeChallenge: 'short' },
    ]) {
      const error = await rejection(ctx.validate.execute(authorizeParams(clientId, overrides)));
      expect(error.error).toBe('invalid_request');
    }
  });

  it('rejects response types other than code', async () => {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);

    const error = await rejection(ctx.validate.execute(authorizeParams(clientId, { responseType: 'token' })));

    expect(error.error).toBe('invalid_request');
  });

  it('accepts the MCP resource and rejects any other', async () => {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);

    await expect(ctx.validate.execute(authorizeParams(clientId, { resource: 'https://api.test/mcp' }))).resolves.toBeDefined();

    const error = await rejection(ctx.validate.execute(authorizeParams(clientId, { resource: 'https://other.example/mcp' })));

    expect(error.error).toBe('invalid_target');
  });

  it('lets a loopback client use a different port', async () => {
    const ctx = setup();
    const { clientId } = await ctx.register.execute({ redirectUris: ['http://localhost:53682/callback'] });

    await expect(
      ctx.validate.execute(authorizeParams(clientId, { redirectUri: 'http://localhost:61000/callback' })),
    ).resolves.toMatchObject({ redirectHost: 'localhost:61000' });
  });
});

describe('authorization decision', () => {
  it('stores a code bound to the account, client, redirect and challenge and echoes state', async () => {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);

    const { redirectTo } = await ctx.decide.execute({
      ...authorizeParams(clientId),
      accountId: 'account-1',
      decision: 'approve',
      state: 'xyz',
    });

    const url = new URL(redirectTo);
    expect(`${url.origin}${url.pathname}`).toBe(REDIRECT_URI);
    expect(url.searchParams.get('state')).toBe('xyz');
    expect(url.searchParams.get('code')).toBeTruthy();

    expect(ctx.codes.size).toBe(1);
    const [stored] = [...ctx.codes.values()];
    expect(stored).toMatchObject({
      accountId: 'account-1',
      clientId,
      redirectUri: REDIRECT_URI,
      codeChallenge: computeS256Challenge(CODE_VERIFIER),
    });
    expect(stored.expiresAt * 1000 - Date.now()).toBeLessThanOrEqual(60_000);
    expect(stored.codeHash).not.toContain(url.searchParams.get('code'));
  });

  it('redirects with access_denied and creates no code on deny', async () => {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);

    const { redirectTo } = await ctx.decide.execute({
      ...authorizeParams(clientId),
      accountId: 'account-1',
      decision: 'deny',
      state: 'xyz',
    });

    const url = new URL(redirectTo);
    expect(url.searchParams.get('error')).toBe('access_denied');
    expect(url.searchParams.get('state')).toBe('xyz');
    expect(url.searchParams.get('code')).toBeNull();
    expect(ctx.codes.size).toBe(0);
  });

  it('re-validates and creates no code for invalid parameters', async () => {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);

    const error = await rejection(ctx.decide.execute({
      ...authorizeParams(clientId, { redirectUri: 'https://evil.example/cb' }),
      accountId: 'account-1',
      decision: 'approve',
    }));

    expect(error.error).toBe('invalid_request');
    expect(ctx.codes.size).toBe(0);
  });
});

describe('authorization code exchange', () => {
  const exchangeInput = (clientId: string, code: string, overrides = {}) => ({
    code,
    clientId,
    redirectUri: REDIRECT_URI,
    codeVerifier: CODE_VERIFIER,
    ...overrides,
  });

  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); });
  afterEach(() => { vi.useRealTimers(); });

  it('issues tokens and a grant for a valid code and verifier', async () => {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);
    const code = await approve(ctx, clientId);

    const tokens = await ctx.exchange.execute(exchangeInput(clientId, code));

    expect(tokens.accessToken.startsWith('cs_mat_')).toBe(true);
    expect(tokens.refreshToken.startsWith('cs_mrt_')).toBe(true);
    expect(tokens.expiresIn).toBe(3600);
    expect(ctx.grants.size).toBe(1);
    expect([...ctx.grants.values()][0]).toMatchObject({ accountId: 'account-1', clientId, clientName: 'Claude' });

    await expect(ctx.mcpTokenAuthenticator.authenticate(tokens.accessToken)).resolves.toMatchObject({
      accountId: 'account-1',
    });
  });

  it('never stores raw tokens', async () => {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);
    const tokens = await ctx.exchange.execute(exchangeInput(clientId, await approve(ctx, clientId)));

    const stored = JSON.stringify([...ctx.tokens.values()]);
    expect(stored).not.toContain(tokens.accessToken);
    expect(stored).not.toContain(tokens.refreshToken);
  });

  it('rejects a wrong code_verifier and burns the code', async () => {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);
    const code = await approve(ctx, clientId);

    const error = await rejection(ctx.exchange.execute(exchangeInput(clientId, code, { codeVerifier: 'x'.repeat(50) })));
    expect(error.error).toBe('invalid_grant');

    const retry = await rejection(ctx.exchange.execute(exchangeInput(clientId, code)));
    expect(retry.error).toBe('invalid_grant');
  });

  it('rejects code reuse', async () => {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);
    const code = await approve(ctx, clientId);

    await ctx.exchange.execute(exchangeInput(clientId, code));
    const error = await rejection(ctx.exchange.execute(exchangeInput(clientId, code)));

    expect(error.error).toBe('invalid_grant');
  });

  it('rejects an expired code', async () => {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);
    const code = await approve(ctx, clientId);

    vi.setSystemTime(Date.now() + 61_000);
    const error = await rejection(ctx.exchange.execute(exchangeInput(clientId, code)));

    expect(error.error).toBe('invalid_grant');
  });

  it('rejects a mismatched redirect_uri', async () => {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);
    const code = await approve(ctx, clientId);

    const error = await rejection(ctx.exchange.execute(exchangeInput(clientId, code, {
      redirectUri: 'https://claude.com/api/mcp/auth_callback',
    })));

    expect(error.error).toBe('invalid_grant');
  });

  it('rejects a different (valid) client_id than the one bound to the code', async () => {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);
    const other = await ctx.register.execute({ redirectUris: [REDIRECT_URI], clientName: 'Other' });
    const code = await approve(ctx, clientId);

    const error = await rejection(ctx.exchange.execute(exchangeInput(other.clientId, code)));

    expect(error.error).toBe('invalid_grant');
  });

  it('rejects a forged client_id with invalid_client', async () => {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);
    const code = await approve(ctx, clientId);

    const error = await rejection(ctx.exchange.execute(exchangeInput('forged.id', code)));

    expect(error.error).toBe('invalid_client');
    expect(error.statusCode).toBe(401);
  });
});

describe('refresh token rotation', () => {
  async function connected() {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);
    const code = await approve(ctx, clientId);
    const tokens = await ctx.exchange.execute({
      code, clientId, redirectUri: REDIRECT_URI, codeVerifier: CODE_VERIFIER,
    });

    return { ctx, clientId, tokens };
  }

  it('rotates: new pair works and the old refresh token is spent', async () => {
    const { ctx, clientId, tokens } = await connected();

    const next = await ctx.refresh.execute({ refreshToken: tokens.refreshToken, clientId });

    expect(next.accessToken).not.toBe(tokens.accessToken);
    expect(next.refreshToken).not.toBe(tokens.refreshToken);
    await expect(ctx.mcpTokenAuthenticator.authenticate(next.accessToken)).resolves.toMatchObject({
      accountId: 'account-1',
    });
  });

  it('revokes the whole grant when a used refresh token is replayed', async () => {
    const { ctx, clientId, tokens } = await connected();

    const next = await ctx.refresh.execute({ refreshToken: tokens.refreshToken, clientId });
    const error = await rejection(ctx.refresh.execute({ refreshToken: tokens.refreshToken, clientId }));

    expect(error.error).toBe('invalid_grant');
    await expect(ctx.mcpTokenAuthenticator.authenticate(next.accessToken)).resolves.toBeNull();
    await expect(ctx.mcpTokenAuthenticator.authenticate(tokens.accessToken)).resolves.toBeNull();
    const followUp = await rejection(ctx.refresh.execute({ refreshToken: next.refreshToken, clientId }));
    expect(followUp.error).toBe('invalid_grant');
  });

  it('fails when the account no longer exists', async () => {
    const { ctx, clientId, tokens } = await connected();
    ctx.accounts.delete('account-1');

    const error = await rejection(ctx.refresh.execute({ refreshToken: tokens.refreshToken, clientId }));

    expect(error.error).toBe('invalid_grant');
  });

  it('rejects an access token, unknown tokens and a different client', async () => {
    const { ctx, clientId, tokens } = await connected();
    const other = await ctx.register.execute({ redirectUris: [REDIRECT_URI], clientName: 'Other' });

    for (const attempt of [
      { refreshToken: tokens.accessToken, clientId },
      { refreshToken: 'cs_mrt_unknown', clientId },
      { refreshToken: tokens.refreshToken, clientId: other.clientId },
    ]) {
      const error = await rejection(ctx.refresh.execute(attempt));
      expect(error.error).toBe('invalid_grant');
    }
  });

  it('rejects an expired refresh token', async () => {
    const { ctx, clientId, tokens } = await connected();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 31 * 24 * 60 * 60 * 1000);

    try {
      const error = await rejection(ctx.refresh.execute({ refreshToken: tokens.refreshToken, clientId }));
      expect(error.error).toBe('invalid_grant');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('McpTokenAuthenticator', () => {
  async function connected() {
    const ctx = setup();
    const { clientId } = await registeredClient(ctx.register);
    const code = await approve(ctx, clientId);
    const tokens = await ctx.exchange.execute({
      code, clientId, redirectUri: REDIRECT_URI, codeVerifier: CODE_VERIFIER,
    });

    return { ctx, tokens };
  }

  it('resolves a valid access token to the account and grant', async () => {
    const { ctx, tokens } = await connected();

    await expect(ctx.mcpTokenAuthenticator.authenticate(tokens.accessToken)).resolves.toEqual({
      accountId: 'account-1',
      grantId: [...ctx.grants.keys()][0],
    });
  });

  it('returns null for an expired access token', async () => {
    const { ctx, tokens } = await connected();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 3_601_000);

    try {
      await expect(ctx.mcpTokenAuthenticator.authenticate(tokens.accessToken)).resolves.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns null once the grant is revoked', async () => {
    const { ctx, tokens } = await connected();
    await ctx.mcpGrantRepository.revoke('account-1', [...ctx.grants.keys()][0]);

    await expect(ctx.mcpTokenAuthenticator.authenticate(tokens.accessToken)).resolves.toBeNull();
  });

  it('returns null for refresh tokens, API keys, Cognito-looking JWTs and empty input', async () => {
    const { ctx, tokens } = await connected();

    for (const value of [
      tokens.refreshToken,
      'cs_sk_0123456789abcdef',
      'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.sig',
      'cs_mat_unknown',
      '',
      null,
      undefined,
    ]) {
      await expect(ctx.mcpTokenAuthenticator.authenticate(value)).resolves.toBeNull();
    }
  });
});
