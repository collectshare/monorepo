## Context

`InsertQuestionsInFormUseCase.classifyQuestions` resolves each changed question through `PiiHeuristics` → `QuestionClassificationCacheRepository` (keyed by `hashQuestionContent`) → `QuestionAnonymizationClassifier` (one Gemini call for all remaining questions, JSON schema output, 8s `AbortController`, failure → `null`). The Lambda (`insertQuestionsInForm`) has a 15s timeout; the use case is also reached from `/v1` and MCP `insert_questions`.

`@tanstack/ai` `decide()` judges **one** `state` against a set of typed questions and calls TypeSafe `POST /v1/systemone`. `boolean()` answers expose `value` (P(true) ≥ 0.5) and `probability` (P(true)); no confidence, no reason. The `TypesafeClientConfig.timeout` option is declared but not used by the adapter, so cancellation must go through `decide({ abortSignal })`. Both packages are ESM-only (`exports` with only the `import` condition); the API compiles with `module: commonjs` and is bundled by `serverless-esbuild`.

## Goals / Non-Goals

**Goals:**
- Collect Jev vs Gemini agreement, latency and cost data on real traffic with zero behavior change.
- Keep the Jev code isolated so promoting it (or deleting it) later is a small diff.

**Non-Goals:**
- Switching the authoritative classifier, or persisting Jev results.
- Running Jev on heuristic/cache hits (smaller, biased sample is accepted for now).
- A richer taxonomy (`choice` of none/personal/sensitive per LGPD art. 5º II). Same yes/no question as Gemini keeps the comparison fair.
- Concurrency limiting toward TypeSafe (1,200 req/min is far above our save volume).

## Decisions

**1. One `decide()` per question, not one batched call.**
`state = { pergunta: text, tipo: questionType }`, `questions = { pii: boolean({ instructions, criteria: { true, false } }) }`, run with `Promise.allSettled`. This is the intended use of `decide()`; batching N questions into one state would make the model locate ids inside the state. Billing is per input token, so N calls cost about the same as one batch (instructions repeat per question either way).
Instructions in Portuguese, mirroring the Gemini prompt: whether the question collects personal data that should be anonymized before publishing. `criteria.true`: identifies or can identify a person (name, CPF, e-mail, phone, address, birth date, health, religion, etc.); `criteria.false`: opinion, preference or non-identifying data.

**2. New `JevQuestionClassifier` in `infra/services`, separate from the Gemini class.**
`@Injectable()`, constructor takes `AppConfig`. `classify(items)` returns `Map<id, JevVerdict>` where `JevVerdict = { needsAnonymization, probability, ms, usage } | { error, ms }`. It never throws. It returns an empty map (no calls) when `appConfig.typesafe.apiKey` is empty. Adapter created once with `createTypesafeDecider('jev-latest', apiKey)` (not `typesafeDecider()`, which reads `process.env` directly and throws when absent). `decide({ debug: false })` because we log ourselves.
Alternative considered: run both inside `QuestionAnonymizationClassifier`. Rejected: mixes the authoritative and the experimental path, and the class lacks `formId`/hash for the audit line.

**3. The use case runs both in parallel and owns the audit log.**
`const [geminiResults, jevResults] = await Promise.all([gemini.classify(items), jev.classify(items)])`. Both never throw. Each has its own 8s `AbortController` started at the same moment, so the added latency is `max(gemini, jev) - gemini` ≤ 8s total, within the 15s Lambda. The use case already has `formId` and `hashByQuestionId`, so it writes the per-question line:

```
console.info(JSON.stringify({
  msg: 'QuestionClassificationShadow', formId, questionId, hash,
  gemini: { needsAnonymization, confidence } | null,
  jev: { needsAnonymization, probability, ms, usage } | { error, ms } | null,
  agree: boolean | null,
}))
```

Logged as a single JSON line so Logs Insights discovers the fields: `filter msg = "QuestionClassificationShadow" | stats count(*) by agree`.

**4. Gemini logs its own latency and usage, once per batch.**
`QuestionAnonymizationClassifier` adds `console.info('QuestionAnonymizationClassifier usage', { count, ms, promptTokenCount, candidatesTokenCount, thoughtsTokenCount })` from `result.response.usageMetadata`. Usage is per batch, so it is not repeated on per-question lines (avoids double counting when summing). Its return type is unchanged.

**4b. tsconfig.** Spike result: under `module: commonjs` (node10 resolution) `tsc` cannot follow `@tanstack/ai/adapters` (subpath `exports`), so the adapter type collapses. The API tsconfig now uses `module: "preserve"` + `moduleResolution: "bundler"` (typecheck only, `noEmit`; esbuild bundles to CJS). Verified: typecheck, full test suite, esbuild bundle of `insertQuestionsInForm` loads and `decide()` reaches TypeSafe.

**5. Config.**
`env.ts`: `TYPESAFE_API_KEY: z.string().optional()`. `sls/config/env.yml`: `TYPESAFE_API_KEY: ${env:TYPESAFE_API_KEY, ''}`. `AppConfig.typesafe = { apiKey }`. Empty = shadow off, which is also the rollback switch.

## Risks / Trade-offs

- [ESM-only packages under CommonJS `tsc`/esbuild] → First task is a spike: import both in the classifier, run `pnpm typecheck`, `pnpm test` and `sls package`. If `tsc` can't resolve the types under the current `moduleResolution`, switch the API tsconfig to `moduleResolution: "bundler"` (esbuild does the actual bundling) before writing the rest.
- [Extra latency on save when Jev is slower than Gemini] → bounded by the shared 8s timeout; Jev is advertised as sub-second. Check `jev.ms` in logs.
- [Question text sent to an extra third party (TypeSafe)] → Same data already goes to Google; only question text and type are sent, never respondent answers. Note it in docs.
- [Biased sample: only LLM-path questions] → Accepted; revisit before promoting Jev.
- [`boolean` has no confidence/reason] → Irrelevant in shadow mode. When promoting, map `confidence = value ? p : 1 - p` and a synthetic `reason`.

## Migration Plan

Deploy with `TYPESAFE_API_KEY` set on dev first, check logs, then prod. Rollback: unset the key and redeploy (no data written by Jev, nothing to clean up).

## Open Questions

- Agreement threshold and sample size required to promote Jev to authoritative.
- Whether to also shadow cache/heuristic hits later to get an unbiased sample.
