## Context

- Login today is custom: `apps/web` posts email+password to `POST /auth/sign-in`, `AuthGateway.signIn` runs Cognito `USER_PASSWORD_AUTH` against a single `UserPoolClient` (has a secret, 12h access tokens) and the web stores `ACCESS_TOKEN`/`REFRESH_TOKEN` in localStorage. There is no Cognito Hosted UI or domain, and Cognito has no Dynamic Client Registration.
- Private routes use the API Gateway `CognitoAuthorizer` (JWT, audience = that one client); the `accountId` comes from the `internalId` claim. `/v1` routes use the Lambda `ApiKeyAuthorizer` (PATs, `cs_sk_…`, HMAC-SHA256 with `MASTER_SECRET`, looked up through `GSI1`).
- `MainTable` is single-table, with `GSI1` and a TTL on the numeric attribute `expiresAt` (`ApiKeyItem.expiresAt` is an ISO string, so TTL ignores it — new items must store epoch **seconds** to be reaped).
- API Gateway HTTP API cannot customize the 401/403 of an authorizer, so it cannot emit `WWW-Authenticate` — which is why `/mcp` (next change) authenticates inside its Lambda, using the service this change delivers.
- The API domain is optional: `APIGWCustomDomain.yml` is created only when `API_DOMAIN_NAME` and `ROUTE53_HOSTED_ZONE_ID` are set; otherwise the API is reachable on the `execute-api` URL (`$default` stage → no path prefix).

Consumers: MCP clients (claude.ai custom connector, Claude Code, Cursor) and the `add-mcp-server` change.

## Goals / Non-Goals

**Goals:**
- Let an MCP client obtain a token for a logged-in user through a standard OAuth 2.1 flow (discovery → DCR → authorization code + PKCE → token → refresh).
- Reuse the existing sign-in UI/Cognito identity; no new user database, no new password flow.
- Keep MCP credentials isolated: separate audience/prefix, hashed at rest, revocable per connection.
- Give `add-mcp-server` a single function to turn a Bearer token into `{ accountId, grantId }`.

**Non-Goals:**
- The `/mcp` endpoint and its tools (`add-mcp-server`).
- OAuth scopes: a grant means full access to what the user can do in the web app.
- UI/endpoint to list and revoke connections (the data model supports it; a follow-up can add it).
- Cognito Hosted UI, social login federation, MFA changes.
- CORS for browser-hosted MCP clients (e.g. MCP Inspector on localhost); server-side clients like claude.ai are unaffected.
- Any change to PATs, `/v1`, `ApiKeyAuthorizer`, or the existing Cognito token flow.

## Decisions

### D1. Authorization server is ours; Cognito only proves identity
Cognito has no DCR and no Hosted UI here, so it cannot be the MCP authorization server. The API exposes the OAuth endpoints; the user's identity comes from the existing Cognito session, presented as a normal Bearer to the two private `/oauth/authorize` calls.
*Alternatives:* (a) Cognito Hosted UI + app client per MCP client — needs a Cognito domain, manual pre-registration (claude.ai lets users type a client id, but that is a poor UX) and no `resource` support; (b) proxy pattern (our `/authorize` redirects to Cognito Hosted UI and exchanges its code) — more moving parts and duplicates the login page the web already has.

### D2. `authorization_endpoint` lives in `apps/web`; the API only has JSON endpoints
Metadata advertises `<WEB_APP_URL>/oauth/authorize`. The page calls the API's `GET`/`POST /oauth/authorize` (Cognito-authorized, CORS already allows the web origins) and navigates to the returned `redirectTo`. This reuses `@monorepo/ui`, the sign-in flow and the session in localStorage, and keeps the API free of HTML.
Two different things share the path `/oauth/authorize`: the web **page** and the API **JSON endpoint** (different origins). They are named identically on purpose because each is "the authorize step" on its side; docs must keep them apart.
*Alternative:* HTML served by a Lambda — duplicates login UI and styling.

### D3. Two-step authorize: validate (GET) then decide (POST)
The consent page needs the client name before the user decides, and denial must redirect only to a **validated** `redirect_uri`. `GET` validates and returns display data; `POST` re-validates (never trust the page) and returns `redirectTo` for either outcome. If validation fails at any step nothing is redirected.

### D4. Stateless DCR: `client_id` is a signed blob
`client_id = base64url(JSON{ v, ru:[…], cn, iat }) + "." + base64url(HMAC-SHA256(payload, MASTER_SECRET))`. Registration persists nothing (no abuse of storage by an unauthenticated endpoint), and every later endpoint verifies the signature and reads `redirect_uris` from the id itself. Redirect URIs are restricted to an allow-list (claude.ai / claude.com callbacks, configurable extras) plus `http` loopback (RFC 8252, any port/path). Because the blob is readable, `client_name` is only informational and is shown next to the redirect **host** in the consent page so it cannot silently impersonate a known app.
*Alternative:* persist clients in DynamoDB — permits revocation/listing of clients but needs cleanup and gives no extra safety since all clients are public + PKCE.

### D5. Own opaque tokens, decoupled from Cognito
Access `cs_mat_<random>` (1h) and refresh `cs_mrt_<random>` (30d, rotating). Only `HMAC-SHA256(masterSecret, token)` is stored (same technique as PATs). Rationale: the `CognitoAuthorizer` audience is the web client, so a Cognito token minted for MCP would also unlock every private route; a separate token type gives real audience separation, per-connection revocation, and refresh that does not depend on Cognito refresh tokens.
*Alternative:* pass through Cognito access/refresh tokens (needs a second app client and a direct password login on the API, and the tokens would be usable on private routes).

