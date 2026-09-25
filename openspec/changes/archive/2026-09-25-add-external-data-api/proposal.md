## Why

The API already has an API-key mechanism (`apiKeyAuthorizer`) and a `portal:read` scope, but neither is wired to any HTTP route — there is no way today for an integrator to pull dataset rows via API key. Separately, "API key access" was being treated as one undifferentiated thing, when in practice it covers two very different use cases: reading the same anonymized data the public portal already serves, and an account reading its own raw submission data programmatically. Splitting these into two scopes lets each follow the trust model it actually needs — anonymized-by-default for anything sourced from the public portal, raw for an account's own data.

## What Changes

- Wire `apiKeyAuthorizer` into API Gateway: register it as an `httpApi` authorizer in `serverless.yml` (it currently exists as a bare Lambda function with no authorizer registration or route referencing it).
- Add API-key-aware request handling to the Lambda HTTP adapter path: `lambdaHttpAdapter` only reads `accountId` from `authorizer.jwt.claims` (Cognito JWT shape); a Lambda REQUEST authorizer's context (`accountId`, `apiKeyId`) lives at `authorizer.lambda.*`, a different event shape. Introduce whatever adapter/`Controller` support is needed so a third request type (API-key-authenticated) can read that context.
- Add a new API key scope for reading an account's own submission data (raw, unanonymized), alongside the existing `portal:read` scope.
- Add `GET /external/portal/datasets/{formId}/data` — requires `portal:read`. Mirrors today's public `GET /portal/datasets/{formId}/data`: only serves `isPublished` forms, reuses `GetPublishedFormDataQuery` (anonymized via `AnonymizationEngine`), same cursor pagination shape, but with a higher page-size ceiling (up to 1000 rows/page instead of the portal's 100).
- Add `GET /external/submissions/{formId}` (own-data endpoint) — requires the new own-data scope. Checks `apiKey.accountId === form.accountId` (ownership, not `isPublished`). Reuses the existing `GetFormSubmissionsUseCase`/`GetFormSubmissionsQuery` business logic (raw values, no `AnonymizationEngine`), extended to support cursor-based pagination up to 1000 rows/page (today it only accepts a flat `limit`, no cursor).
- A key can hold both scopes simultaneously; they are independent, not hierarchical.

## Capabilities

### New Capabilities
- `api-key-authorization`: The API-key authentication mechanism for `/external/*` routes — Lambda authorizer wiring, scope model (`portal:read` + new own-data scope), and how a scope gates a given route.
- `external-portal-data-api`: The API-key-gated, anonymized, published-only dataset read endpoint under `/external/portal/*`.
- `external-own-data-api`: The API-key-gated, raw, ownership-checked dataset read endpoint under `/external/submissions/*`.

### Modified Capabilities
(none — no existing specs cover this area yet)

## Impact

- `apps/api/serverless.yml` — register `apiKeyAuthorizer` under `provider.httpApi.authorizers`.
- `apps/api/sls/functions/external.yml` — add the two new routes, both referencing the API-key authorizer.
- `apps/api/src/main/adapters/lambdaHttpAdapter.ts` (or a new adapter) — support reading `accountId`/`apiKeyId` from a Lambda REQUEST authorizer's context shape.
- `apps/api/src/application/contracts/Controller.ts` — possibly a third `TRouteType` (or equivalent) for API-key-authenticated requests.
- `packages/shared/enums/ApiKeyScope.ts` — add the new scope value.
- `apps/api/src/application/queries/GetFormSubmissionsQuery.ts` / `GetFormSubmissionsUseCase` — add cursor pagination (currently flat `limit` only), capped at 1000/page.
- `apps/api/src/application/queries/GetPublishedFormDataQuery.ts` — reused as-is for the portal-scoped endpoint; page-size ceiling raised for this call path (1000 vs the portal's 100).
- New controllers under `apps/api/src/application/controllers/external/` and functions under `apps/api/src/main/functions/external/`.
- `apps/web` — API key creation UI should let the account pick scopes (already supports an array; today only `PORTAL_READ` is offered by default).
