## ADDED Requirements

### Requirement: API key authenticates requests to `/external/*` routes
The system SHALL authenticate requests to any `/external/*` route via a Lambda REQUEST authorizer (`apiKeyAuthorizer`) registered in API Gateway, instead of the Cognito JWT authorizer used by private routes. The authorizer SHALL accept the raw key via an `Authorization: Bearer <key>` header or an `x-api-key` header, hash it, and look it up by hash.

#### Scenario: Missing or malformed key
- **WHEN** a request to an `/external/*` route has no `Authorization`/`x-api-key` header, or the value does not start with the `cs_sk_` prefix
- **THEN** the request is denied with an unauthorized response before reaching the controller

#### Scenario: Unknown, revoked, or expired key
- **WHEN** the key hash does not match any stored key, or the matched key has `revokedAt` set, or `expiresAt` is in the past
- **THEN** the request is denied with an unauthorized response

#### Scenario: Valid key, authorizer context propagated
- **WHEN** the key hash matches a non-revoked, non-expired key
- **THEN** the authorizer authorizes the request and the resolved `accountId` and `apiKeyId` are available to the downstream controller (not the Cognito JWT claim path)

### Requirement: Scope model gates route access independently per scope
API keys SHALL carry one or more scopes from `ApiKeyScope`: `portal:read` (existing) and `data:read` (new, grants read access to the key owner's own submission data). Each `/external/*` route SHALL declare the single scope it requires, and scopes are independent — holding one does not imply the other.

#### Scenario: Key with only `portal:read` calls the own-data endpoint
- **WHEN** a key whose scopes are `[portal:read]` is used to call the own-data endpoint (which requires `data:read`)
- **THEN** the request is denied with an unauthorized response

#### Scenario: Key with only `data:read` calls the portal endpoint
- **WHEN** a key whose scopes are `[data:read]` is used to call the portal-read endpoint (which requires `portal:read`)
- **THEN** the request is denied with an unauthorized response

#### Scenario: Key with both scopes
- **WHEN** a key's scopes are `[portal:read, data:read]`
- **THEN** the key is authorized to call both the portal-read endpoint and the own-data endpoint
