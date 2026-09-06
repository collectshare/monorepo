## Why

`feature/api` already contains a working Personal Access Token (PAT) system — API key CRUD, a Lambda request authorizer, and a web settings page — built for an earlier LGPD/external-submissions feature that never shipped. That branch never merged, so the code is dead, but the PAT mechanism itself (key issuance, hashing, revocation, request authorization) is generic and valuable on its own: it's the natural way to let account holders authenticate future programmatic access to the new portal (`/portal/*`) without exposing Cognito credentials. Recovering just the PAT primitive — and leaving behind the PII/anonymization/consent code it was originally built alongside — lets us stand up that capability now, ahead of any specific external-API use case that needs it.

## What Changes

- Recover and re-port from `feature/api` into `main`, adapted to the current codebase (post `feature/portal` merge):
  - `ApiKey` entity and `ApiKeyScope` enum in `packages/shared`.
  - `ApiKeyItem` + `ApiKeyRepository` (DynamoDB single-table access for API keys).
  - `CreateApiKeyUseCase` / `ListApiKeysUseCase` / `RevokeApiKeyUseCase` and their controllers, exposed as private (Cognito-authenticated) endpoints: `POST /api-keys`, `GET /api-keys`, `DELETE /api-keys/{keyId}`.
  - `apiKeyAuthorizer` — a Lambda request authorizer that validates a `cs_sk_...` bearer token against the stored key hash and rejects revoked/expired/out-of-scope keys — registered in Serverless but **not attached to any route yet**.
  - A web "API Keys" settings page (list, create with one-time secret reveal, revoke) plus its service layer, reachable from the account sidebar.
- Do **NOT** port: `GetExternalFormSubmissions*` (controller/use case/query), `AnonymizationEngine`, `ConsentRequiredError`, `GeneralizationConfig`, or any other LGPD/PII-handling code from `feature/api`. Those were built for a different, unrelated feature and are explicitly out of scope for this change.
- `/portal/*` public endpoints (`search`, `getPublishedForm`, `getPublishedFormData`) are **not modified** — they remain public and unauthenticated. This change only stands up the PAT issuance/validation infrastructure; wiring the authorizer to a protected route is a separate, future change.
- The recovered `ApiKeyScope` enum is trimmed to a generic starting scope (not the old `submissions:read`, which named the discarded PII feature) so it isn't semantically tied to functionality we're not bringing back.

## Capabilities

### New Capabilities
- `api-key-management`: account holders can create, list, and revoke Personal Access Tokens scoped to their account; the platform can authenticate an inbound request against a stored, hashed API key via a Lambda request authorizer.

### Modified Capabilities
_None — existing portal/search/public-access specs are unchanged by this proposal._

## Impact

- **apps/api**: new `apikeys` controllers/use cases/serverless functions (`sls/functions/apiKeys.yml`), new `external` authorizer function (`sls/functions/external.yml`, authorizer only — no protected route wired), new DynamoDB item/repository, `AppConfig` gains the HMAC signing secret used to hash keys.
- **packages/shared**: new `ApiKey` entity, new `ApiKeyScope` enum.
- **apps/web**: new `ApiKeys` settings page + `apiKeysService`, new sidebar entry.
- **No changes** to `apps/portal`, the `/portal/*` public API, or any dataset-search/publication behavior.
- **No PII/anonymization/consent code** is introduced by this change.
