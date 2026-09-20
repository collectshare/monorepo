## Why

`QuestionAnonymizationClassifier` calls Gemini Flash once per question, synchronously, every time a question is created or has its `text`/`questionType` changed. This is correct but wasteful: forms saved with many new questions trigger one LLM call per question with no reuse across forms, and even obviously-PII or obviously-safe questions (a field already typed as email, a text containing "CPF") pay for a full LLM round trip. As form volume grows, this drives avoidable Gemini cost and latency on every form save.

## What Changes

- Add a content-hash cache (DynamoDB) for `AnonymizationSuggestion` results, keyed on normalized `questionType + text`, so identical questions across different forms reuse a prior classification instead of re-calling Gemini.
- Add a deterministic heuristic pre-filter that resolves obvious cases (identifiable `questionType`s, PII keywords in the text) without calling the LLM or the cache.
- Batch all questions needing LLM classification within a single form save into one Gemini call instead of one call per question.
- Add structured, informational logging that tags each classified question with its resolution source (`heuristic` | `cache` | `llm`) to measure realized savings over time.
- Enable native DynamoDB TTL on the table resource (`sls/resources/`) to expire cache entries after a configurable retention window (default 90 days) — first use of TTL in this project.

## Capabilities

### New Capabilities
- `pii-classification-cost-optimization`: heuristic pre-filter, content-hash classification cache (with TTL expiry), and per-form batching that sit in front of `QuestionAnonymizationClassifier` to reduce redundant/unnecessary Gemini calls during question classification, plus observability into which path resolved each question.

### Modified Capabilities
(none — `InsertQuestionsInFormUseCase`'s existing content-change detection behavior is unchanged; this change only alters how a needed classification is fulfilled)

## Impact

- **Affected code**:
  - `apps/api/src/infra/services/QuestionAnonymizationClassifier.ts` — `classify` changes from single-question to batch signature.
  - `apps/api/src/application/usecases/form/InsertQuestionsInFormUseCase.ts` — inserts heuristic + cache lookups before calling the classifier, and groups remaining questions into one batched call per form save.
  - `packages/shared/types/AnonymizationSuggestion.ts` — no shape change expected, but batch call sites depend on its type.
- **New code**:
  - New DynamoDB item class for the classification cache (pattern: `infra/database/dynamo/items/*Item.ts`).
  - New repository for cache reads/writes (pattern: `infra/database/dynamo/repositories/`).
  - New heuristic utility (e.g. `infra/services/PiiHeuristics.ts`).
- **Infrastructure**: DynamoDB table resource in `sls/resources/` gains `TimeToLiveSpecification` and cache items gain an `expiresAt` (epoch) attribute.
- **Dependencies**: none new — reuses existing Gemini client and DynamoDB single-table infrastructure.
- **Cost/latency**: reduces Gemini call volume (cache hits + heuristic shortcuts) and reduces per-form latency (batching collapses N sequential calls into 1).
