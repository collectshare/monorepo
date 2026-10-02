## Why

Question PII classification (`anonymizationSuggestion`) runs on Gemini 3.6 Flash. TypeSafe's Jev (`jev-latest`) is a decision-only model priced at ~$0.042/M input tokens with free output (roughly 60x cheaper per question than Gemini, whose cost is dominated by output tokens and doubles on 2027-01-01). Before switching, we need evidence that Jev agrees with Gemini on our real questions, so this change runs Jev in **shadow mode** next to Gemini and logs both for audit.

## What Changes

- Add a Jev-based question classifier (`@tanstack/ai` `decide()` + `@tanstack/ai-typesafe` `createTypesafeDecider('jev-latest', key)`), one `decide()` call per question with a single `boolean` PII question.
- In `InsertQuestionsInFormUseCase`, questions that reach the LLM path (after `PiiHeuristics` and the classification cache) are sent to Gemini and Jev **in parallel**. Gemini stays authoritative: only its result is written to `anonymizationSuggestion` and to the cache. Jev's result is only logged.
- Emit a structured audit log line per question with both verdicts, Jev probability/latency/usage, errors, and an `agree` flag; Gemini logs its own per-batch latency and token usage (`usageMetadata`, including `thoughtsTokenCount`). No question text is logged, only its content hash.
- New optional deploy-time env `TYPESAFE_API_KEY` (`sls/config/env.yml`, `env.ts`, `AppConfig`). When it is empty, shadow mode is off and behavior is identical to today.
- Jev failures or timeouts never affect saving questions or the Gemini result.
- Gemini is **not** removed.

## Capabilities

### New Capabilities
- `question-classification-shadow`: running a second (shadow) classifier alongside the authoritative one for question PII classification, and the audit logging that compares them.

### Modified Capabilities
<!-- none: no existing specs in openspec/specs; authoritative classification behavior is unchanged -->

## Impact

- **Code (`apps/api`)**: new `infra/services/JevQuestionClassifier.ts`; `InsertQuestionsInFormUseCase.classifyQuestions` (parallel call + audit log); `QuestionAnonymizationClassifier` (log latency/usage); `shared/config/env.ts` + `AppConfig`.
- **Config**: `sls/config/env.yml` / `.env` gain `TYPESAFE_API_KEY` (optional).
- **Dependencies**: `@tanstack/ai@^0.64.0`, `@tanstack/ai-typesafe@^0.1.7` (already added to `package.json`). Both are ESM-only while the API compiles as CommonJS; bundling via esbuild must be validated first.
- **Cost/latency**: adds ~2% to LLM classification cost; latency bounded by the slower of the two calls (8s cap each). Only affects `POST /forms/{formId}/questions` (and the MCP/`/v1` paths that reuse `InsertQuestionsInFormUseCase`).
- **Docs**: `CLAUDE.md`/READMEs mention `TYPESAFE_API_KEY` and the shadow audit.
