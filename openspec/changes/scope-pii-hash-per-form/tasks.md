## 1. Implement form-scoped hashing

- [x] 1.1 In `apps/api/src/infra/services/AnonymizationEngine.ts`, change `hash(value: string)` to `hash(value: string, formId: string)`: derive a per-form key via `createHmac('sha256', exportSecret).update(formId).digest()`, then compute `createHmac('sha256', formKey).update(value).digest('hex')`.
- [x] 1.2 Update `applyToValue()` to accept `formId` and pass it through to every `this.hash(v, formId)` call (both the array-map branch and the single-value branch).
- [x] 1.3 Update `resolve(question, value)` to pass `question.formId` into `applyToValue()` on both call paths (explicit `piiStrategy` and the classifier-flagged fallback).

## 2. Tests

- [x] 2.1 Added unit tests for `AnonymizationEngine` (`apps/api/src/infra/services/AnonymizationEngine.test.ts`) and `PiiHeuristics` (`apps/api/src/infra/services/PiiHeuristics.test.ts`), covering all `piiStrategy` types (`pseudonymize`, `generalize`, `suppress`), all `generalize` config types, the classifier-flagged fallback path, and per-form hash scoping (same value + same `formId` → same hash; same value + different `formId` → different hashes). No test framework existed in the monorepo, so Vitest was introduced in `apps/api` (`vitest.config.ts`, `vitest.setup.ts`, `pnpm test` / `pnpm test:watch`) — 40 tests pass.

## 3. Verify

- [x] 3.1 Run `pnpm --filter api typecheck` and confirm no other call sites of `AnonymizationEngine.hash()`/`applyToValue()`/`resolve()` were missed. Typecheck passes for `AnonymizationEngine.ts` and its only caller `GetPublishedFormDataQuery.ts` (3 unrelated pre-existing errors in `ProfileRepository.ts`, untouched by this change). Grep confirms `resolve()`'s only external caller is `GetPublishedFormDataQuery.ts:44`, called with the same 2-arg signature as before (formId now sourced internally from `question.formId`).
- [x] 3.2 Manually sanity-checked the exact key-derivation logic from `AnonymizationEngine.hash()` with a standalone Node script (apps/api has no local dev server): same raw value ("123.456.789-00") hashed with `formId="form-A"` vs `formId="form-B"` produced different hashes (PASS); hashing the same value+formId twice produced identical hashes (PASS — stable within a form).
