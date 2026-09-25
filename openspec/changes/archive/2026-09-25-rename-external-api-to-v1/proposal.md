## Why

The API-key-authenticated partner API only had 2 routes under `/external/...`, mirroring specific internal concepts (`portal`, `submissions`). Adding endpoints to list a partner's own forms and to search published datasets brings it to 4 routes covering varied concepts — at that point it's the product's versioned public/partner API, not an "external appendix". Renaming the URL prefix to `/v1` communicates that correctly, and the two new endpoints close capability gaps partners already need (mirrors of the internal `GET /forms` and public `GET /portal/search`). This is a pre-launch rename: the feature has no real consumers yet and its manual smoke test was never completed.

## What Changes

- **BREAKING**: URL prefix for all API-key-authenticated routes changes from `/external/...` to `/v1/...`. No backward-compatible aliasing is kept (no real consumers yet).
- Internal file/folder names (`external.yml`, `main/functions/external/`, `application/controllers/external/`) are unchanged — they describe the auth mechanism (API key), not the exposed path.
- New endpoint `GET /v1/forms` — lists the API key's own account's forms, gated by the `data:read` scope. Mirrors the internal `GET /forms` (Cognito-authenticated) via the same `ListFormsUseCase`.
- New endpoint `GET /v1/portal/search` — searches published datasets, gated by the `portal:read` scope. Mirrors the public `GET /portal/search` via the same `AlgoliaGateway.search`.
- No new scopes: both new endpoints reuse the existing `ApiKeyScope.DATA_READ` / `ApiKeyScope.PORTAL_READ`.
- `GET /v1/portal/datasets/{formId}/data` now also returns the form's `questions` alongside `rows`, so callers can interpret each row's `answers[].questionId` without a separate call. (`GET /v1/submissions/{formId}` already returned `questions` and needed no change.)
- Manual smoke-test files (`apps/api/http/external.http`, `apps/api/http/external.curls.sh`) updated to the new `/v1` paths and extended with examples for the 2 new endpoints.

## Capabilities

### New Capabilities
- `external-forms-api`: API-key-gated listing of the key owner's own forms (`GET /v1/forms`, `data:read` scope).
- `external-dataset-search-api`: API-key-gated search of published datasets (`GET /v1/portal/search`, `portal:read` scope).

### Modified Capabilities
- `external-portal-data-api`: route path changes from `/external/portal/datasets/{formId}/data` to `/v1/portal/datasets/{formId}/data`; behavior (scope, data rules, pagination) is unchanged.
- `external-own-data-api`: route path changes from `/external/submissions/{formId}` to `/v1/submissions/{formId}`; behavior is unchanged.
- `api-key-authorization`: the authorizer now gates `/v1/*` routes instead of `/external/*` routes; the scope model gains no new scopes but now also covers the 2 new routes.

## Impact

- `apps/api/sls/functions/external.yml` — rewrite 2 existing `path:` values, add 2 new function blocks (same pattern: `handler` + `httpApi` + `authorizer: { name: ApiKeyAuthorizer }`).
- `apps/api/src/application/controllers/external/` — 2 new controllers (`ExternalListFormsController`, `ExternalSearchDatasetsController`) alongside the 2 existing, unchanged ones.
- `apps/api/src/main/functions/external/` — 2 new trivial Lambda entrypoints (`listForms.ts`, `searchDatasets.ts`).
- Reuses `ListFormsUseCase` (forms) and `AlgoliaGateway` (search) unchanged.
- `apps/api/http/external.http` / `external.curls.sh` (untracked manual smoke-test files) updated.
- No changes to `apps/api/serverless.yml` or the `ApiKeyAuthorizer` registration.
