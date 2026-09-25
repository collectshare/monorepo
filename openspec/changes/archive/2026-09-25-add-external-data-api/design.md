## Context

The API key infrastructure (`ApiKeyRepository`, `apiKeyAuthorizer`, `ApiKeyScope`) already exists but was built ahead of any route using it: `apiKeyAuthorizer` is not registered as an `httpApi` authorizer in `serverless.yml`, and no route in `sls/functions/*.yml` references it. Separately, `lambdaHttpAdapter` only knows how to read `accountId` from a Cognito JWT authorizer's claims (`event.requestContext.authorizer.jwt.claims.internalId`); a Lambda REQUEST authorizer's context arrives at a different path (`event.requestContext.authorizer.lambda.*`), which the adapter does not read at all today.

Two existing, working code paths already implement the two behaviors this change needs, just gated by the wrong auth mechanism for this use case:
- `GetPublishedFormDataController` (public, no auth) — published-only, anonymized via `AnonymizationEngine`, cursor-paginated, capped at 100/page.
- `GetFormSubmissionsController` (private, Cognito JWT) — ownership-checked via `GetFormSubmissionsUseCase`, raw values, but only a flat `limit`, no cursor.

## Goals / Non-Goals

**Goals:**
- Wire the existing API key mechanism to real routes without redesigning it.
- Reuse the existing query/anonymization logic for both new endpoints rather than re-implementing it.
- Keep the two scopes (`portal:read`, `data:read`) fully independent — no hierarchy, no implicit grants.
- Raise the pagination ceiling to 1000/page for both new endpoints.

**Non-Goals:**
- Changing the public, unauthenticated `/portal/*` endpoints' behavior or limits (they stay at 100/page, unauthenticated, as-is).
- Rate limiting / usage metering per API key (flagged as a future concern, not in scope here).
- Revisiting `piiStrategy`/anonymization rules themselves — the own-data endpoint simply doesn't apply them, same as the existing dashboard read path.
- A generic "N route types" overhaul of `Controller`/adapters beyond what's needed to support one new API-key-authenticated request shape.

## Decisions

### Authorizer registration
Register `apiKeyAuthorizer` as a `request`-type `httpApi` authorizer in `provider.httpApi.authorizers` (alongside `CognitoAuthorizer`), with `identitySource` covering both `$request.header.Authorization` and `$request.header.x-api-key` (the authorizer already checks both headers defensively; the identity source just needs to cover whichever is actually sent so API Gateway calls the authorizer at all). Routes in `external.yml` reference it via `authorizer: { name: apiKeyAuthorizer }`, the same pattern used for `CognitoAuthorizer` in `apiKeys.yml`.

### Reading the API-key authorizer's context
Rather than overloading `lambdaHttpAdapter`'s single `accountId` extraction with a branch that guesses which authorizer shape is present, add a small, explicit read for the Lambda-authorizer shape (`event.requestContext.authorizer.lambda.accountId` / `.apiKeyId`) alongside the existing JWT-shape read. `Controller`'s `TRouteType` gains a third variant (e.g. `'apiKey'`) whose `Request` type carries `accountId: string` (same as `'private'`) plus `apiKeyId: string`, so the two new controllers can be typed precisely without loosening the existing `'public'`/`'private'` contracts.

**Alternative considered:** a fully separate adapter (`lambdaApiKeyAdapter`) mirroring `lambdaHttpAdapter` almost 1:1. Rejected for now — the duplication (body parsing, error handling, response shaping) outweighs the benefit of separation for a single differing field, but this is worth revisiting if a fourth auth mechanism shows up.

### Scope naming
New scope value: `ApiKeyScope.DATA_READ = 'data:read'`, following the existing `portal:read` naming convention (`resource:action`). Not `submissions:read` or `own:read` — `data:read` reads naturally as "your data" alongside `portal:read` as "the portal's data."

### Reusing existing query logic
- `external-portal-data-api` reuses `GetPublishedFormDataQuery` unchanged (it already anonymizes via `AnonymizationEngine.resolve` and already paginates via cursor) — the only difference at the controller level is the `MAX_LIMIT` constant (1000 instead of 100) and requiring the API-key auth instead of none.
- `external-own-data-api` reuses `GetFormSubmissionsUseCase`'s ownership check but requires extending `GetFormSubmissionsQuery` to accept a cursor (today it only takes a flat `limit` via `submissionRepository.findByFormIdPaginated`, discarding the `nextCursor` it already gets back). This is a genuine gap to close, not just plumbing — after this change, the private dashboard route could also adopt cursor pagination if desired, though that's not required by this change.

### Route shape
- `GET /external/portal/datasets/{formId}/data` — deliberately mirrors the public portal path structure (`/portal/datasets/{formId}/data` → `/external/portal/datasets/{formId}/data`) so the parallel is obvious.
- `GET /external/submissions/{formId}` — deliberately does NOT reuse the `datasets` word, to avoid implying it's the same public-dataset concept; it's the account's own submissions.

## Risks / Trade-offs

- **[Risk]** Raising the portal-shaped query's page size to 1000 for the API-key path increases per-request DynamoDB read cost and Lambda duration vs. the public 100-row ceiling. → Mitigation: this is an explicit, requested trade-off (integrators pulling bulk data), and DynamoDB `Limit` + pagination already bounds a single request's read cost predictably; no batching change needed.
- **[Risk]** Extending `GetFormSubmissionsQuery` to cursor pagination touches a query also used by the authenticated dashboard (`GetFormSubmissionsController`). → Mitigation: add the cursor as an optional input so the existing flat-`limit` call site keeps working unchanged; only the new controller passes a cursor.
- **[Risk]** Two independent scopes on one key means a compromised key only exposes what its scopes allow, but a key minted with both scopes exposes both the public-anonymized surface and the raw own-data surface. → Mitigation: this is inherent to the requested model (scopes are independent, not something this design should collapse into one), and matches how `CreateApiKeyController` already lets the caller choose an array of scopes per key.

## Migration Plan

No data migration. Deploy order:
1. Add `ApiKeyScope.DATA_READ` to the shared enum (additive, no break).
2. Register the authorizer in `serverless.yml` + wire the two routes in `external.yml`.
3. Ship the adapter/`Controller` support for the API-key request shape.
4. Ship the two controllers/use cases (portal-read reuse, own-data cursor extension).
5. Update the web app's API key creation UI to offer `DATA_READ` as a selectable scope.

Rollback is a plain revert — nothing here is destructive or migrates existing data.

## Open Questions

- Should the own-data endpoint's response include a `Content-Disposition`/CSV mode like `ExportPublishedFormDataController`, or is JSON-only sufficient for v1? (Assumed JSON-only for this change; CSV export via API key is a possible follow-up.)
- Should rate limiting / per-key usage metrics land in this change or a follow-up? (Assumed follow-up, per Non-Goals.)
