## Context

`GetPublishedFormDataQuery` (`apps/api/src/application/queries/GetPublishedFormDataQuery.ts`) backs `GET /portal/datasets/{formId}/data`, the only data-serving endpoint of `apps/portal` — a fully public, unauthenticated app by design (per `CLAUDE.md`). It currently does:

```ts
answers: answers
  .filter(answer => !fileQuestionIds.has(answer.questionId))
  .map(answer => ({ questionId: answer.questionId, value: answer.value }))
```

`FILE`-type questions are already excluded entirely (their answers are filtered out, not returned). Every other question's `Answer.value` is returned exactly as submitted — including any question the PII classifier (`QuestionAnonymizationClassifier`/`PiiHeuristics`, shipped in a prior change) has already flagged via `Question.anonymizationSuggestion.needsAnonymization`.

A design (`docs/prd-lgpd-external-api.md`) and implementation (`AnonymizationEngine.ts`) for a related-but-broader LGPD compliance feature exist on the unmerged `feature/api` branch. That design bundles anonymization strategy with consent collection, API key management, and a new authenticated `/v1/...` export endpoint. None of `Question.piiStrategy`, `GeneralizationConfig`, `AnonymizationEngine`, or the consent/API-key surface exist on `main`. This change ports only the anonymization-strategy mechanics (its FR-1 and the value-transform part of FR-5) and retargets them at the endpoint that actually exists and actually needs it today: the public portal data endpoint.

## Goals / Non-Goals

**Goals:**
- Let a form owner configure, per question, how that question's values are transformed before being served by the public portal data endpoint (**partial anonymization**: `pseudonymize` | `generalize` | `suppress` | `null`).
- Guarantee that a question the classifier has already flagged as PII is never served raw just because the owner never configured a strategy (**total anonymization**: automatic pseudonymize fallback).
- Keep the transform deterministic and non-reversible without the server-held secret (HMAC-SHA256), matching the already-proven approach from `feature/api`'s `AnonymizationEngine`.

