## 1. Table TTL infrastructure

- [x] 1.1 Add `TimeToLiveSpecification` (`AttributeName: expiresAt`, `Enabled: true`) to `MainTable` in `apps/api/sls/resources/MainTable.yml`
- [ ] 1.2 Deploy and confirm TTL is active on the table (no dependent code yet, so this is safe to ship standalone)

## 2. Classification cache

- [x] 2.1 Add a `normalize(text)` + `hash(questionType, text)` (sha256) utility (lowercase, trim, collapse whitespace, strip diacritics)
- [x] 2.2 Create `QuestionClassificationCacheItem` in `apps/api/src/infra/database/dynamo/items/`, following the `QuestionItem.ts` pattern (`PK = CLASSIFICATION#{hash}`, `SK = METADATA`, `fromEntity`/`toEntity` or equivalent get/put mappers, `expiresAt` attribute)
- [x] 2.3 Create a repository (`apps/api/src/infra/database/dynamo/repositories/`) exposing `get(hash)` and `put(hash, suggestion)` (computing `expiresAt` as now + 90 days on write)
- [x] 2.4 Wire the cache into `InsertQuestionsInFormUseCase`: for each question needing classification (per existing `contentChanged` logic), look up the cache before calling the classifier; on hit, reuse the cached `AnonymizationSuggestion`; on a successful (non-null) LLM classification, write the result to the cache
- [x] 2.5 Confirm failed (`null`) classifications are never written to the cache

## 3. Heuristic pre-filter

- [x] 3.1 Create `apps/api/src/infra/services/PiiHeuristics.ts` exporting an `evaluate(text, questionType)` function with the `questionType` parameter present but unused for now (see design.md — no identifiable `QuestionType` values exist yet)
- [x] 3.2 Define the keyword list (cpf, rg, cnpj, endereço, e-mail/email, telefone, celular, nascimento, cep, identidade, passaporte, ...) matched against normalized text
- [x] 3.3 Return a fixed-confidence `AnonymizationSuggestion` (`needsAnonymization: true`) on match, `null` on no match
- [x] 3.4 Wire the heuristic into `InsertQuestionsInFormUseCase` ahead of the cache lookup (Task 2.4) for each question needing classification

## 4. Batched LLM classification

- [x] 4.1 Change `QuestionAnonymizationClassifier.classify` signature to accept `{ id, text, questionType }[]` and return a `Map<string, AnonymizationSuggestion | null>`, keyed by the caller-supplied `id`
- [x] 4.2 Update the Gemini `responseSchema` to an array of `{ id, needsAnonymization, confidence, reason }` objects; update the prompt to list all questions with their `id`
- [x] 4.3 Map results back to questions by `id`, not array position; default to `null` for any question missing from a malformed/partial response
- [x] 4.4 On total call failure/timeout, return `null` for every question in the batch (preserve existing fail-open behavior, now applied per-batch)
- [x] 4.5 Update `InsertQuestionsInFormUseCase` to collect all questions not resolved by the heuristic or cache into a single batch call per `execute` invocation, then write successful results to the cache (Task 2.4's cache-write path)

## 5. Observability

- [x] 5.1 Add an informational log (`console.info`) in `InsertQuestionsInFormUseCase` for each classified question, including `questionId`, `formId`, `source` (`heuristic` | `cache` | `llm`), and `needsAnonymization`

## 6. Verification

- [x] 6.1 `pnpm typecheck` in `apps/api` (passes for all new/changed files; 3 pre-existing unrelated errors in `ProfileRepository.ts` confirmed present on `main` before this change, not introduced by it)
- [x] 6.2 Manually exercise `InsertQuestionsInFormUseCase` (or add/update unit tests if a test suite exists for it) covering: heuristic hit, cache hit, cache miss → LLM → cache write, batch of multiple new questions in one save, and a simulated classifier failure — no test framework exists in `apps/api` (none added, out of scope for this change) and the API has no local dev server; ran `PiiHeuristics`/`hashQuestionContent` (the pure, no-I/O pieces) via `tsx` confirming keyword matching, diacritic/case normalization, and hash stability/type-sensitivity, then traced the five required scenarios through the final `InsertQuestionsInFormUseCase`/`QuestionAnonymizationClassifier` code (which needs live DynamoDB + Gemini to execute end-to-end)
