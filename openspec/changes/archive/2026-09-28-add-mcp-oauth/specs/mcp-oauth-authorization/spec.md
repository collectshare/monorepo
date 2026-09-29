## ADDED Requirements

### Requirement: Protected resource metadata is published
The system SHALL expose unauthenticated `GET /.well-known/oauth-protected-resource` and `GET /.well-known/oauth-protected-resource/mcp` (RFC 9728) returning JSON with `resource` (the absolute URL of the MCP endpoint, `<issuer>/mcp`) and `authorization_servers` (containing the issuer URL).

#### Scenario: Client fetches protected resource metadata
- **WHEN** an unauthenticated client calls `GET /.well-known/oauth-protected-resource/mcp`
- **THEN** the system returns `200` with `resource` equal to `<issuer>/mcp` and `authorization_servers` containing `<issuer>`

### Requirement: Authorization server metadata is published
The system SHALL expose unauthenticated `GET /.well-known/oauth-authorization-server` (RFC 8414) returning `issuer`, `authorization_endpoint` (the web app consent page URL, `<web-app-url>/oauth/authorize`), `token_endpoint`, `registration_endpoint`, `response_types_supported: ["code"]`, `grant_types_supported: ["authorization_code", "refresh_token"]`, `code_challenge_methods_supported: ["S256"]` and `token_endpoint_auth_methods_supported: ["none"]`.

#### Scenario: Client fetches authorization server metadata
- **WHEN** an unauthenticated client calls `GET /.well-known/oauth-authorization-server`
- **THEN** the system returns `200` with the fields above, where `issuer`, `token_endpoint` and `registration_endpoint` use the configured issuer URL

#### Scenario: Only S256 is advertised
- **WHEN** a client reads `code_challenge_methods_supported`
- **THEN** it contains `S256` and does not contain `plain`

### Requirement: Clients can register dynamically and statelessly
The system SHALL expose unauthenticated `POST /oauth/register` (RFC 7591) accepting `redirect_uris` (required, non-empty) and optional `client_name`. Every redirect URI MUST be either `https://claude.ai/api/mcp/auth_callback`, `https://claude.com/api/mcp/auth_callback`, another URI in the configured allow-list, or an `http` loopback URI (`localhost`, `127.0.0.1`, `[::1]`, any port and path). On success the system SHALL return `201` with a `client_id` that is a signed value encoding the registered `redirect_uris` and `client_name`, echo `redirect_uris`, `client_name`, `grant_types`, `response_types` and `token_endpoint_auth_method: "none"`, and SHALL NOT persist anything.

#### Scenario: Register a claude.ai client
- **WHEN** a client posts `redirect_uris: ["https://claude.ai/api/mcp/auth_callback"]` to `POST /oauth/register`
- **THEN** the system returns `201` with a `client_id` and the same `redirect_uris`

#### Scenario: Register a loopback client
- **WHEN** a client posts `redirect_uris: ["http://localhost:53682/callback"]`
- **THEN** the system returns `201` with a `client_id`

#### Scenario: Redirect URI outside the allow-list
- **WHEN** a client posts `redirect_uris: ["https://evil.example/cb"]`
- **THEN** the system returns `400` with error `invalid_redirect_uri` and issues no `client_id`

#### Scenario: Tampered client_id
- **WHEN** a `client_id` whose signature does not verify is later presented to any OAuth endpoint
- **THEN** the system rejects it as `invalid_client`

### Requirement: Authorization requests are validated before any consent is shown
The system SHALL expose `GET /oauth/authorize` behind the Cognito authorizer that validates `client_id`, `redirect_uri` (exact match with one registered `redirect_uri`; loopback URIs may differ only in port), `response_type=code`, `code_challenge` with `code_challenge_method=S256`, and, when present, `resource` (which MUST equal the MCP resource URL). On success it SHALL return the client's display name and the redirect URI's host so the consent page can render them. On failure it SHALL return an error and MUST NOT indicate that the caller be redirected to the unvalidated `redirect_uri`.