**Non-Goals:**
- Consent collection, API key management, an authenticated external export endpoint, or audit logging — all explicitly deferred (see proposal's Impact/Out of scope).
- Changing `apps/web`'s authenticated views of a form owner's own data (`/forms/{id}` in `apps/web`, the CSV export, etc.) — this change only affects what the **public portal** serves. An account owner viewing their own dashboard continues to see raw values; anonymization applies only at the public-facing boundary.
- Re-anonymizing already-served data or invalidating cached portal responses — out of scope; this only changes the query's output going forward.
- Multi-secret rotation strategy for `EXPORT_SECRET` (the proposal's Risks section notes the trade-off but rotation tooling is not part of this change).

## Decisions

### 1. Two-mode resolution order: partial (explicit) beats total (automatic)
For each answer, resolve the effective strategy as:
1. If `Question.piiStrategy` is set (`pseudonymize` | `generalize` | `suppress`) → use it (**partial**, owner's explicit choice).
2. Else if `Question.anonymizationSuggestion?.needsAnonymization === true` → use `pseudonymize` (**total**, automatic fallback).
3. Else → no transform, value passes through unchanged.

This reuses the classifier signal already computed and persisted at question-save time (`InsertQuestionsInFormUseCase`) instead of re-running regex detection at read time, as `feature/api`'s engine did. It is strictly better: the existing classifier already combines a keyword heuristic, a content-hash cache, and an LLM call, not just three regexes for CPF/e-mail/phone.

### 2. Fixing a latent bug from the `feature/api` reference implementation
In `feature/api`'s `AnonymizationEngine.applyToValue`, if `piiStrategy === 'generalize'` but `generalizationConfig` is missing, none of the strategy branches match and the value falls through **unchanged** — i.e. a misconfigured "generalize" question silently exports raw PII. This design closes that hole two ways:
- **Write-time**: the question-save schema (`insertQuestionsInFormSchema.ts`) requires `generalizationConfig` whenever `piiStrategy === 'generalize'` (zod `.refine`), so the inconsistent state shouldn't be persisted.
- **Read-time (defense in depth)**: `AnonymizationEngine.applyToValue` treats `generalize` with a missing/invalid config as a resolution failure and falls back to `pseudonymize` rather than passing the raw value through. A transform is applied to already-flagged-PII questions.

### 3. `AnonymizationEngine` shape
Same core as `feature/api`'s version (hash via `createHmac('sha256', exportSecret)`, `generalize()` switch over `GeneralizationConfig.type` including the static `STATE_BY_CEP_PREFIX` table for `cep_region`), collapsed into one `resolve(question, value)` entry point that implements Decision 1 and Decision 2, instead of exposing the three-way `piiStrategy` branching to the caller. `GetPublishedFormDataQuery` calls `engine.resolve(question, answer.value)` per answer — it does not need to know about the fallback logic itself.

`FILE`-type questions are not passed to the engine at all — `GetPublishedFormDataQuery` already filters their answers out before this point (Decision predates this change; unaffected).

### 4. Secret: new `EXPORT_SECRET`, separate from `MASTER_SECRET`
`MASTER_SECRET` is already used for a different purpose (API-key hashing groundwork from prior work). Reusing it for value pseudonymization would couple two rotation schedules with different risk profiles (per `feature/api`'s PRD rationale, which this design agrees with). Add `EXPORT_SECRET` to `env.ts` (zod-validated, required) and `AppConfig.secrets.exportSecret`, following the existing `masterSecret` pattern exactly.

### 5. `GetPublishedFormDataQuery` wiring
The query already loads all `questions` for the form (currently only to build `fileQuestionIds`). Change it to build a `Map<questionId, Question>` instead, and use that map both for the existing FILE filter and to resolve each answer's transform via the engine. No new repository calls.

### 6. FormBuilder UI
A per-question "Anonymização" selector (reusing `@monorepo/ui` `Select`) with four options mapping 1:1 to `piiStrategy`. Selecting "Generalizar" reveals a secondary control for `generalizationConfig` (`type` + its type-specific field — precision, step, chars). No new design-system components required.

## Risks / Trade-offs

- **[Risk]** `EXPORT_SECRET` rotation invalidates previously-shared pseudonymized values (a portal consumer that stored a hash for correlation loses the ability to match new exports against old ones) → **Mitigation**: documented as a known trade-off, matching `feature/api`'s PRD; rotation tooling is explicitly out of scope for this change (Non-Goals) and can be revisited if/when the broader LGPD effort is ported.
- **[Risk]** Deterministic HMAC pseudonymization of low-entropy values (e.g. a `TEXT` CPF field) is technically a keyed hash, not full anonymization — anyone with `EXPORT_SECRET` (or who brute-forces a small input space without it, though HMAC resists this far better than plain SHA-256) can still correlate values → **Mitigation**: this is an accepted, standard trade-off already made in the `feature/api` design; `generalize`/`suppress` remain available for owners who need stronger guarantees on specific fields, and this change doesn't change that calculus.
- **[Risk]** **BREAKING** data-shape change: any existing portal consumer depending on raw values for a question the classifier flags will see pseudonymized/generalized/suppressed values after deploy → **Mitigation**: called out explicitly in the proposal; this is the intended fix for a live PII exposure, not an incidental regression. No feature flag is planned — the whole point is that PII-flagged questions must never be served raw.
- **[Trade-off]** The automatic "total" fallback always uses `pseudonymize`, never `suppress` or `generalize` — a classifier-flagged question with no explicit strategy will still be present (as a hash) rather than fully removed. This favors keeping the endpoint's response shape stable (same keys always present) over maximizing conservatism. An owner who wants a flagged field fully removed still has to explicitly pick `suppress`.

## Migration Plan

1. Add `EXPORT_SECRET` to the stage's Serverless env config (`sls/config/env.yml`) and `env.ts`/`AppConfig` — additive, no behavior change until read.
2. Add `piiStrategy`/`generalizationConfig` to `Question` (shared), `QuestionItem` (DynamoDB attrs — optional, no migration needed for existing items), and `insertQuestionsInFormSchema.ts`.
3. Add `AnonymizationEngine` (no callers yet — inert).
4. Wire the engine into `GetPublishedFormDataQuery` — this is the step that actually changes public output; deploy this only after `EXPORT_SECRET` is confirmed present in the target stage (a missing/empty secret would fail `env.ts`'s zod validation at Lambda cold start, which is an acceptable fail-closed behavior rather than silently skipping anonymization).
5. Add the FormBuilder strategy selector UI last — owners can begin configuring `piiStrategy` only once the backend already enforces it end-to-end.
6. Rollback: each step is independently revertible; reverting step 4 alone restores today's raw-output behavior (fail open, not recommended) while keeping the schema/UI additions inert.

## Open Questions

- Should `GetPublishedFormController`'s form-metadata response (not the data endpoint) expose each question's resolved `piiStrategy` to portal consumers, so they know which columns are transformed? Not required for correctness, but likely useful UX for the portal's dataset page. Left for a follow-up rather than blocking this change.
- Whether `apps/web`'s CSV/export flows (a form owner exporting their own data) should also respect `piiStrategy` — this design intentionally leaves the owner's own authenticated view untouched (Non-Goals), but the product may want that revisited separately.
