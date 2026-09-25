## 1. Route configuration

- [x] 1.1 In `apps/api/sls/functions/external.yml`, change `getPortalDatasetData`'s `path` from `/external/portal/datasets/{formId}/data` to `/v1/portal/datasets/{formId}/data`
- [x] 1.2 In `apps/api/sls/functions/external.yml`, change `getOwnSubmissionData`'s `path` from `/external/submissions/{formId}` to `/v1/submissions/{formId}`
- [x] 1.3 Add `listForms` function block to `apps/api/sls/functions/external.yml`: `handler: src/main/functions/external/listForms.handler`, `httpApi` GET `/v1/forms`, `authorizer: { name: ApiKeyAuthorizer }`
- [x] 1.4 Add `searchDatasets` function block to `apps/api/sls/functions/external.yml`: `handler: src/main/functions/external/searchDatasets.handler`, `httpApi` GET `/v1/portal/search`, `authorizer: { name: ApiKeyAuthorizer }`

## 2. ExternalListFormsController

- [x] 2.1 Create `apps/api/src/application/controllers/external/ExternalListFormsController.ts`: `Controller<'apiKey', { forms: Form[] }>`, check `scopes.includes(ApiKeyScope.DATA_READ)` else `throw new NotAllowedError()`, call `ListFormsUseCase.execute({ accountId })`, return `{ statusCode: 200, body: { forms } }`
- [x] 2.2 Create `apps/api/src/main/functions/external/listForms.ts`: resolve `ExternalListFormsController` from `Registry` and wrap with `lambdaHttpAdapter`
- [x] 2.3 Create `apps/api/src/application/controllers/external/ExternalListFormsController.test.ts` mirroring `ExternalGetOwnFormDataController.test.ts`: (a) throws `NotAllowedError` when `DATA_READ` scope is missing; (b) happy path mocks `ListFormsUseCase.execute`, asserts it's called with `{ accountId }`, and asserts a `200` response with the returned forms

## 3. ExternalSearchDatasetsController

- [x] 3.1 Create `apps/api/src/application/controllers/external/ExternalSearchDatasetsController.ts`: `Controller<'apiKey', { results: AlgoliaGateway.DatasetRecord[] }>`, check `scopes.includes(ApiKeyScope.PORTAL_READ)` else `throw new NotAllowedError()`, `QueryParams = { q?: string; sort?: AlgoliaGateway.Sort }`, call `this.algoliaGateway.search(queryParams.q ?? '', queryParams.sort)`, return `{ statusCode: 200, body: { results } }`
- [x] 3.2 Create `apps/api/src/main/functions/external/searchDatasets.ts`: resolve `ExternalSearchDatasetsController` from `Registry` and wrap with `lambdaHttpAdapter`
- [x] 3.3 Create `apps/api/src/application/controllers/external/ExternalSearchDatasetsController.test.ts`: (a) throws `NotAllowedError` when `PORTAL_READ` scope is missing; (b) happy path mocks `AlgoliaGateway.search`, asserts it's called with `(q, sort)`, and asserts a `200` response with the returned results

## 4. Manual smoke-test files

- [x] 4.1 In `apps/api/http/external.http`, replace all `/external/...` paths with `/v1/...` and add request examples for `GET /v1/forms` and `GET /v1/portal/search?q=...`, including an insufficient-scope variant for each (matching the existing pattern for the other two endpoints)
- [x] 4.2 In `apps/api/http/external.curls.sh`, replace all `/external/...` paths with `/v1/...` and add curl examples for `GET /v1/forms` and `GET /v1/portal/search?q=...`, including an insufficient-scope variant for each

## 5. Include question definitions in published-dataset response

- [x] 5.1 In `ExternalGetPublishedFormDataController.ts`, inject `QuestionRepository`, fetch questions via `findByFormId(formId)` alongside the paginated query, strip `anonymizationSuggestion` from each, and return `{ statusCode: 200, body: { questions, rows, nextCursor } }`
- [x] 5.2 Update `ExternalGetPublishedFormDataController.test.ts` for the new constructor dependency and response shape, asserting `questions` is present and `anonymizationSuggestion` is stripped
- [x] 5.3 Add a `GET /v1/portal/datasets/{formId}/data` example to `external.http`/`external.curls.sh` if not already covered, noting the response now includes `questions`

## 6. Verification

- [x] 6.1 Run `pnpm --filter api typecheck`
- [x] 6.2 Run `pnpm --filter api test` and confirm all test files pass, including the updated published-dataset controller test
- [ ] 6.3 Run `pnpm --filter api deploy` and manually smoke test all 4 `/v1/*` routes against a real API key using the updated `.http`/`.curls.sh` files
