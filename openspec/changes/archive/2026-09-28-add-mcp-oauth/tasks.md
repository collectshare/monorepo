## 1. Configuration and utilities

- [x] 1.1 Add `WEB_APP_URL` and optional `MCP_OAUTH_EXTRA_REDIRECT_URIS` to `shared/config/env.ts` and `AppConfig` (new `oauth` section: `issuer`, `webAppUrl`, `allowedRedirectUris`), and wire the issuer (`API_DOMAIN_NAME` if set, else the `execute-api` URL from `HttpApi`) through `serverless.yml` environment.
- [x] 1.2 Extend `main/utils/lambdaBodyParser.ts` to parse `application/x-www-form-urlencoded` (and `isBase64Encoded`) besides JSON; add unit tests.
- [x] 1.3 Add an OAuth error helper returning RFC 6749 `{ error, error_description }` responses (with `Cache-Control: no-store`) for use by OAuth controllers.

## 2. Client id, PKCE and token primitives

- [x] 2.1 Implement a signed `client_id` codec (encode/verify `redirect_uris` + name with HMAC-SHA256 and `MASTER_SECRET`), with tests for tampering.
- [x] 2.2 Implement redirect URI validation (allow-list, `http` loopback with any port, exact match otherwise) and tests including `evil.example`, non-loopback `http`, and IPv6 loopback.
- [x] 2.3 Implement PKCE `S256` verification helper and tests.
- [x] 2.4 Implement token generation/hashing (`cs_mat_`, `cs_mrt_`, HMAC-SHA256 with `MASTER_SECRET`) and tests.

## 3. Persistence

- [x] 3.1 Add `OAuthCodeItem` and `OAuthCodeRepository` (`create`, atomic `consume` via `DeleteItem` + `ALL_OLD`; `expiresAt` in epoch seconds).
- [x] 3.2 Add `McpGrantItem`/`McpGrantRepository` (create, find by id, revoke, touch `lastUsedAt`).
- [x] 3.3 Add `McpTokenItem`/`McpTokenRepository` (create, find by hash via `GSI1`, conditional mark-refresh-used, TTL `expiresAt` in epoch seconds).
- [x] 3.4 Add corresponding shared entities under `packages/shared` only if the web needs the types; otherwise keep them API-internal.

## 4. Use cases and services

- [x] 4.1 `RegisterOAuthClientUseCase`: validate `redirect_uris`, return signed `client_id` (stateless).
- [x] 4.2 `ValidateAuthorizationRequestUseCase`: verify `client_id`, exact `redirect_uri`, `response_type=code`, `S256` challenge, optional `resource`; returns client name + redirect host.
- [x] 4.3 `DecideAuthorizationUseCase`: re-validate; on `approve` create the 60s code bound to `accountId`/client/redirect/challenge and build `redirectTo`; on `deny` build the `access_denied` redirect.
- [x] 4.4 `ExchangeAuthorizationCodeUseCase`: consume code, check expiry/client/redirect/PKCE, create grant, issue access (1h) + refresh (30d) tokens.
- [x] 4.5 `RefreshMcpTokenUseCase`: conditional mark-used, rotate tokens in the same grant, revoke grant on reuse, reject when the account no longer exists (`AccountRepository`).
- [x] 4.6 `McpTokenAuthenticator` service: raw token → `{ accountId, grantId }` or `null` (checks prefix, hash lookup, expiry, kind=access, grant not revoked); exported for `add-mcp-server`.
- [x] 4.7 Unit tests for 4.1–4.6 covering every scenario in the spec (reuse, expiry, wrong verifier, mismatches, revoked grant, foreign credential types).

## 5. Controllers and routes

- [x] 5.1 `OAuthProtectedResourceMetadataController` and `OAuthAuthorizationServerMetadataController` (public) with tests.
- [x] 5.2 `OAuthRegisterController` (public, Zod schema) with tests.
- [x] 5.3 `OAuthAuthorizeValidateController` (GET, private) and `OAuthAuthorizeDecisionController` (POST, private, Zod schema) with tests.
- [x] 5.4 `OAuthTokenController` (public; `authorization_code` and `refresh_token`; RFC 6749 errors incl. `unsupported_grant_type`) with tests.
- [x] 5.5 Lambda entrypoints in `main/functions/oauth/` and `sls/functions/oauth.yml` (routes: both `/.well-known/oauth-protected-resource` variants, `/.well-known/oauth-authorization-server`, `POST /oauth/register`, `GET`/`POST /oauth/authorize` with `CognitoAuthorizer`, `POST /oauth/token`); include the file in `serverless.yml`; avoid function-name collisions with existing entries.
- [x] 5.6 `pnpm typecheck` in `apps/api`.

## 6. Web consent page

- [x] 6.1 `returnTo` support: `AuthGuard` passes the current path+query when redirecting to `/sign-in`; `SignIn` (and the signed-in redirect in `AuthGuard`) honor a same-origin relative `returnTo` only.
- [x] 6.2 Add `oauthService` in `apps/web/src/app/services/` for `GET`/`POST /oauth/authorize`.
- [x] 6.3 Add `views/pages/OAuthAuthorize` (client name, redirect host, what is granted, Authorize/Cancel, error state that never redirects) using `@monorepo/ui`; register the route under the private `AuthGuard` in `app/router/index.tsx`.
- [x] 6.4 Verify how `apps/web` is hosted and set `frame-ancestors 'none'` / `X-Frame-Options: DENY` for `/oauth/authorize` if possible.
- [x] 6.5 `pnpm typecheck` and `pnpm lint` in `apps/web`.

## 7. End-to-end verification

- [ ] 7.1 Script the flow with curl: register → open consent in the browser (signed-out and signed-in) → token → refresh → refresh reuse revokes the grant.
- [ ] 7.2 Confirm an MCP token is rejected by a `CognitoAuthorizer` route and by a `/v1` route, and that a `cs_sk_` key is rejected by `McpTokenAuthenticator`.
- [x] 7.3 Document the endpoints, env vars (`WEB_APP_URL`, `MCP_OAUTH_EXTRA_REDIRECT_URIS`, `API_DOMAIN_NAME`) and the issuer-stability caveat in the repo docs / CLAUDE.md.
