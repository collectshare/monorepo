## Why

The external `/v1` API (`apps/api/sls/functions/external.yml`) currently only lets integrators **read** data: list forms, fetch submission data, and search the portal. Partners who want to provision forms programmatically (e.g. syncing forms from an external system of record) must currently create and edit them through the authenticated web app, which requires a human with Cognito credentials. There is no API-key-authenticated path to create or maintain a form and its questions.

## What Changes

- Add a new `ApiKeyScope.FORMS_WRITE` scope (`forms:write`) so API keys can be granted creation/maintenance permissions independently of the existing read scopes (`portal:read`, `data:read`).
- Add external (API-key-authenticated), account-scoped endpoints under `/v1` that mirror the existing private form/question management flows, restricted to creation and maintenance (no submission-data or destructive account-wide operations):
  - `POST /v1/forms` — create a form.
  - `PUT /v1/forms/{formId}` — update a form's details (title, description, tags, flags). Full-replace semantics, matching the existing `UpdateFormDetailsUseCase`.
  - `PUT /v1/forms/{formId}/questions` — replace/maintain a form's question set (add, update, remove by omission), same semantics as the existing internal "insert questions" flow.
- These new endpoints reuse the existing `CreateFormUseCase`, `UpdateFormDetailsUseCase`, and `InsertQuestionsInFormUseCase` — no duplication of business logic, only new external controllers/routes and scope checks.
- Ownership enforcement: every write is scoped to the API key's `accountId` (from `ApiKeyAuthorizer`), identical to how `ExternalListFormsController` and the private form controllers already enforce account ownership.

## Capabilities

### New Capabilities
- `external-form-management`: API-key-authenticated endpoints for creating and maintaining forms and their questions, gated by a new `forms:write` scope.

### Modified Capabilities
- (none — `openspec/specs/` has no existing tracked capability for the external API surface yet, so this is additive)

## Impact

- **Affected code**:
  - `packages/shared/enums/ApiKeyScope.ts` — new `FORMS_WRITE` value.
  - `apps/api/sls/functions/external.yml` — three new routes behind `ApiKeyAuthorizer`.
  - `apps/api/src/application/controllers/external/` — new `ExternalCreateFormController`, `ExternalUpdateFormController`, `ExternalInsertQuestionsInFormController` (each checks `scopes.includes(ApiKeyScope.FORMS_WRITE)`, delegates to the existing use cases).
  - `apps/api/src/main/functions/external/` — new Lambda entrypoints wiring the controllers above.
  - `apps/api/src/application/controllers/apikeys/CreateApiKeyController.ts` (and its zod schema) — no logic change needed since scopes are already an open `z.nativeEnum(ApiKeyScope)` array, but the web UI for API key creation may want to surface the new scope as a selectable option.
- **Dependencies**: none new — reuses existing DynamoDB repositories, `Form`/`Question` entities, and the PII classification pipeline already invoked by `InsertQuestionsInFormUseCase`.
- **Docs**: the portal's public API docs page (`apps/portal`, added in a recent change) should document the three new endpoints and the `forms:write` scope.
