import { describe, expect, it } from 'vitest';

import { Controller } from '@application/contracts/Controller';
import { createOAuthServices } from '@application/oauth/__testing__/fakes';
import { computeS256Challenge } from '@application/oauth/pkce';
import { DecideAuthorizationUseCase } from '@application/usecases/oauth/DecideAuthorizationUseCase';
import { ExchangeAuthorizationCodeUseCase } from '@application/usecases/oauth/ExchangeAuthorizationCodeUseCase';
import { RefreshMcpTokenUseCase } from '@application/usecases/oauth/RefreshMcpTokenUseCase';
import { RegisterOAuthClientUseCase } from '@application/usecases/oauth/RegisterOAuthClientUseCase';
import { ValidateAuthorizationRequestUseCase } from '@application/usecases/oauth/ValidateAuthorizationRequestUseCase';

import { OAuthAuthorizationServerMetadataController } from './OAuthAuthorizationServerMetadataController';
import { OAuthAuthorizeDecisionController } from './OAuthAuthorizeDecisionController';
import { OAuthAuthorizeValidateController } from './OAuthAuthorizeValidateController';
import { OAuthProtectedResourceMetadataController } from './OAuthProtectedResourceMetadataController';
import { OAuthRegisterController } from './OAuthRegisterController';
import { OAuthTokenController } from './OAuthTokenController';

const REDIRECT_URI = 'https://claude.ai/api/mcp/auth_callback';
const CODE_VERIFIER = 'a-very-long-and-random-code-verifier-for-tests-1234567890';

function setup() {
  const services = createOAuthServices();

  const registerUseCase = new RegisterOAuthClientUseCase(services.oauthClientService);
  const validateUseCase = new ValidateAuthorizationRequestUseCase(services.authorizationRequestValidator);
  const decideUseCase = new DecideAuthorizationUseCase(
    services.authorizationRequestValidator,
    services.mcpTokenService,
    services.oauthCodeRepository,
  );
  const exchangeUseCase = new ExchangeAuthorizationCodeUseCase(
    services.oauthClientService,
    services.authorizationRequestValidator,
    services.mcpTokenService,
    services.mcpTokenIssuer,
    services.oauthCodeRepository,
    services.mcpGrantRepository,
  );
  const refreshUseCase = new RefreshMcpTokenUseCase(
    services.oauthClientService,
    services.authorizationRequestValidator,
    services.mcpTokenService,
    services.mcpTokenIssuer,
    services.mcpTokenRepository,
    services.mcpGrantRepository,
    services.accountRepository,
  );

  return {
    ...services,
    protectedResource: new OAuthProtectedResourceMetadataController(services.appConfig),
    authorizationServer: new OAuthAuthorizationServerMetadataController(services.appConfig),
    register: new OAuthRegisterController(registerUseCase),
    authorizeValidate: new OAuthAuthorizeValidateController(validateUseCase),
    authorizeDecision: new OAuthAuthorizeDecisionController(decideUseCase),
    token: new OAuthTokenController(exchangeUseCase, refreshUseCase),
  };
}

function publicRequest(body: Record<string, unknown> = {}): Controller.Request<'public'> {
  return { body, params: {}, queryParams: {}, ip: null, userAgent: null, accountId: null };
}

function privateRequest(
  overrides: Partial<Controller.Request<'private'>> = {},
): Controller.Request<'private'> {
  return {
    body: {}, params: {}, queryParams: {}, ip: null, userAgent: null, accountId: 'account-1', ...overrides,
  };
}

async function registerClient(ctx: ReturnType<typeof setup>) {
  const response = await ctx.register.execute(publicRequest({
    redirect_uris: [REDIRECT_URI],
    client_name: 'Claude',
  }));

  return (response.body as OAuthRegisterController.Response).client_id;
}

function decisionBody(clientId: string, decision: 'approve' | 'deny' = 'approve') {
  return {
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    code_challenge: computeS256Challenge(CODE_VERIFIER),
    code_challenge_method: 'S256',
    state: 'st',
    decision,
  };
}

