## Why

`AnonymizationEngine.hash()` (`apps/api/src/infra/services/AnonymizationEngine.ts:39-41`) pseudonymizes PII values (e.g. CPF) using a single global secret (`AppConfig.secrets.exportSecret`, the "master hash/secret") with no form-scoping: `createHmac('sha256', exportSecret).update(value).digest('hex')`. Because the same raw value always produces the same hash regardless of which form it was submitted to, anyone with access to two datasets exported from the public portal (`GET /portal/datasets/{formId}/data`) can join records across unrelated forms by matching identical pseudonym hashes — defeating the pseudonymization and re-identifying respondents. The hash must be scoped per form so the same CPF produces a different, non-joinable pseudonym in each form's dataset.

## What Changes

- **BREAKING**: `AnonymizationEngine.hash()` now mixes the form's id into the HMAC input alongside `exportSecret`, so pseudonymized values change for every form. Any previously exported/cached pseudonymized datasets become non-comparable to newly exported ones for the same respondent.
- `AnonymizationEngine.hash()` takes `formId` as an explicit input; `applyToValue`/`resolve` derive it from `question.formId`, which is already present on every `Question` passed into `resolve()` — no signature change needed at the `GetPublishedFormDataQuery` call site.
- No API contract, request/response shape, or client-facing behavior changes — `GET /portal/datasets/{formId}/data` returns the same shape, just with different (per-form) hash values for pseudonymized fields.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `question-anonymization-strategy`: the `pseudonymize` requirement's hash behavior changes from "hash PII values with a single deployment-wide secret" to "hash PII values with a secret scoped to the value's `formId`, so identical raw values in different forms never produce the same pseudonym." Affects the "Owner sets a pseudonymize strategy" and "Flagged question with no configured strategy" scenarios.

## Impact

- **Affected code**: `apps/api/src/infra/services/AnonymizationEngine.ts` (`hash`, `applyToValue`, `resolve`) only — `GetPublishedFormDataQuery.ts` and its controller are unaffected since `formId` is sourced from `question.formId`.
- **Not affected**: `AppConfig.secrets.masterSecret` / API-key hashing (`CreateApiKeyUseCase`, `apiKeyAuthorizer.ts`) — unrelated secret, out of scope.
- **Data impact**: pseudonym values for existing PII fields change after deploy; any downstream consumer that stored or diffed previous pseudonym hashes across forms will see new values (expected — that cross-form comparability is exactly what this change removes).
- **No new env vars, no schema/migration changes** — `exportSecret` continues to be the root secret; `formId` is mixed in at hash time, not stored.