#### Scenario: Valid authorization request
- **WHEN** an authenticated user's consent page calls `GET /oauth/authorize` with a valid `client_id`, matching `redirect_uri`, `response_type=code` and an `S256` `code_challenge`
- **THEN** the system returns `200` with the client's name and redirect host

#### Scenario: Unregistered redirect URI
- **WHEN** `redirect_uri` does not match any URI registered in the `client_id`
- **THEN** the system returns `400` `invalid_request` and the consent page shows an error without redirecting

#### Scenario: Missing or plain PKCE
- **WHEN** `code_challenge` is absent or `code_challenge_method` is not `S256`
- **THEN** the system returns `400` `invalid_request`

#### Scenario: Unauthenticated caller
- **WHEN** `GET /oauth/authorize` is called without a valid Cognito access token
- **THEN** the API Gateway rejects it as unauthorized

#### Scenario: Wrong resource indicator
- **WHEN** the request carries a `resource` that is not the MCP resource URL
- **THEN** the system returns `400` `invalid_target`

### Requirement: The logged-in user explicitly approves or denies access
The system SHALL expose `POST /oauth/authorize` behind the Cognito authorizer accepting the same parameters as the validation step plus `state` and `decision` (`approve` or `deny`). It SHALL re-validate all parameters. On `approve` it SHALL create a single-use authorization code bound to the caller's `accountId`, `client_id`, `redirect_uri` and `code_challenge`, valid for 60 seconds, and return `redirectTo` = `redirect_uri` with `code` and `state` query parameters. On `deny` it SHALL return `redirectTo` = `redirect_uri` with `error=access_denied` and `state`.

#### Scenario: User approves
- **WHEN** an authenticated user posts `decision: "approve"` with valid parameters
- **THEN** the system stores a code valid for 60 seconds bound to that user's `accountId`, `client_id`, `redirect_uri` and `code_challenge`, and returns `redirectTo` containing `code` and the original `state`

#### Scenario: User denies
- **WHEN** an authenticated user posts `decision: "deny"` with valid parameters
- **THEN** the system creates no code and returns `redirectTo` containing `error=access_denied` and the original `state`

#### Scenario: Invalid parameters on decision
- **WHEN** the posted parameters fail validation
- **THEN** the system returns `400` and creates no code

### Requirement: Authorization codes are exchanged for tokens with PKCE
The system SHALL expose unauthenticated `POST /oauth/token` accepting `application/x-www-form-urlencoded` (and JSON) with `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id` and `code_verifier`. It SHALL atomically consume the code (single use), verify it has not expired, that `client_id` and `redirect_uri` match those bound to the code, and that `BASE64URL(SHA256(code_verifier))` equals the stored `code_challenge`. On success it SHALL create a grant (one per connection) and return `200` with `access_token`, `token_type: "Bearer"`, `expires_in` (3600) and `refresh_token`, with `Cache-Control: no-store`. Errors SHALL use the RFC 6749 shape `{ "error": "...", "error_description": "..." }` with status `400` (`401` for `invalid_client`).

#### Scenario: Successful exchange
- **WHEN** a client posts a valid, unexpired code with the matching `code_verifier`, `client_id` and `redirect_uri`
- **THEN** the system returns `200` with an access token, a refresh token, `token_type: "Bearer"` and `expires_in: 3600`

#### Scenario: Wrong code_verifier
- **WHEN** the `code_verifier` does not hash to the stored `code_challenge`
- **THEN** the system returns `400` `invalid_grant` and the code is no longer usable

#### Scenario: Code reuse
- **WHEN** a code that was already exchanged is presented again
- **THEN** the system returns `400` `invalid_grant`

#### Scenario: Expired code
- **WHEN** a code older than 60 seconds is presented
- **THEN** the system returns `400` `invalid_grant`

#### Scenario: Mismatched redirect_uri or client_id
- **WHEN** the presented `redirect_uri` or `client_id` differs from the values bound to the code
- **THEN** the system returns `400` `invalid_grant`