async function obtainCode(ctx: ReturnType<typeof setup>, clientId: string) {
  const response = await ctx.authorizeDecision.execute(privateRequest({ body: decisionBody(clientId) }));
  const { redirectTo } = response.body as OAuthAuthorizeDecisionController.Response;

  return new URL(redirectTo).searchParams.get('code')!;
}

describe('metadata controllers', () => {
  it('publishes the protected resource metadata', async () => {
    const response = await setup().protectedResource.execute(publicRequest());

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      resource: 'https://api.test/mcp',
      authorization_servers: ['https://api.test'],
      bearer_methods_supported: ['header'],
    });
  });

  it('publishes the authorization server metadata with S256 only and the web consent page', async () => {
    const response = await setup().authorizationServer.execute(publicRequest());

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      issuer: 'https://api.test',
      authorization_endpoint: 'https://app.test/oauth/authorize',
      token_endpoint: 'https://api.test/oauth/token',
      registration_endpoint: 'https://api.test/oauth/register',
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
    });
    expect((response.body as OAuthAuthorizationServerMetadataController.Response).code_challenge_methods_supported)
      .not.toContain('plain');
  });
});

describe('OAuthRegisterController', () => {
  it('registers a client', async () => {
    const response = await setup().register.execute(publicRequest({
      redirect_uris: [REDIRECT_URI],
      client_name: 'Claude',
    }));

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      client_name: 'Claude',
      redirect_uris: [REDIRECT_URI],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    });
    expect((response.body as OAuthRegisterController.Response).client_id).toBeTruthy();
  });

  it('rejects a redirect URI outside the allow-list', async () => {
    const response = await setup().register.execute(publicRequest({ redirect_uris: ['https://evil.example/cb'] }));

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({ error: 'invalid_redirect_uri' });
  });

  it('rejects a body without redirect_uris using an RFC 7591 error', async () => {
    const response = await setup().register.execute(publicRequest({ client_name: 'x' }));

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({ error: 'invalid_client_metadata' });
  });
});

describe('authorize controllers', () => {
  it('GET returns the client name and redirect host', async () => {
    const ctx = setup();
    const clientId = await registerClient(ctx);

    const response = await ctx.authorizeValidate.execute(privateRequest({
      queryParams: {
        client_id: clientId,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        code_challenge: computeS256Challenge(CODE_VERIFIER),
        code_challenge_method: 'S256',
      },
    }));

    expect(response).toMatchObject({
      statusCode: 200,
      body: { clientName: 'Claude', redirectHost: 'claude.ai' },
    });
  });

  it('GET reports validation failures as 400 without a redirect', async () => {
    const ctx = setup();
    const clientId = await registerClient(ctx);

    const response = await ctx.authorizeValidate.execute(privateRequest({
      queryParams: { client_id: clientId, redirect_uri: 'https://evil.example/cb', response_type: 'code' },
    }));

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({ error: 'invalid_request' });
  });

  it('POST approve returns a redirect carrying code and state', async () => {
    const ctx = setup();
    const clientId = await registerClient(ctx);

    const response = await ctx.authorizeDecision.execute(privateRequest({ body: decisionBody(clientId) }));

    expect(response.statusCode).toBe(200);
    const url = new URL((response.body as OAuthAuthorizeDecisionController.Response).redirectTo);
    expect(url.searchParams.get('code')).toBeTruthy();
    expect(url.searchParams.get('state')).toBe('st');
  });

  it('POST deny returns a redirect carrying access_denied', async () => {
    const ctx = setup();
    const clientId = await registerClient(ctx);

    const response = await ctx.authorizeDecision.execute(privateRequest({ body: decisionBody(clientId, 'deny') }));

    const url = new URL((response.body as OAuthAuthorizeDecisionController.Response).redirectTo);
    expect(url.searchParams.get('error')).toBe('access_denied');
    expect(url.searchParams.get('code')).toBeNull();
  });

  it('POST rejects invalid parameters and a missing decision', async () => {
    const ctx = setup();
    const clientId = await registerClient(ctx);

    const invalid = await ctx.authorizeDecision.execute(privateRequest({
      body: { ...decisionBody(clientId), redirect_uri: 'https://evil.example/cb' },
    }));
    const missingDecision = await ctx.authorizeDecision.execute(privateRequest({
      body: { ...decisionBody(clientId), decision: undefined },
    }));

    expect(invalid.statusCode).toBe(400);
    expect(missingDecision.statusCode).toBe(400);
    expect(ctx.codes.size).toBe(0);
  });
});

