## Why

We want AI clients (claude.ai, Claude Code, Cursor) to connect to a Collectshare MCP server (`add-mcp-server`) and act on behalf of a logged-in user. MCP clients authenticate remote servers with OAuth 2.1 (authorization code + PKCE, discovery, dynamic client registration), not with static keys. Cognito cannot fill that role on its own: the user pool has no Hosted UI/domain (login is a custom email+password form in `apps/web` backed by `POST /auth/sign-in`) and Cognito does not support Dynamic Client Registration. API keys (PATs) stay reserved for the `/v1` REST API.

## What Changes

- Add a small OAuth 2.1 **authorization server** to `apps/api`, using the existing Cognito login as the proof of identity:
  - Discovery: `GET /.well-known/oauth-protected-resource` (RFC 9728) and `GET /.well-known/oauth-authorization-server` (RFC 8414).
  - `POST /oauth/register` — stateless Dynamic Client Registration (RFC 7591); the `client_id` is an HMAC-signed blob of the registered `redirect_uris`/name, no table needed. Redirect URIs are checked against an allow-list (claude.ai callback + loopback).
  - `GET /oauth/authorize` and `POST /oauth/authorize` — **private** (Cognito-authenticated) endpoints called by the web consent page: the first validates the request and returns what to display, the second records the user's decision and returns the redirect (with an authorization code, or `access_denied`).
  - `POST /oauth/token` — `authorization_code` (PKCE `S256` required) and `refresh_token` grants; public client (`token_endpoint_auth_method: none`).
- Issue **Collectshare-owned opaque tokens** (access ~1h, refresh ~30d with rotation and reuse detection), stored hashed in DynamoDB and bound to the user's `accountId` and to a per-connection "grant". They are independent from Cognito tokens and from PATs: a Cognito token or `cs_sk_` key is not accepted as an MCP token, and an MCP token is not accepted by the `CognitoAuthorizer` or the `/v1` `ApiKeyAuthorizer`.
- Add an internal **access-token authentication service** (`token → { accountId, grantId }`) that `add-mcp-server` will consume inside the `/mcp` Lambda.
- Add to `apps/web` a `/oauth/authorize` consent page: if the user has no session it goes through the existing sign-in and returns; then it shows which client is asking and offers **Authorize / Cancel**. `AuthGuard` and `SignIn` gain `returnTo` support.
- Extend the Lambda body parsing to accept `application/x-www-form-urlencoded` (required by the token endpoint).

## Capabilities

### New Capabilities
- `mcp-oauth-authorization`: OAuth 2.1 discovery, dynamic client registration, login-backed consent, authorization code + PKCE, token issuance/refresh/rotation, and access-token authentication for MCP clients.

### Modified Capabilities
- (none — `openspec/specs/` has no tracked capability for auth yet; existing sign-in, `/v1` API keys and Cognito authorizers keep their behavior)

## Impact

- **Affected code (`apps/api`)**:
  - `sls/functions/oauth.yml` (new) — well-known, register, authorize (`CognitoAuthorizer`), token routes; included from `serverless.yml`.
  - `src/application/controllers/oauth/` (new) — one controller per endpoint; `src/application/usecases/oauth/` and a token service.
  - `src/infra/database/dynamo/items|repositories/` — new items for authorization code, grant and token (single-table, TTL via the existing numeric `expiresAt` attribute).
  - `src/main/utils/lambdaBodyParser.ts` — form-urlencoded support.
  - `src/shared/config/env.ts` / `AppConfig` — issuer URL (custom domain if `API_DOMAIN_NAME` is set, otherwise the `execute-api` URL), web app URL, redirect allow-list.
- **Affected code (`apps/web`)**: new `views/pages/OAuthAuthorize`, route in `app/router/index.tsx`, `AuthGuard`/`SignIn` `returnTo`, service calls to the two authorize endpoints.
- **Dependencies**: none new (`node:crypto` only).
- **Security**: new unauthenticated endpoints (`register`, `token`, well-known) and a consent screen that can be a phishing target — see design.md.
- **Followed by**: `add-mcp-server` (the `POST /mcp` endpoint and tools), which depends on this change.
