## Context

`AnonymizationEngine.hash()` (`apps/api/src/infra/services/AnonymizationEngine.ts:39-41`) pseudonymizes PII field values for the `pseudonymize` `piiStrategy` (and as the fail-safe fallback when `generalize` has no usable config) using:

```ts
createHmac('sha256', this.appConfig.secrets.exportSecret).update(value).digest('hex');
```

`exportSecret` is a single deployment-wide secret (`EXPORT_SECRET` env var, `apps/api/sls/config/env.yml`). It is the only input to the HMAC besides the raw value, so identical raw values (e.g. the same CPF) always produce the identical pseudonym hash, regardless of which form they were submitted to. Both forms' published datasets are independently retrievable from the public, unauthenticated portal (`GET /portal/datasets/{formId}/data`), so anyone can pull two datasets and join respondents by matching hash values — re-identifying people across unrelated forms even though each individual dataset looks pseudonymized.

`hash()` is invoked on read (not at submission time) from `resolve(question, value)`, whose only caller is `GetPublishedFormDataQuery.execute()`. `question` (type `@monorepo/shared/entities/Question`) already carries `formId`, so the scoping input is available without changing any caller.

## Goals / Non-Goals

**Goals:**
- Make pseudonym hashes unique per form: the same raw PII value must hash differently in form A than in form B.
- Keep hashes stable within a single form (same value → same hash on every read of that form's data), since that's what makes pseudonymization useful for intra-dataset analysis (e.g. counting distinct respondents in one dataset).
- Make the change self-contained in `AnonymizationEngine`, with no changes to callers, DB schema, or the public API contract.

**Non-Goals:**
- Not re-keying or touching `masterSecret` / API-key hashing (`CreateApiKeyUseCase`, `apiKeyAuthorizer.ts`) — unrelated secret, unrelated purpose.
- Not persisting or caching hashes — they remain computed on every read, as today.
- Not addressing re-identification via the `generalize` or plaintext strategies — those are unaffected by this change and out of scope.
- Not attempting to make old and new pseudonyms comparable — the whole point is that they stop being comparable across forms; no backfill/migration of past exports is in scope.

## Decisions

**1. Scope input: `question.formId`, not a parameter threaded from the query.**
`resolve(question, value)` already receives the full `Question` entity, which has `formId`. Reading `question.formId` inside `AnonymizationEngine` keeps the scoping local to the one class that owns hashing, and avoids widening `GetPublishedFormDataQuery`'s or any future caller's signature just to pass a value that's already reachable one hop away.

**2. Combine `formId` via key derivation, not string concatenation.**
`hash(value, formId)` computes:
```ts
const formKey = createHmac('sha256', this.appConfig.secrets.exportSecret).update(formId).digest();
return createHmac('sha256', formKey).update(value).digest('hex');
```
i.e. a per-form subkey derived once from the master `exportSecret` + `formId`, then used as the HMAC key for the value itself.

*Alternative considered*: concatenate into the message instead, e.g. `createHmac('sha256', exportSecret).update(`${formId}:${value}`)`. Rejected because it requires a separator to avoid ambiguous boundaries (`formId="1", value="23"` vs `formId="12", value="3"` collide without one), and mixing an identifier and a secret value into one message string is easy to get subtly wrong if the format ever changes. Two-step key derivation avoids the delimiter question entirely and cleanly separates "which form" (key derivation) from "what value" (the thing being hashed).

**3. `hash()` becomes `hash(value: string, formId: string)` — a required second parameter, not optional.**
Making `formId` required (rather than optional with a fallback to old behavior) ensures no call site can silently regress to the vulnerable global-hash behavior. Since `hash()` has exactly one caller (`applyToValue`, itself only called from `resolve`), this is a small, fully-traceable change.

## Risks / Trade-offs

- **[Risk]** Existing exported/cached datasets (if any consumer stored pseudonym values from before this change) become non-comparable to newly exported values for the same respondent. → **Mitigation**: this is the intended outcome (that cross-form comparability is the vulnerability being fixed); no consumer is known to persist these hashes today (computed on-read only), so no migration is needed. Flagged as **BREAKING** in the proposal for visibility.
- **[Risk]** Someone adds a new caller of `AnonymizationEngine.hash()`/`resolve()` later without realizing `formId` scoping matters. → **Mitigation**: `formId` is a required parameter (not defaulted), so TypeScript compilation fails fast if it's omitted.
- **[Trade-off]** One extra HMAC computation per value (key derivation step) versus a single HMAC. → Negligible cost (SHA-256 HMAC is sub-microsecond); no measurable impact on the paginated export endpoint.

## Migration Plan

No data migration. This is a pure computation-path change with no persisted state:
1. Update `AnonymizationEngine.hash()`/`applyToValue()`/`resolve()`.
2. Deploy `apps/api`. From that point on, `GET /portal/datasets/{formId}/data` returns form-scoped pseudonyms for every subsequent request — no backfill, no DB write, no downtime.
3. Rollback is a plain redeploy of the previous version if needed; no state to reconcile either direction.

## Open Questions

None — scope, approach, and blast radius are fully determined by the single existing call site.
