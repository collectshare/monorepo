/**
 * Exercises the MCP OAuth flow against a deployed stack, playing the roles of the MCP client
 * and of the web consent page (which only forwards the user's Cognito session).
 *
 *   API_URL=https://<issuer> EMAIL=you@example.com PASSWORD=... pnpm verify:mcp-oauth
 *
 * It creates one grant on the given account and leaves it behind (there is no revoke endpoint yet).
 */
import { createHash, randomBytes } from 'node:crypto';

const apiUrl = (process.env.API_URL ?? '').replace(/\/+$/, '');
const { EMAIL, PASSWORD } = process.env;

if (!apiUrl || !EMAIL || !PASSWORD) {
  throw new Error('API_URL, EMAIL and PASSWORD are required');
}

const REDIRECT_URI = 'http://localhost:53682/callback';

let failures = 0;

function check(description: string, condition: boolean, details?: unknown) {
  // eslint-disable-next-line no-console
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${description}`);

  if (!condition) {
    failures += 1;

    if (details !== undefined) {
      // eslint-disable-next-line no-console
      console.log('      ', JSON.stringify(details));
    }
  }
}

async function json(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function tokenRequest(params: Record<string, string>) {
  const response = await fetch(`${apiUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });

  return { status: response.status, headers: response.headers, body: await json(response) };
}

async function main() {
  // 1. Discovery
  const resourceMetadata = await json(await fetch(`${apiUrl}/.well-known/oauth-protected-resource/mcp`));
  const serverMetadata = await json(await fetch(`${apiUrl}/.well-known/oauth-authorization-server`));

  check('protected resource metadata points to <issuer>/mcp', resourceMetadata.resource === `${apiUrl}/mcp`, resourceMetadata);
  check('authorization server metadata advertises S256 only', JSON.stringify(serverMetadata.code_challenge_methods_supported) === '["S256"]', serverMetadata);
  check('issuer matches API_URL', serverMetadata.issuer === apiUrl, serverMetadata.issuer);

  // 2. Dynamic client registration
  const registerResponse = await fetch(`${apiUrl}/oauth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirect_uris: [REDIRECT_URI], client_name: 'verifyMcpOAuth script' }),
  });
  const client = await json(registerResponse);
  check('registration returns 201 and a client_id', registerResponse.status === 201 && !!client.client_id, client);

  const evilResponse = await fetch(`${apiUrl}/oauth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirect_uris: ['https://evil.example/cb'] }),
  });
  check('registration rejects redirect URIs outside the allow-list', evilResponse.status === 400, await json(evilResponse));

  // 3. The user signs in (what apps/web does before showing the consent page)
  const signIn = await json(await fetch(`${apiUrl}/auth/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  }));
  const cognitoToken = signIn.accessToken as string;
  check('sign-in returned a Cognito access token', !!cognitoToken);
  const auth = { Authorization: `Bearer ${cognitoToken}` };

  // 4. Consent page: validate, then approve
  const codeVerifier = randomBytes(48).toString('base64url');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  const authorizeParams = {
    client_id: client.client_id as string,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: 'verify-state',
  };

  const unauthenticated = await fetch(`${apiUrl}/oauth/authorize?${new URLSearchParams(authorizeParams)}`);
  check('GET /oauth/authorize requires a Cognito session', unauthenticated.status === 401, unauthenticated.status);

  const validation = await fetch(`${apiUrl}/oauth/authorize?${new URLSearchParams(authorizeParams)}`, { headers: auth });
  const validationBody = await json(validation);
  check('GET /oauth/authorize returns client name and redirect host', validation.status === 200 && validationBody.redirectHost === 'localhost:53682', validationBody);

  const denied = await json(await fetch(`${apiUrl}/oauth/authorize`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...authorizeParams, decision: 'deny' }),
  }));
  check('deny redirects with access_denied and no code', new URL(denied.redirectTo).searchParams.get('error') === 'access_denied' && !new URL(denied.redirectTo).searchParams.has('code'), denied);

  const approved = await json(await fetch(`${apiUrl}/oauth/authorize`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...authorizeParams, decision: 'approve' }),
  }));
  const redirect = new URL(approved.redirectTo);
  const code = redirect.searchParams.get('code');
  check('approve redirects with code and state', !!code && redirect.searchParams.get('state') === 'verify-state', approved);

  // 5. Token exchange
  const wrongVerifier = await tokenRequest({
    grant_type: 'authorization_code', code: code!, client_id: client.client_id, redirect_uri: REDIRECT_URI, code_verifier: 'x'.repeat(64),
  });
  check('wrong code_verifier -> invalid_grant', wrongVerifier.status === 400 && wrongVerifier.body.error === 'invalid_grant', wrongVerifier.body);

  const approvedAgain = await json(await fetch(`${apiUrl}/oauth/authorize`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...authorizeParams, decision: 'approve' }),
  }));
  const freshCode = new URL(approvedAgain.redirectTo).searchParams.get('code')!;

  const exchange = await tokenRequest({
    grant_type: 'authorization_code', code: freshCode, client_id: client.client_id, redirect_uri: REDIRECT_URI, code_verifier: codeVerifier,
  });
  check('code exchange returns Bearer tokens with no-store', exchange.status === 200 && exchange.body.token_type === 'Bearer' && exchange.headers.get('cache-control') === 'no-store', exchange.body);

  const reuse = await tokenRequest({
    grant_type: 'authorization_code', code: freshCode, client_id: client.client_id, redirect_uri: REDIRECT_URI, code_verifier: codeVerifier,
  });
  check('code reuse -> invalid_grant', reuse.status === 400 && reuse.body.error === 'invalid_grant', reuse.body);

  // 6. MCP tokens are not accepted elsewhere
  const mcpAccessToken = exchange.body.access_token as string;
  const onPrivateRoute = await fetch(`${apiUrl}/forms`, { headers: { Authorization: `Bearer ${mcpAccessToken}` } });
  check('MCP access token is rejected by a Cognito-authorized route', onPrivateRoute.status === 401, onPrivateRoute.status);

  const onV1Route = await fetch(`${apiUrl}/v1/forms`, { headers: { 'x-api-key': mcpAccessToken } });
  check('MCP access token is rejected by the /v1 API-key authorizer', onV1Route.status === 401 || onV1Route.status === 403, onV1Route.status);

  // 7. Refresh rotation and reuse detection
  const refreshed = await tokenRequest({
    grant_type: 'refresh_token', refresh_token: exchange.body.refresh_token, client_id: client.client_id,
  });
  check('refresh returns a new pair', refreshed.status === 200 && refreshed.body.refresh_token !== exchange.body.refresh_token, refreshed.body);

  const replay = await tokenRequest({
    grant_type: 'refresh_token', refresh_token: exchange.body.refresh_token, client_id: client.client_id,
  });
  check('replaying a used refresh token -> invalid_grant', replay.status === 400 && replay.body.error === 'invalid_grant', replay.body);

  const afterReplay = await tokenRequest({
    grant_type: 'refresh_token', refresh_token: refreshed.body.refresh_token, client_id: client.client_id,
  });
  check('reuse revoked the grant: the rotated refresh token no longer works', afterReplay.status === 400, afterReplay.body);

  // eslint-disable-next-line no-console
  console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
