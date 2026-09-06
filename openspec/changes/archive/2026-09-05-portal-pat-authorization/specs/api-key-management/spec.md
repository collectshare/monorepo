## ADDED Requirements

### Requirement: Account holder can create a Personal Access Token
The system SHALL allow an authenticated account holder to create a Personal Access Token (API key) via `POST /api-keys`, accepting a `name` and returning the raw secret value exactly once, in the creation response only.

#### Scenario: Successful creation
- **WHEN** an authenticated account holder submits `POST /api-keys` with a `name`
- **THEN** the system creates a key record scoped to that account and responds with the key's id, its `keyPrefix`, and the full raw secret (`cs_sk_...`)

#### Scenario: Raw secret is never retrievable again
- **WHEN** an account holder later lists their keys
- **THEN** the response does not contain the raw secret for any key, only its `keyPrefix` and metadata

### Requirement: Only a hash of the key is persisted
The system SHALL NOT persist the raw API key value. It SHALL store only an HMAC hash of the key (plus a non-secret prefix for display) sufficient to look up and validate the key without recovering its plaintext.

#### Scenario: Stored record excludes the raw secret
- **WHEN** an API key is created
- **THEN** the persisted record contains `keyHash` and `keyPrefix` but no field containing the raw secret value

### Requirement: Account holder can list their Personal Access Tokens
The system SHALL allow an authenticated account holder to list their own API keys via `GET /api-keys`, scoped strictly to their account, returning each key's id, name, `keyPrefix`, scopes, creation date, and revocation/expiration status if set.

#### Scenario: Listing returns only the caller's own keys
- **WHEN** an authenticated account holder requests `GET /api-keys`
- **THEN** the system responds only with keys whose `accountId` matches the authenticated account, never another account's keys

### Requirement: Account holder can revoke a Personal Access Token
The system SHALL allow an authenticated account holder to revoke one of their own API keys via `DELETE /api-keys/{keyId}`, marking it revoked (not deleting the record) so a revoked key stops authenticating immediately.

#### Scenario: Revoking an owned key
- **WHEN** an authenticated account holder requests `DELETE /api-keys/{keyId}` for a key belonging to their account
- **THEN** the system marks the key's `revokedAt` timestamp and subsequent authorization attempts using that key fail

#### Scenario: Revoking another account's key is rejected
- **WHEN** an authenticated account holder requests `DELETE /api-keys/{keyId}` for a key belonging to a different account
- **THEN** the system responds with an error and does not modify the key

### Requirement: Request authorizer validates a bearer API key
The system SHALL provide a Lambda request authorizer that, given a request bearing a `cs_sk_...` token (via `Authorization: Bearer` or an `x-api-key` header), resolves it to the owning account by comparing its HMAC hash against stored keys, and denies the request if the key is missing, malformed, unknown, revoked, or expired.

#### Scenario: Valid, active key is authorized
- **WHEN** a request presents a `cs_sk_...` key that matches a stored, non-revoked, non-expired key's hash
- **THEN** the authorizer allows the request and exposes the key's `accountId` and `apiKeyId` in its context

#### Scenario: Revoked key is denied
- **WHEN** a request presents a key whose stored record has a `revokedAt` timestamp
- **THEN** the authorizer denies the request

#### Scenario: Expired key is denied
- **WHEN** a request presents a key whose stored `expiresAt` is in the past
- **THEN** the authorizer denies the request

#### Scenario: Unknown or malformed key is denied
- **WHEN** a request presents a token that does not start with the expected key prefix, or does not match any stored key's hash
- **THEN** the authorizer denies the request

#### Scenario: Missing credential is denied
- **WHEN** a request carries neither an `Authorization` header nor an `x-api-key` header
- **THEN** the authorizer denies the request without attempting a lookup

### Requirement: Authorizer infrastructure is registered without gating any endpoint
The system SHALL register the API key authorizer as deployable infrastructure without attaching it to any existing or new route, so that no endpoint's authentication behavior changes as a result of this capability.

#### Scenario: Public portal endpoints remain unauthenticated
- **WHEN** this capability is deployed
- **THEN** `GET /portal/search`, `GET /portal/datasets/{formId}`, and `GET /portal/datasets/{formId}/data` continue to accept unauthenticated requests exactly as before