### D6. Data model (single table)
All items share the table; TTL attribute `expiresAt` is stored as epoch seconds on items that should self-delete. Because DynamoDB TTL deletion can lag by up to ~48h, expiry is also checked in code.

| Item | PK / SK | GSI1PK | Notes |
|---|---|---|---|
| Authorization code | `OAUTH_CODE#<hash(code)>` / same | — | `accountId`, `clientId`, `redirectUri`, `codeChallenge`, `expiresAt` (60s). Consumed with `DeleteItem … ReturnValues=ALL_OLD` (atomic single use). |
| Grant (connection) | `ACCOUNT#<id>` / `MCPGRANT#<grantId>` | — | `clientId`, `clientName`, `createdAt`, `revokedAt?`, `lastUsedAt?`. Supports future listing per account. |
| Token | `ACCOUNT#<id>` / `MCPTOKEN#<tokenId>` | `MCPTOKEN_HASH#<hash>` | `kind: access\|refresh`, `grantId`, `expiresAt`, `usedAt?` (refresh). Looked up by hash like PATs. |

### D7. Refresh rotation with reuse detection
Each refresh token is an item. Redeeming it does a conditional update `attribute_not_exists(usedAt)`; success issues a new access+refresh pair for the same grant. If the condition fails (token already used) the grant gets `revokedAt` set, which invalidates every token of that connection. Refresh also checks the account still exists. Authenticating an access token does one `GSI1` query plus one `GetItem` on the grant to honor revocation (two cheap reads per MCP request).

### D8. PKCE `S256` only, code TTL 60s, exact redirect match
`plain` is not advertised or accepted. Code is bound to `client_id`, `redirect_uri` and `code_challenge`; `/token` re-checks all three. Loopback URIs may differ only in port. An optional RFC 8707 `resource` parameter, when sent, must equal `<issuer>/mcp`.

### D9. Issuer and URLs come from configuration
`issuer` = `https://${API_DOMAIN_NAME}` when the custom domain is configured, otherwise the `execute-api` URL (from `!Ref HttpApi` in the function environment). `WEB_APP_URL` is a new per-stage env. Consequence accepted by the team: on the default `execute-api` host a recreated stack changes the issuer, so clients must reconnect.

### D10. OAuth-shaped errors and bodies
OAuth controllers return RFC 6749 errors (`{error, error_description}`) directly in `Controller.Response` instead of throwing `ApplicationError` (whose envelope is `{error:{code,message}}`). `lambdaBodyParser` learns `application/x-www-form-urlencoded` (and `isBase64Encoded`), needed by `/oauth/token`. Token responses set `Cache-Control: no-store`.

### D11. Web: `returnTo` support
`AuthGuard` (private, not signed in) redirects to `/sign-in?returnTo=<current path+query>`; `SignIn` navigates to a validated **same-origin relative** `returnTo` after success (ignored otherwise, to avoid open redirects); `AuthGuard` (public, signed in) also honors it before defaulting to `/`. The consent route sits under the private guard.

## Risks / Trade-offs

- **Phishing through the consent page / malicious DCR clients** → allow-list for redirect URIs; page shows client name **and** redirect host; PKCE + `state` mandatory; codes single-use, 60s.
- **Clickjacking of the Authorize button** → set `frame-ancestors 'none'` / `X-Frame-Options: DENY` for `/oauth/authorize` on the web hosting (verify how `apps/web` is served; tracked in tasks and Open Questions).
- **Tokens grant everything the user can do (no scopes)** → documented in the consent text; mitigations live in `add-mcp-server` (tool annotations, minimal tool set); connection revocation UI is a follow-up.
- **Stolen refresh token** → rotation + reuse detection revokes the grant; tokens hashed at rest.
- **Unauthenticated `register`/`token` endpoints** → stateless registration stores nothing; token endpoint rejects on cheap checks first; consider API Gateway throttling if abused.
- **Two reads per authenticated MCP call** → acceptable at expected volume; can denormalize revocation into token items later.
- **Issuer instability on the default `execute-api` domain** → set `API_DOMAIN_NAME` to get a stable issuer; otherwise reconnect after stack recreation.
- **TTL lag** → expiry always verified in code.

## Migration Plan

1. Add env vars (`WEB_APP_URL`, optional extra redirect URIs) per stage and pass `HttpApi` id/`API_DOMAIN_NAME` into the function environment for issuer computation.
2. Deploy API (new routes, items need no table change; GSI1 and TTL already exist). Deploy web (consent page, `returnTo`).
3. Verify with curl + a PKCE script (register → authorize via browser → token → refresh) and with MCP Inspector once `add-mcp-server` is deployed.
4. Rollback: remove the routes/page; issued tokens simply stop being usable. No data migration; existing sign-in, PATs and `/v1` are untouched.

## Open Questions

- How is `apps/web` hosted (S3+CloudFront?) and can it set `frame-ancestors` for `/oauth/authorize`?
- Extra redirect URIs to allow now besides claude.ai/claude.com and loopback (e.g. Cursor's custom scheme `cursor://…`)? Non-http(s) schemes are excluded until confirmed.
- Should `POST /oauth/token` get its own throttle settings in `serverless.yml`?
