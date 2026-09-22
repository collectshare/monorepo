## Why

`GET /portal/datasets/{formId}/data` (`GetPublishedFormDataQuery`) serves raw `Answer.value` for every question of any published form to anyone, unauthenticated — the portal app has no auth context by design. There is currently no mechanism to keep a question's raw answers out of that public response, even for questions the system already flags as PII (`Question.anonymizationSuggestion.needsAnonymization`, shipped in a prior change). Publishing a form today means publishing 100% of its raw answer data.

## What Changes

- Add a per-question anonymization strategy (**partial anonymization**) that a form owner explicitly configures: `pseudonymize` (opaque HMAC hash), `generalize` (reduced-precision value, e.g. birthdate → year), `suppress` (value omitted), or `null` (no transformation). Only that question's values are affected; the rest of the submission row is unchanged.
- Add an automatic fallback (**total anonymization**) for questions where no strategy is configured but the existing PII classifier already flagged `needsAnonymization: true` — those values are pseudonymized by default rather than exported raw. This closes the gap where an owner forgets (or never gets to) configure a strategy for an obviously-PII question.
- Add a new `AnonymizationEngine` that applies whichever of the above resolves for a question, and wire it into `GetPublishedFormDataQuery` so the public portal data endpoint stops returning untransformed PII.
- Add a strategy selector to the FormBuilder question editor so owners can set/change `piiStrategy` (and `generalizationConfig` when `generalize` is chosen) per question.
- **BREAKING** (data shape, not API contract): existing published forms with PII-flagged questions will start returning pseudonymized values for those questions once this ships, instead of the raw values returned today. This is the intended fix, not a regression, but any existing portal consumer relying on raw values for a flagged question will see a value change.

## Capabilities

### New Capabilities
- `question-anonymization-strategy`: per-question `piiStrategy`/`generalizationConfig` configuration (partial anonymization), the automatic pseudonymize-by-default fallback for classifier-flagged questions with no configured strategy (total anonymization), and the `AnonymizationEngine` that applies either outcome to values served by the public portal data endpoint.

### Modified Capabilities
(none — no existing spec-level capability is being changed; `GetPublishedFormDataQuery`'s output values change as a result, but this is the first spec written for that endpoint's data-shaping behavior)

## Impact

- **Affected code**:
  - `packages/shared/entities/Question.ts` — adds `piiStrategy?: 'pseudonymize' | 'generalize' | 'suppress' | null` and `generalizationConfig?: GeneralizationConfig`.
  - `packages/shared/types/GeneralizationConfig.ts` — new type (`date_truncate` | `numeric_range` | `text_prefix` | `cep_region`).
  - `apps/api/src/infra/database/dynamo/items/QuestionItem.ts` — persists the two new attributes.
  - `apps/api/src/application/controllers/form/schemas/insertQuestionsInFormSchema.ts` — accepts the two new optional fields from the form editor.
  - `apps/api/src/infra/services/AnonymizationEngine.ts` — new service (hash, generalize, applyToValue).
  - `apps/api/src/application/queries/GetPublishedFormDataQuery.ts` — applies the engine to `answers[].value` before returning rows.
  - `apps/api/src/shared/config/AppConfig.ts` / `env.ts` — new `EXPORT_SECRET` secret for HMAC pseudonymization, separate from `MASTER_SECRET`.
  - `apps/web/src/views/pages/FormBuilder/components/FieldItem.tsx` (and related FormBuilder question-editing components) — strategy selector UI per question.
- **Out of scope** (explicitly not touched by this change, left for a separate effort): consent flow (`Form.requiresConsent`, `FormSubmission.consentGiven`), API key management, and an authenticated external `/v1/...` submissions API. These were designed together in `docs/prd-lgpd-external-api.md` on the unmerged `feature/api` branch, but only the anonymization-strategy piece is being brought to `main` here.
- **Infrastructure**: one new secret (`EXPORT_SECRET`) needs to be provisioned per stage; no DynamoDB schema/table changes (new attributes are optional on the existing `QuestionItem`).
- **Dependencies**: none new — HMAC via Node's built-in `crypto`, no external packages.
