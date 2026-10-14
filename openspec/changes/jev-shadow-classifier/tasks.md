## 1. Dependency spike

- [x] 1.1 Install `@tanstack/ai` and `@tanstack/ai-typesafe` (already in `apps/api/package.json`) and confirm a CommonJS import of `decide`/`boolean`/`createTypesafeDecider` passes `pnpm typecheck`, `pnpm test` and esbuild bundle (fix module resolution if not). Done: switched tsconfig to `moduleResolution: "bundler"`; `sls package` itself needs Serverless Dashboard login, so the bundle was reproduced with esbuild + the repo config

## 2. Config

- [x] 2.1 Add optional `TYPESAFE_API_KEY` to `src/shared/config/env.ts`, `sls/config/env.yml` (default `''`); no `.env.example` exists, add the key to your local `.env`
- [x] 2.2 Add `AppConfig.typesafe = { apiKey }`

## 3. Jev classifier

- [x] 3.1 Create `src/infra/services/JevQuestionClassifier.ts` (`@Injectable`, `createTypesafeDecider('jev-latest', key)`, one `decide()` per item with a `boolean` PII question in Portuguese, `Promise.allSettled`, 8s `AbortController`, `debug: false`, never throws, empty map when key is empty)
- [x] 3.2 Add `JevQuestionClassifier.test.ts` using the adapter's `fetch` override: success maps `value`/`probability`/`usage`, HTTP error and abort produce `{ error }`, empty key makes no calls

## 4. Gemini usage logging

- [x] 4.1 In `QuestionAnonymizationClassifier.classify`, log batch size, latency and `usageMetadata` token counts (incl. `thoughtsTokenCount`) after a successful call

## 5. Use case wiring

- [x] 5.1 Inject `JevQuestionClassifier` into `InsertQuestionsInFormUseCase` and run it with Gemini via `Promise.all` on the `remaining` questions only
- [x] 5.2 Emit one `QuestionClassificationShadow` log per remaining question (formId, questionId, hash, gemini, jev, agree; no text) when shadow is enabled; Gemini result alone is persisted and cached
- [x] 5.3 Run `pnpm typecheck` and `pnpm test`

## 6. Docs & rollout

- [x] 6.1 Document `TYPESAFE_API_KEY` and the shadow audit log/query in `CLAUDE.md` (LGPD section + env list) and both READMEs
- [ ] 6.2 Deploy to dev with the key set, save a form with new questions, verify the shadow log lines in CloudWatch
