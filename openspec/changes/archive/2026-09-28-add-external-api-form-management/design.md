## Context

`apps/api` already has two parallel surfaces for forms:

1. **Private (Cognito-authenticated)** — `sls/functions/form.yml`, controllers under `application/controllers/form/`, backed by `CreateFormUseCase`, `UpdateFormDetailsUseCase`, `InsertQuestionsInFormUseCase`. `accountId` comes from the Cognito JWT `internalId` claim.
2. **External (API-key-authenticated, `apps/api` `/v1` routes)** — `sls/functions/external.yml`, controllers under `application/controllers/external/`, all currently **read-only** (`ExternalListFormsController`, `ExternalGetOwnFormDataController`, `ExternalGetPublishedFormDataController`, `ExternalSearchDatasetsController`). `accountId`, `apiKeyId`, and `scopes` come from `ApiKeyAuthorizer` (HMAC-validated `x-api-key` header), and every external controller extends `Controller<'apiKey', ...>` and checks `scopes.includes(ApiKeyScope.<X>)` before doing anything.

There is no write path in surface (2). The goal is to add one, without duplicating the form/question business rules that already live in the use cases consumed by surface (1).

## Goals / Non-Goals

**Goals:**
- Let an API key with the right scope create a form, update its details, and maintain its question set — the same operations a human can already do in the web app.
- Reuse `CreateFormUseCase`, `UpdateFormDetailsUseCase`, `InsertQuestionsInFormUseCase` as-is (no forking of validation, PII classification, or persistence logic).
- Gate the new capability behind a scope an account must explicitly grant to a key (`forms:write`), separate from the existing read scopes, so a read-only integration key can't be used to mutate forms.
- Preserve the account-ownership check pattern already used everywhere (`form.accountId !== accountId` → `NotAllowedError`).

**Non-Goals:**
- No submission-data writes (no external "submit a form" or "delete a submission" endpoint) — only form/question maintenance.
- No form deletion endpoint (none exists internally either; out of scope for this change).
- No changes to the private/Cognito form endpoints or their schemas.
- No change to how API keys are validated/hashed (`ApiKeyAuthorizer` is untouched).
- Not building a new scope-management UI in this change; the proposal only requires the scope to exist and be assignable. The web app's API-key creation form is a source list of scopes (see Open Questions).

## Decisions

**1. Reuse existing use cases directly instead of writing "external" variants.**
`CreateFormUseCase`, `UpdateFormDetailsUseCase`, and `InsertQuestionsInFormUseCase` are already framework-agnostic (they take plain input objects, not `Controller.Request`). The new external controllers just map `Controller.Request<'apiKey', ...>` to the same use-case input shape the private controllers already build. This mirrors how `ExternalListFormsController` reuses `ListFormsUseCase` unchanged.
*Alternative considered*: duplicate a "lite" use case for external callers to allow independent evolution of validation rules. Rejected — two code paths for the same domain rule (e.g., PII classification on question insert) would drift and is unnecessary duplication for a same-account, same-entity operation.

**2. New scope `ApiKeyScope.FORMS_WRITE = 'forms:write'`, checked per-controller like the existing scopes.**
Consistent with `ExternalListFormsController`'s `if (!scopes.includes(ApiKeyScope.DATA_READ)) throw new NotAllowedError()` pattern — no new authorization abstraction needed. A single `forms:write` scope covers all three new endpoints (create form, update form, maintain questions) rather than splitting into per-action scopes, since they're all "the caller manages this account's forms" and an integrator provisioning forms needs all three together.
*Alternative considered*: reuse `DATA_READ`/introduce a generic `DATA_WRITE`. Rejected — `DATA_READ` is documented/used for submission-data reads; conflating it with form-schema writes would make scope grants harder to reason about for the account owner.

**3. `PUT /v1/forms/{formId}/questions` for full-replace question maintenance (not `PATCH`/partial upsert).**
This matches the actual semantics of `InsertQuestionsInFormUseCase`: questions present in the payload are upserted (matched by optional `id`), and any existing question *not* included is deleted. Naming the route `PUT` (idempotent, full-resource-replace) is more honest to callers than `POST`, even though the internal private route uses `POST /forms/{formId}/questions` for the same use case — the internal route predates the `/v1` API's stricter naming and isn't being changed by this proposal.

**4. `accountId`, `apiKeyId`, `scopes` come from `ApiKeyAuthorizer` context exactly as today; no new authorizer changes.**
The Lambda authorizer already resolves and forwards these three fields for every `/v1/*` route. New routes simply attach the existing `ApiKeyAuthorizer`.

**5. Response/error shapes match the private controllers' conventions (201 for create, 204 for update/question-replace), and reuse the same error types (`ResourceNotFound`, `NotAllowedError`).**
No new error-handling branch in `lambdaHttpAdapter` is needed.

## Risks / Trade-offs

- **[Risk]** An account could grant `forms:write` on a key intended only for reads, widening blast radius if the key leaks → **Mitigation**: scopes are opt-in per key at creation time (`CreateApiKeyController`'s `scopes` array), off by default (`default([ApiKeyScope.PORTAL_READ])`); the account owner must explicitly select `forms:write`. Document this clearly in the public API docs.
- **[Risk]** `PUT .../questions` full-replace semantics are easy to misuse (omitting a question deletes it) → **Mitigation**: this is identical to the existing internal behavior the web app already relies on; document the "full replacement" contract explicitly in the `/v1` API docs page (`apps/portal`) and in the spec scenarios below.
- **[Risk]** Question insertion triggers PII classification (`QuestionAnonymizationClassifier`, potentially an LLM call) synchronously in the request path — external callers doing bulk form provisioning could hit the existing 15s Lambda timeout (`insertQuestionsInForm` already sets `timeout: 15` for this reason) → **Mitigation**: apply the same `timeout: 15` to the new external questions route; no new work needed since it's the same code path.
- **[Trade-off]** A single `forms:write` scope (vs. separate `forms:create`/`forms:update`) is coarser-grained → acceptable per Decision 2; can be split later if a real need for partial grants emerges (adding scopes is backward compatible).

## Migration Plan

No data migration. Deploy is additive:
1. Add `FORMS_WRITE` to `ApiKeyScope` enum (shared package — rebuild `packages/shared` consumers).
2. Add the three new controllers + Lambda entrypoints + `external.yml` routes.
3. `pnpm deploy` (`sls deploy --stage dev`) picks up new functions/routes automatically; no existing routes or infra change.
4. Rollback: remove the three routes/functions and revert the enum addition — no persisted state depends on the new scope value.

## Open Questions

- Should the web app's "create API key" UI (`apps/web`) be updated in this same change to list `forms:write` as a selectable scope, or is that a follow-up? (Leaning: include it — a scope nobody can select from the UI is only usable via direct API calls to `POST /api-keys`, which is awkward for real usage.)
- Does `POST /v1/forms` need to accept an idempotency key to make retries safe for integrators, given `CreateFormUseCase` has no dedupe logic today? (Leaning: out of scope — the internal endpoint has the same gap, and adding idempotency is a separate concern.)
