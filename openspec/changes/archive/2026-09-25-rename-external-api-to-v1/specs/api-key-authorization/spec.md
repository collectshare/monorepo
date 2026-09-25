## MODIFIED Requirements

### Requirement: API key authenticates requests to `/v1/*` routes
The system SHALL authenticate requests to any `/v1/*` route via a Lambda REQUEST authorizer (`apiKeyAuthorizer`) registered in API Gateway, instead of the Cognito JWT authorizer used by private routes. The authorizer SHALL accept the raw key via an `Authorization: Bearer <key>` header or an `x-api-key` header, hash it, and look it up by hash.

#### Scenario: Missing or malformed key
- **WHEN** a request to a `/v1/*` route has no `Authorization`/`x-api-key` header, or the value does not start with the `cs_sk_` prefix
- **THEN** the request is denied with an unauthorized response before reaching the controller

#### Scenario: Unknown, revoked, or expired key
- **WHEN** the key hash does not match any stored key, or the matched key has `revokedAt` set, or `expiresAt` is in the past
- **THEN** the request is denied with an unauthorized response

#### Scenario: Valid key, authorizer context propagated
- **WHEN** the key hash matches a non-revoked, non-expired key
- **THEN** the authorizer authorizes the request and the resolved `accountId` and `apiKeyId` are available to the downstream controller (not the Cognito JWT claim path)

### Requirement: Scope model gates route access independently per scope
API keys SHALL carry one or more scopes from `ApiKeyScope`: `portal:read` (gates published-data routes) and `data:read` (gates the key owner's own-data routes). Each `/v1/*` route SHALL declare the single scope it requires, and scopes are independent — holding one does not imply the other. The set of routes gated by each scope grows as new `/v1/*` routes are added, without introducing new scope values: `data:read` gates `GET /v1/submissions/{formId}` and `GET /v1/forms`; `portal:read` gates `GET /v1/portal/datasets/{formId}/data` and `GET /v1/portal/search`.

#### Scenario: Key with only `portal:read` calls a `data:read`-gated endpoint
- **WHEN** a key whose scopes are `[portal:read]` is used to call an endpoint that requires `data:read` (e.g. `GET /v1/submissions/{formId}` or `GET /v1/forms`)
- **THEN** the request is denied with an unauthorized response

#### Scenario: Key with only `data:read` calls a `portal:read`-gated endpoint
- **WHEN** a key whose scopes are `[data:read]` is used to call an endpoint that requires `portal:read` (e.g. `GET /v1/portal/datasets/{formId}/data` or `GET /v1/portal/search`)
- **THEN** the request is denied with an unauthorized response

#### Scenario: Key with both scopes
- **WHEN** a key's scopes are `[portal:read, data:read]`
- **THEN** the key is authorized to call all four `/v1/*` routes