describe('OAuthTokenController', () => {
  it('exchanges a code for tokens with no-store headers', async () => {
    const ctx = setup();
    const clientId = await registerClient(ctx);
    const code = await obtainCode(ctx, clientId);

    const response = await ctx.token.execute(publicRequest({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      code_verifier: CODE_VERIFIER,
    }));

    expect(response.statusCode).toBe(200);
    expect(response.headers).toMatchObject({ 'Cache-Control': 'no-store' });
    expect(response.body).toMatchObject({ token_type: 'Bearer', expires_in: 3600 });
    expect((response.body as OAuthTokenController.Response).access_token.startsWith('cs_mat_')).toBe(true);
    expect((response.body as OAuthTokenController.Response).refresh_token.startsWith('cs_mrt_')).toBe(true);
  });

  it('refreshes with the refresh_token grant', async () => {
    const ctx = setup();
    const clientId = await registerClient(ctx);
    const code = await obtainCode(ctx, clientId);
    const first = (await ctx.token.execute(publicRequest({
      grant_type: 'authorization_code', code, client_id: clientId, redirect_uri: REDIRECT_URI, code_verifier: CODE_VERIFIER,
    }))).body as OAuthTokenController.Response;

    const response = await ctx.token.execute(publicRequest({
      grant_type: 'refresh_token', refresh_token: first.refresh_token, client_id: clientId,
    }));

    expect(response.statusCode).toBe(200);
    expect((response.body as OAuthTokenController.Response).access_token).not.toBe(first.access_token);
  });

  it('returns invalid_grant for a wrong verifier', async () => {
    const ctx = setup();
    const clientId = await registerClient(ctx);
    const code = await obtainCode(ctx, clientId);

    const response = await ctx.token.execute(publicRequest({
      grant_type: 'authorization_code', code, client_id: clientId, redirect_uri: REDIRECT_URI, code_verifier: 'y'.repeat(50),
    }));

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({ error: 'invalid_grant' });
  });

  it('returns 401 invalid_client for a forged client_id', async () => {
    const response = await setup().token.execute(publicRequest({
      grant_type: 'authorization_code', code: 'c', client_id: 'forged.id', redirect_uri: REDIRECT_URI, code_verifier: 'v'.repeat(50),
    }));

    expect(response.statusCode).toBe(401);
    expect(response.body).toMatchObject({ error: 'invalid_client' });
  });

  it('returns unsupported_grant_type for other grants', async () => {
    const ctx = setup();
    const clientId = await registerClient(ctx);

    const response = await ctx.token.execute(publicRequest({ grant_type: 'client_credentials', client_id: clientId }));

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({ error: 'unsupported_grant_type' });
  });

  it('returns invalid_request when required parameters are missing', async () => {
    const ctx = setup();
    const clientId = await registerClient(ctx);

    for (const body of [
      {},
      { grant_type: 'authorization_code', client_id: clientId },
      { grant_type: 'refresh_token', client_id: clientId },
    ]) {
      const response = await ctx.token.execute(publicRequest(body));
      expect(response.statusCode).toBe(400);
      expect(response.body).toMatchObject({ error: 'invalid_request' });
    }
  });
});
