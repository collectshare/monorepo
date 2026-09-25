## 1. Scope model

- [x] 1.1 Add `DATA_READ = 'data:read'` to `packages/shared/enums/ApiKeyScope.ts`
- [x] 1.2 Update `CreateApiKeyController`'s schema/default handling if needed so `DATA_READ` can be requested (array already supports multiple scopes)
- [x] 1.3 Update `apps/web` API key creation UI to let the account pick `portal:read` and/or `data:read`

## 2. Authorizer wiring

- [x] 2.1 Register `apiKeyAuthorizer` under `provider.httpApi.authorizers` in `apps/api/serverless.yml` (type `request`, identitySource covering `Authorization` and `x-api-key` headers)
- [x] 2.2 Confirm `apiKeyAuthorizer`'s scope check can be parameterized per-route (or add a second check in each controller) so `portal:read` and `data:read` routes each enforce their own required scope

## 3. Adapter / Controller support for API-key requests

- [x] 3.1 Add a third `TRouteType` (e.g. `'apiKey'`) to `Controller` with a `Request` shape carrying `accountId: string` and `apiKeyId: string`
- [x] 3.2 Extend `lambdaHttpAdapter` (or add a parallel adapter) to read `accountId`/`apiKeyId` from `event.requestContext.authorizer.lambda.*` when that shape is present
- [x] 3.3 Add/adjust unit tests covering the new request-shape extraction

## 4. External portal-read endpoint

- [x] 4.1 Add `GET /external/portal/datasets/{formId}/data` to `apps/api/sls/functions/external.yml`, authorizer `apiKeyAuthorizer`
- [x] 4.2 Add `ExternalGetPublishedFormDataController` (or similarly named) under `apps/api/src/application/controllers/external/`, reusing `GetPublishedFormDataQuery`, checking `portal:read` scope, `isPublished` gate, `MAX_LIMIT = 1000`
- [x] 4.3 Add `apps/api/src/main/functions/external/getPortalDatasetData.ts` wiring the controller via `Registry`
- [x] 4.4 Tests: published form + valid scope returns anonymized page; unpublished/unknown form → not found; wrong scope → denied; page size capped at 1000; cursor continuation

## 5. Own-data endpoint

- [x] 5.1 Extend `GetFormSubmissionsQuery`/`GetFormSubmissionsUseCase` to accept an optional cursor and return `nextCursor`, without breaking the existing flat-`limit` dashboard call site
- [x] 5.2 Add `GET /external/submissions/{formId}` to `apps/api/sls/functions/external.yml`, authorizer `apiKeyAuthorizer`
- [x] 5.3 Add `ExternalGetOwnFormDataController` (or similarly named) under `apps/api/src/application/controllers/external/`, checking `data:read` scope and `apiKey.accountId === form.accountId`, raw values, `MAX_LIMIT = 1000`
- [x] 5.4 Add `apps/api/src/main/functions/external/getOwnSubmissionData.ts` wiring the controller via `Registry`
- [x] 5.5 Tests: owner + valid scope returns raw page (published or not); different account's key → not found; wrong scope → denied; page size capped at 1000; cursor continuation

## 6. Verification

- [x] 6.1 `pnpm typecheck` in `apps/api`
- [ ] 6.2 Manual smoke test both new routes against a deployed dev stage using a real API key (create via `/api-keys`, exercise both scopes)
- [x] 6.3 Confirm public `/portal/*` endpoints are unchanged (no regression to the 100-row ceiling or unauthenticated access)
