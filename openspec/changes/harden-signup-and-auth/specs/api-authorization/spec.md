## ADDED Requirements

### Requirement: Credentials of removed accounts are rejected
MCP access tokens and API keys SHALL be rejected when their account no longer exists.

#### Scenario: API key of a deleted account
- **WHEN** a request to `/v1` carries a valid, unrevoked key whose account was deleted
- **THEN** the authorizer denies it

### Requirement: OAuth clients follow the current redirect allowlist
The system SHALL re-validate the redirect URIs encoded in a stateless `client_id` against the current allowlist on every authorization.

#### Scenario: Redirect removed from the allowlist
- **WHEN** an extra redirect URI is removed from `MCP_OAUTH_EXTRA_REDIRECT_URIS` and a client registered with it starts an authorization
- **THEN** the authorization is rejected

### Requirement: Denials use 403
Ownership or scope denials SHALL respond with HTTP 403.

#### Scenario: API key without scope
- **WHEN** a key without `forms:write` calls `POST /v1/forms`
- **THEN** the response status is 403