#### Scenario: Unsupported grant type
- **WHEN** `grant_type` is neither `authorization_code` nor `refresh_token`
- **THEN** the system returns `400` `unsupported_grant_type`

### Requirement: Refresh tokens rotate and detect reuse
The system SHALL accept `grant_type=refresh_token` at `POST /oauth/token`. A valid refresh token SHALL be marked used and replaced by a new access token and a new refresh token (30-day lifetime) belonging to the same grant. Presenting a refresh token that was already used SHALL revoke the whole grant, invalidating its access and refresh tokens. Refresh SHALL fail if the grant is revoked or the account no longer exists.

#### Scenario: Successful refresh
- **WHEN** a client presents an unused, unexpired refresh token
- **THEN** the system returns `200` with a new access token and a new refresh token, and the presented refresh token can no longer be used

#### Scenario: Refresh token reuse
- **WHEN** a refresh token that was already exchanged is presented again
- **THEN** the system returns `400` `invalid_grant` and revokes the grant so that its other tokens stop working

#### Scenario: Account no longer exists
- **WHEN** the refresh token belongs to a grant whose account no longer exists
- **THEN** the system returns `400` `invalid_grant`

### Requirement: MCP tokens are opaque, hashed at rest and isolated from other credentials
The system SHALL generate access and refresh tokens as high-entropy random opaque strings with distinct prefixes (`cs_mat_` and `cs_mrt_`), store only their HMAC-SHA256 (keyed with the master secret), and give access tokens a 1-hour lifetime. Access-token authentication SHALL resolve a raw token to `{ accountId, grantId }` only when the token exists, is unexpired and its grant is not revoked. MCP tokens SHALL NOT be accepted by the Cognito JWT authorizer or the `/v1` API-key authorizer, and Cognito tokens or `cs_sk_` API keys SHALL NOT authenticate as MCP tokens.

#### Scenario: Valid access token resolves to the account
- **WHEN** an unexpired access token of a non-revoked grant is authenticated
- **THEN** the service returns the grant's `accountId` and `grantId`

#### Scenario: Expired access token
- **WHEN** an access token older than one hour is authenticated
- **THEN** the service returns no identity

#### Scenario: Revoked grant
- **WHEN** an access token whose grant is revoked is authenticated
- **THEN** the service returns no identity

#### Scenario: Other credential types are not MCP tokens
- **WHEN** a `cs_sk_` API key or a Cognito access token is authenticated as an MCP token
- **THEN** the service returns no identity

### Requirement: The web app provides a login-backed consent page
`apps/web` SHALL provide a `/oauth/authorize` page that reads the OAuth request parameters from the query string. If the user has no session it SHALL send them to the existing sign-in and, after a successful sign-in, return to the same `/oauth/authorize` URL with the original query string. Once signed in it SHALL call `GET /oauth/authorize`, display the client name, the redirect host and that access covers the user's forms and datasets, and offer **Authorize** and **Cancel**. On validation error it SHALL display the error and MUST NOT redirect.

#### Scenario: Signed-out user is asked to log in and returns
- **WHEN** a signed-out user opens `/oauth/authorize?...`
- **THEN** they are taken to sign-in, and after signing in are returned to `/oauth/authorize?...` with the same parameters

#### Scenario: Signed-in user sees consent directly
- **WHEN** a signed-in user opens a valid `/oauth/authorize?...`
- **THEN** the page shows the client name and redirect host with Authorize and Cancel buttons

#### Scenario: Authorize
- **WHEN** the user clicks Authorize
- **THEN** the page posts `decision: "approve"` and navigates the browser to the returned `redirectTo`

#### Scenario: Cancel
- **WHEN** the user clicks Cancel
- **THEN** the page posts `decision: "deny"` and navigates the browser to the returned `redirectTo` carrying `error=access_denied`

#### Scenario: Invalid request
- **WHEN** validation fails (for example an unregistered redirect URI)
- **THEN** the page shows an error message and does not navigate away
