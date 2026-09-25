## Context

`apps/api/sls/functions/external.yml` declares the API-key-authenticated routes (authorizer: `ApiKeyAuthorizer`, a Lambda REQUEST authorizer). It currently has 2 routes under `/external/...`:

- `GET /external/portal/datasets/{formId}/data` → `ExternalGetPublishedFormDataController` (`portal:read`)
- `GET /external/submissions/{formId}` → `ExternalGetOwnFormDataController` (`data:read`)

Two more are being added, mirroring internal/public endpoints:

- `GET /v1/forms` → new `ExternalListFormsController` (`data:read`), reusing `ListFormsUseCase` (same one behind the Cognito-authenticated `ListFormsController`).
- `GET /v1/portal/search` → new `ExternalSearchDatasetsController` (`portal:read`), reusing `AlgoliaGateway.search` (same call behind the public `SearchDatasetsController`).

With 4 routes spanning "read a published dataset", "read my own submissions", "list my own forms", and "search datasets", `/external` no longer communicates what the prefix is for — this is the product's versioned partner/public API. The rename to `/v1` only touches the exposed HTTP path; the internal naming (`external.yml`, `main/functions/external/`, `application/controllers/external/`) stays as-is because it names the auth mechanism (API key), which hasn't changed.

The feature (`feat: add external data API`) has not shipped to any real consumer and its manual smoke test was never finished, so there's no need for a compatibility alias on `/external/*`.

## Goals / Non-Goals

**Goals:**
- Rename the 2 existing route paths from `/external/...` to `/v1/...`.
- Add `GET /v1/forms` and `GET /v1/portal/search`, reusing existing use cases/gateways with no behavior changes to them.
- Keep the scope model as-is: `data:read` gates "my own data" (submissions, forms); `portal:read` gates "published/portal data" (dataset data, search).

**Non-Goals:**
- No new `ApiKeyScope` values.
- No backward-compatible `/external/*` aliases or redirects.
- No pagination for `GET /v1/forms` (matches the existing internal `ListFormsController`/`ListFormsUseCase`, which is unpaginated today).
- No changes to `AlgoliaGateway`, `ListFormsUseCase`, `ApiKeyAuthorizer`, or `serverless.yml`.

## Decisions

**Route paths change, folder/file names don't.** `path:` strings in `external.yml` move to `/v1/...`; handlers stay at `src/main/functions/external/*.ts` and controllers at `src/application/controllers/external/*.ts`. Alternative considered: renaming the folders too (`controllers/v1/`) — rejected because the folder groups routes by *auth mechanism* (API key), and other API-key routes may be added later that aren't under `/v1` conceptually (e.g. future write endpoints); keeping `external/` as the "API key auth" bucket avoids coupling folder layout to a URL version string that may itself change again.

**New controllers are thin passthroughs, not new use cases.** `ExternalListFormsController` calls `ListFormsUseCase.execute({ accountId })` directly (same use case as the internal controller); `ExternalSearchDatasetsController` calls `AlgoliaGateway.search(q, sort)` directly (same call as the public controller). Alternative considered: extracting a shared handler/mixin across the internal and external controllers — rejected as premature; the external controllers differ only in their scope check and `Controller<'apiKey', ...>` typing, which is the same small amount of duplication the 2 existing external controllers already accept.

**`GET /v1/forms` returns the full `Form` entity, unfiltered.** Matches `ListFormsController`'s response shape exactly. No fields on `Form` are sensitive to the account that owns them, so no summarized/redacted DTO is introduced for this endpoint.

**No `/external/*` → `/v1/*` compatibility shim.** The prior prefix is deleted outright in the same change that adds it, rather than staged behind a deprecation window, because nothing consumes it yet.

**`GET /v1/portal/datasets/{formId}/data` gains a `questions` field, fetched independently rather than by changing the shared query.** Rows reference `answers[].questionId`, so a caller needs the question definitions to make sense of them. `GET /v1/submissions/{formId}` already returns `questions` (via `GetFormSubmissionsUseCase`), but the published-dataset endpoint didn't. The controller now injects `QuestionRepository` and calls `findByFormId` directly — the same call `GetFormSubmissionsQuery` makes — instead of adding `questions` to `GetPublishedFormDataQuery.Output`. That query also backs the public `GetPublishedFormDataController` (`GET /portal/datasets/{formId}/data`); the portal frontend already fetches questions once via the separate `GET /portal/datasets/{formId}` metadata call and merges them with paginated rows client-side, so growing every data page's payload there would be unrequested scope creep on a capability outside this change. `anonymizationSuggestion` is stripped from the returned questions, matching how `GetPublishedFormController` already treats that field for the same external-facing audience.

## Risks / Trade-offs

- [Any external party that already started integrating against `/external/*` during the pre-launch window silently breaks] → Acceptable per proposal: no known consumers exist yet, and the manual smoke test that would have been the first real caller was never completed.
- [`GET /v1/forms` has no pagination, so a very-high-form-count account gets a slow/large response] → Same limitation the internal `GET /forms` already has today; not a regression, and deferred until it's actually a problem for either.

## Migration Plan

1. Update `apps/api/sls/functions/external.yml`: change the 2 existing `path:` values to `/v1/...`, add the 2 new function blocks.
2. Add the 2 new controllers, 2 new Lambda entrypoints, and their tests.
3. Update the untracked manual smoke-test files (`apps/api/http/external.http`, `external.curls.sh`) to `/v1` paths and add cases for the 2 new endpoints.
4. `pnpm --filter api typecheck && pnpm --filter api test`.
5. `pnpm --filter api deploy` (redeploys the `httpApi` routes under the new paths; the old `/external/*` routes are removed by Serverless since they're no longer declared).
6. Manual smoke test against a real API key using the updated `.http`/`.curls.sh` files.

No rollback beyond re-deploying the previous `external.yml` is needed, since there are no consumers depending on the new `/v1` paths yet either.

## Open Questions

None — scope, paths, and reuse were confirmed by the user before this design was written.
