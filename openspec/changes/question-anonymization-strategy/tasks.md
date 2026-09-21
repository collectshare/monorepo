## 1. Export secret configuration

- [x] 1.1 Add `EXPORT_SECRET` to `apps/api/src/shared/config/env.ts` (zod, required, `min(1)`)
- [x] 1.2 Add `secrets.exportSecret` to `apps/api/src/shared/config/AppConfig.ts`, following the existing `masterSecret` pattern
- [x] 1.3 Add `EXPORT_SECRET` to the stage's Serverless env config (`apps/api/sls/config/env.yml`) and any local `.env`/dev defaults used for `pnpm typecheck`/local tooling (`.env` already had it)

## 2. Shared types and entity

- [x] 2.1 Create `packages/shared/types/GeneralizationConfig.ts` (`date_truncate` year/month, `numeric_range` step, `text_prefix` chars, `cep_region` state/ddd)
- [x] 2.2 Add `piiStrategy?: 'pseudonymize' | 'generalize' | 'suppress' | null` and `generalizationConfig?: GeneralizationConfig` to `packages/shared/entities/Question.ts` (constructor + `Attributes` type)

## 3. Persistence

- [x] 3.1 Add `piiStrategy`/`generalizationConfig` attributes to `apps/api/src/infra/database/dynamo/items/QuestionItem.ts` (`Attributes`, `fromEntity`, `toEntity`)
- [x] 3.2 Add `piiStrategy`/`generalizationConfig` to `insertQuestionsInFormSchema.ts`, with a zod `.refine` rejecting `piiStrategy: 'generalize'` without a `generalizationConfig`
- [x] 3.3 Confirm `InsertQuestionsInFormUseCase` passes the two new fields through to the persisted `Question` (no special handling needed beyond the existing pass-through of question data, but verify content-change detection isn't broken by the new optional fields) — found and fixed a real gap: `hasChanged` didn't account for `piiStrategy`/`generalizationConfig`, so an edit changing only the strategy would have silently not persisted

## 4. Anonymization engine

- [x] 4.1 Create `apps/api/src/infra/services/AnonymizationEngine.ts`: `hash(value)` (HMAC-SHA256 with `exportSecret`), `generalize(value, config)` (switch over `GeneralizationConfig.type`, including the CEP-prefix-to-state table), and `resolve(question, value)` implementing the partial/total resolution order (explicit `piiStrategy` first, then the `needsAnonymization` pseudonymize fallback, then passthrough)
- [x] 4.2 In `resolve`, treat `piiStrategy: 'generalize'` with a missing/invalid `generalizationConfig` as the pseudonymize fallback rather than passthrough

## 5. Wire into the public portal data endpoint

- [x] 5.1 Change `GetPublishedFormDataQuery` to build a `Map<questionId, Question>` from the questions it already loads (replacing the current `fileQuestionIds`-only usage)
- [x] 5.2 Use the map for the existing FILE-type exclusion (unchanged behavior) and to call `AnonymizationEngine.resolve(question, answer.value)` for every other answer before returning it in `rows`
- [x] 5.3 Handle multi-value answers (`string[]`) by applying the resolved transform per element, consistent with `AnonymizationSuggestion`/`Answer.value`'s existing `string | string[]` shape

## 6. FormBuilder UI

- [x] 6.1 Add a per-question anonymization strategy `Select` (using `@monorepo/ui`) to the question editor in `apps/web/src/views/pages/FormBuilder/components/FieldItem.tsx` (or the appropriate question-settings sub-component), with options: sem anonimização / pseudonimizar / generalizar / suprimir — **built, then commented out per 6.4**; the `Select` JSX still exists in the file inside a `{/* ... */}` block for future re-enablement
- [x] 6.2 When "generalizar" is selected, show the `generalizationConfig` sub-form (type selector + its type-specific field: precision, step, or chars) — **built, then commented out per 6.4**; `GeneralizationConfigFields` still exists in the file as a `//`-commented function block
- [x] 6.3 Wire the new fields into the form-save request payload (`apps/web/src/app/services/formsService/insertQuestions.ts` or equivalent) and any local schema/validation on the web side — request/schema plumbing (`insertQuestions.ts`, `schema.ts`, `useFormBuilderController.ts` load/clone mapping) is left active; only the FieldItem UI controls that would let an owner set these fields are disabled (6.4), so nothing currently sends a non-null `piiStrategy` from the web app
- [x] 6.4 **Product decision (post-implementation)**: for this first phase, the form owner SHALL NOT be able to choose a `piiStrategy` at all — the anonymization strategy is decided exclusively by the AI classifier (`Question.anonymizationSuggestion.needsAnonymization` → automatic pseudonymize fallback in `AnonymizationEngine.resolve`, per design.md Decision 1). Commented out (not deleted) the `piiStrategy` `Select` block, the `piiStrategy` watch, the `GeneralizationConfigFields` sub-form, and its now-unused `GeneralizationConfig` import in `FieldItem.tsx`, so the owner-driven "partial anonymization" mode from Decision 1 can be re-enabled later by uncommenting rather than rebuilding. `pnpm typecheck`/`pnpm lint` re-verified clean in `apps/web` after the change (no unused-var/import fallout, `noUnusedLocals` is on)

## 7. Verification

- [x] 7.1 `pnpm typecheck` in `apps/api`, `apps/web`, and `packages/shared` — `apps/api` passes for all touched files (3 pre-existing unrelated `ProfileRepository.ts` errors, confirmed present on `main` before any change this session); `apps/web` passes clean; `packages/shared` has no typecheck script (no build step) — its types are exercised transitively by the other two, both clean
- [x] 7.2 Manually exercise `AnonymizationEngine.resolve` (or add unit tests if a test suite exists) covering: explicit pseudonymize, explicit generalize (each `GeneralizationConfig.type`), explicit suppress, no-strategy + `needsAnonymization: true` fallback, no-strategy + not flagged (passthrough), and generalize-without-config fallback — no test framework in `apps/api` (none added, out of scope), ran a `tsx` script exercising the real class (13/13 assertions passed) covering every scenario listed plus determinism and multi-value handling
- [x] 7.3 Manually exercise `GetPublishedFormDataQuery` (or add tests) confirming FILE-type answers stay excluded and every other question's values match the resolution order from the spec — ran a `tsx` script against the real query with mocked repositories (no live DynamoDB locally) and the real `AnonymizationEngine`; 6/6 assertions passed: FILE excluded, raw passthrough, explicit pseudonymize, and the classifier-flagged/no-strategy fallback
