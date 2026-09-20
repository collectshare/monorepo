## Context

`InsertQuestionsInFormUseCase` currently classifies each new-or-content-changed question by calling `QuestionAnonymizationClassifier.classify(text, questionType)` once per question, sequentially, inside a `for` loop (`apps/api/src/application/usecases/form/InsertQuestionsInFormUseCase.ts:56-89`). The classifier (`apps/api/src/infra/services/QuestionAnonymizationClassifier.ts`) makes a single-item Gemini Flash call per invocation and already has its own 8s timeout and error swallowing (returns `null` on any failure).

The project's single-table DynamoDB design (`MainTable`, `sls/resources/MainTable.yml`) has no TTL configured today — this is the first feature to need it. Existing items (e.g. `QuestionItem`, `apps/api/src/infra/database/dynamo/items/QuestionItem.ts`) follow a consistent `PK`/`SK`/`type` + static `getPK`/`getSK`/`fromEntity`/`toEntity` pattern that the new cache item should match.

One material fact discovered while grounding this design: `QuestionType` (`packages/shared/enums/QuestionType.ts`) is `TEXT | MULTIPLE_CHOICE | CHECKBOX | DROPDOWN | STARS | FILE` — there is **no** email/phone/date-of-birth question type today. The proposal's heuristic idea of shortcutting on "`questionType` already identificável" therefore has no target to key off of at present; the heuristic pre-filter is effectively keyword-only until/unless such types are introduced. This is called out explicitly so implementation doesn't invent enum values that don't exist.

## Goals / Non-Goals

**Goals:**
- Reduce Gemini Flash call volume for question PII classification via caching, a deterministic pre-filter, and batching, without changing the resulting `AnonymizationSuggestion` semantics observed by `InsertQuestionsInFormUseCase` callers.
- Reuse classifications across forms and accounts for identical (type + normalized text) questions.
- Collapse all classifier calls needed within a single `InsertQuestionsInFormUseCase.execute` invocation into at most one Gemini call.
- Make the source of each classification (`heuristic` | `cache` | `llm`) observable via logs.

**Non-Goals:**
- Changing the `AnonymizationSuggestion` shape or the classification prompt's semantics/accuracy.
- Cross-account data isolation policy for the cache — classification is based purely on question content (type + text), not account-specific context, so sharing cache entries across accounts is intentional and in-scope, not a gap to design around.
- Adding new `QuestionType` values (e.g. `EMAIL`, `PHONE`) — out of scope; heuristic will only use text-keyword matching for now.
- Real-time/streaming classification UX — this remains a synchronous part of `execute`.

## Decisions

### 1. Cache key & normalization
Hash = `sha256(questionType + '\u0000' + normalize(text))`, where `normalize` = lowercase → trim → collapse internal whitespace → strip diacritics (NFD + strip combining marks). Including `questionType` in the hash input (not just text) avoids collisions between e.g. a free-text "cpf" mention and a hypothetical future typed field with the same label.

