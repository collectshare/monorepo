## 1. Scope

- [x] 1.1 Add `FORMS_WRITE = 'forms:write'` to `packages/shared/enums/ApiKeyScope.ts`.
- [x] 1.2 Add `forms:write` as a selectable option in `apps/web/src/views/pages/ApiKeys/components/CreateApiKeyModal/index.tsx`'s `scopeOptions` (label + description, pt-BR, matching the existing two entries).

## 2. Create form (external)

- [x] 2.1 Add `application/controllers/external/ExternalCreateFormController.ts`: extends `Controller<'apiKey', ExternalCreateFormController.Response>`, `@Schema(createFormSchema)` (reuse from `application/controllers/form/schemas/createFormSchema`), checks `scopes.includes(ApiKeyScope.FORMS_WRITE)` → `NotAllowedError`, calls `CreateFormUseCase.execute({ ...body, accountId })`, returns `201` with `{ formId }`.
- [x] 2.2 Add `main/functions/external/createForm.ts` entrypoint (`Registry.getInstance().resolve(ExternalCreateFormController)` + `lambdaHttpAdapter`).
- [x] 2.3 Add route to `sls/functions/external.yml`: `POST /v1/forms` → `ApiKeyAuthorizer`.
- [x] 2.4 Add `ExternalCreateFormController.test.ts` covering: success (scope present, valid body), missing scope → not allowed, invalid body → validation error.

## 3. Update form details (external)

- [x] 3.1 Add `application/controllers/external/ExternalUpdateFormController.ts`: extends `Controller<'apiKey', void>`, `@Schema(updateFormSchema)` (reuse from `application/controllers/form/schemas/updateFormSchema`), checks `FORMS_WRITE` scope, calls `UpdateFormDetailsUseCase.execute({ formId: params.formId, accountId, ...body })`, returns `204`.
- [x] 3.2 Add `main/functions/external/updateForm.ts` entrypoint.
- [x] 3.3 Add route to `sls/functions/external.yml`: `PUT /v1/forms/{formId}` → `ApiKeyAuthorizer`.
- [x] 3.4 Add `ExternalUpdateFormController.test.ts` covering: success, missing scope, form owned by another account → not allowed, form not found → `ResourceNotFound`.

## 4. Maintain form questions (external)

- [x] 4.1 Add `application/controllers/external/ExternalInsertQuestionsInFormController.ts`: extends `Controller<'apiKey', void>`, `@Schema(insertQuestionsInFormSchema)` (reuse from `application/controllers/form/schemas/insertQuestionsInFormSchema`), checks `FORMS_WRITE` scope, calls `InsertQuestionsInFormUseCase.execute({ ...body, formId: params.formId, accountId })`, returns `204`.
- [x] 4.2 Add `main/functions/external/insertQuestionsInForm.ts` entrypoint.
- [x] 4.3 Add route to `sls/functions/external.yml`: `PUT /v1/forms/{formId}/questions` → `ApiKeyAuthorizer`, with `timeout: 15` (matches the internal route's timeout, since question insertion can invoke PII classification).
- [x] 4.4 Add `ExternalInsertQuestionsInFormController.test.ts` covering: success (create + update + implicit delete-by-omission), missing scope, empty `questions` array → validation error, form owned by another account → not allowed.

## 5. Docs

- [x] 5.1 Add the three new endpoints (method, path, required scope, request/response shape) to `apps/portal/src/views/pages/ApiDocs/endpoints.ts`.
- [x] 5.2 Update the scopes section of `apps/portal/src/views/pages/ApiDocs/index.tsx` to document `forms:write`.

## 6. Verification

- [x] 6.1 Run `pnpm --filter api typecheck`.
- [x] 6.2 Run the new and existing `apps/api` unit tests for the `external` controllers.
- [x] 6.3 Run `pnpm --filter web typecheck` and `pnpm --filter web lint` for the API-key modal change. (typecheck clean; lint has one pre-existing `simple-import-sort` error in this file, unrelated to this change's edit — not introduced here.)
- [x] 6.4 Run `pnpm --filter portal typecheck` and `pnpm --filter portal lint` for the docs page change.