### 2. Cache item shape (DynamoDB, single-table)
New `QuestionClassificationCacheItem` following the `QuestionItem` pattern:
- `PK = CLASSIFICATION#{hash}`, `SK = METADATA` (fixed sort key — this item type has no natural range dimension, unlike `QuestionItem`'s `FORM#{formId}`/`QUESTION#{id}`).
- Attributes: `hash`, `suggestion: AnonymizationSuggestion`, `expiresAt` (epoch seconds), `type: 'QuestionClassificationCache'`.
- No GSI needed — always accessed by exact hash (point `GetItem`), never scanned or listed.

### 3. TTL
Enable `TimeToLiveSpecification` on `MainTable` (`sls/resources/MainTable.yml`) with `AttributeName: expiresAt`, `Enabled: true`. Since this is the table's first TTL attribute, every other existing item type is unaffected (DynamoDB TTL only expires items that actually carry that attribute with a valid epoch number). Default retention: 90 days from write, recomputed to `Date.now()/1000 + 90*86400` on every cache write (including on a hit-then-rewrite, if the implementation chooses to refresh — simplest is write-once, no refresh-on-read, so hot entries still expire and get regenerated; acceptable since regeneration cost is one Gemini call).

### 4. Heuristic pre-filter
`PiiHeuristics.evaluate(text, questionType): AnonymizationSuggestion | null`, runs first, before cache lookup:
- Keyword match (accent/case-insensitive) against a fixed list (cpf, rg, cnpj, endereço, e-mail/email, telefone, celular, nascimento, cep, identidade, passaporte, ...) on the normalized text → returns a `needsAnonymization: true` suggestion with a fixed `confidence` (e.g. `1`) and a `reason` string identifying the matched keyword.
- `questionType`-based shortcut is **not** implemented now, per the enum finding above — the hook exists in the function signature so it can be added later without changing call sites once/if identifiable types are added.
- Returning `null` means "no shortcut available", falling through to cache then LLM — the heuristic never asserts `needsAnonymization: false` (no keyword match is not proof of absence of PII; only the LLM or an explicit cached LLM result should make a negative determination).

### 5. Batching
`QuestionAnonymizationClassifier.classify` changes signature from `(text, questionType) => Promise<AnonymizationSuggestion | null>` to `(items: { id: string; text: string; questionType: QuestionType }[]) => Promise<Map<string, AnonymizationSuggestion | null>>`.
- The `id` here is a caller-supplied correlation key (the question's own `id`, or a synthetic index for not-yet-persisted questions), **not** relied on for ordering — the Gemini `responseSchema` becomes an array of `{ id, needsAnonymization, confidence, reason }` objects so the model echoes back the correlation key per item, and the classifier maps results back by `id` rather than trusting positional array order. This avoids silent misclassification if the model reorders or drops an item.
- If the parsed response is malformed, missing an expected `id`, or the whole call fails/times out, the classifier returns `null` for every item in that batch (same fail-open-to-null behavior as today, just applied per-item) rather than failing the whole use case.
- `InsertQuestionsInFormUseCase` calls the heuristic, then the cache, for every question needing classification, collects the leftovers into one batch call, then writes cache entries for the LLM-resolved ones.

### 6. Observability
Single `console.info` (matching the existing `console.error` convention in the classifier) per classified question: `{ questionId, formId, source: 'heuristic' | 'cache' | 'llm', needsAnonymization }`. Emitted from `InsertQuestionsInFormUseCase` (the orchestration point that knows which source resolved each question), not from the classifier or cache repository individually.

### 7. Ordering of implementation
Cache (isolated, highest ROI, no batching complexity) → heuristic (small, further cuts both LLM and cache traffic) → batching (touches the classifier's public signature, so land it after the simpler pieces prove the cache/heuristic split is correct) → observability (additive, can land alongside any step).

## Risks / Trade-offs

- **[Risk]** Cache poisoning from a bad LLM response cached long-term (90 days) → **Mitigation**: only cache LLM results that passed the classifier's existing shape validation (`needsAnonymization`/`confidence`/`reason` typed correctly); never cache `null` (failed) classifications, so a transient failure doesn't stick a form with an unclassified/missing suggestion for 90 days — it will simply retry classification (heuristic → cache miss → LLM) on next save.
- **[Risk]** `questionType`-based heuristic shortcut described in the source proposal has no enum values to key off today → **Mitigation**: documented above (Decision 4); implement keyword-only now, leave the `questionType` parameter in the function signature as a no-op hook.
- **[Risk]** Batched Gemini call misaligning results to questions (wrong `AnonymizationSuggestion` applied to wrong question) → **Mitigation**: `id`-keyed response schema + map-based lookup (Decision 5), not positional indexing.
- **[Risk]** Enabling TTL is a one-way table property change (safe to re-disable but affects a live production table) → **Mitigation**: TTL only deletes items that carry `expiresAt`; no existing item type sets it, so this is safe to deploy ahead of the cache-writing code going live.
- **[Trade-off]** Cache is shared across accounts/forms (by design, per Non-Goals) — a wrong classification for one account's phrasing of a question will affect other accounts using the same phrasing until TTL expiry. Accepted because classification is content-based, not account-based, and the LLM's determinism for a fixed prompt+input makes cross-account variance unlikely; if this proves wrong in practice, the cache key can be namespaced later.

## Migration Plan

1. Deploy `TimeToLiveSpecification` on `MainTable` (no code depends on it yet — safe, additive infra change).
2. Deploy cache item/repository + `InsertQuestionsInFormUseCase` cache-read/write wiring (heuristic still a no-op / not yet added), behind normal deploy (no feature flag — failure mode is "falls through to existing LLM call", so it degrades to current behavior on any bug).
3. Deploy heuristic pre-filter.
4. Deploy batched `classify` signature change (single PR since it changes a shared method signature — no partial-rollout concern within the API service).
5. Rollback strategy: each step is independently revertible by redeploying the prior version; the cache table entries are inert (just unread data with TTL) if the reading code is rolled back, so no data cleanup is required on rollback.

## Open Questions

- Exact keyword list for the heuristic (final list, and whether it should live in code or config) — left to implementation; the proposal's example list (cpf, rg, cnpj, endereço, e-mail, telefone, nascimento) is a starting point, not exhaustive.
- Default TTL retention (90 days suggested in the proposal) — confirm with product/compliance whether cached PII-classification *metadata* (not the PII itself — only `needsAnonymization`/`confidence`/`reason`/normalized-text-hash) has any retention constraint.
- Whether cache writes should refresh `expiresAt` on read (sliding TTL) — current design is write-once/no-refresh for simplicity; revisit if cache churn turns out higher than expected.
