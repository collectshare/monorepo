## 1. Shared package

- [x] 1.1 Port `ApiKey` entity to `packages/shared/entities/ApiKey.ts` (from `feature/api`, unchanged).
- [x] 1.2 Port `ApiKeyScope` enum to `packages/shared/enums/ApiKeyScope.ts`, replacing `SUBMISSIONS_READ` with `PORTAL_READ`.

## 2. API config

- [x] 2.1 Add `MASTER_SECRET` to `apps/api/src/shared/config/env.ts` (zod schema) and `apps/api/sls/config/env.yml` (with a `changeme-` dev default), following the existing secrets pattern. Do not port `EXPORT_SECRET`.
- [x] 2.2 Add `AppConfig.secrets.masterSecret` to `apps/api/src/shared/config/AppConfig.ts`. Do not port `exportSecret`.

## 3. Data layer

- [x] 3.1 Port `ApiKeyItem` to `apps/api/src/infra/database/dynamo/items/ApiKeyItem.ts`, adjusting `fromEntity`/`toEntity` for the trimmed `ApiKeyScope`.
- [x] 3.2 Port `ApiKeyRepository` to `apps/api/src/infra/database/dynamo/repositories/ApiKeyRepository.ts` (create, list-by-account, find-by-hash, revoke).

## 4. Use cases and controllers

- [x] 4.1 Port `CreateApiKeyUseCase`/`CreateApiKeyController` — generates a `cs_sk_...` secret, hashes it with `AppConfig.secrets.masterSecret`, persists the hash + prefix, returns the raw secret once.
- [x] 4.2 Port `ListApiKeysUseCase`/`ListApiKeysController` — returns only metadata (no raw secret), scoped to the authenticated `accountId`.
- [x] 4.3 Port `RevokeApiKeyUseCase`/`RevokeApiKeyController` — sets `revokedAt`, rejects revoking a key that doesn't belong to the authenticated account.
- [x] 4.4 Wire the three Lambda entrypoints under `apps/api/src/main/functions/apikeys/` (`createApiKey.ts`, `listApiKeys.ts`, `revokeApiKey.ts`) using `lambdaHttpAdapter`.

## 5. Authorizer (infra only, not attached)

- [x] 5.1 Port `apiKeyAuthorizer.ts` to `apps/api/src/main/functions/external/apiKeyAuthorizer.ts`, updated to use `ApiKeyScope.PORTAL_READ`.
- [x] 5.2 Do NOT port `getExternalFormSubmissions.ts`, `GetExternalFormSubmissionsController`/`UseCase`/`GetPublishedFormDataQuery`-style query, `AnonymizationEngine`, `ConsentRequiredError`, or `GeneralizationConfig`.

## 6. Serverless wiring

- [x] 6.1 Add `apps/api/sls/functions/apiKeys.yml` (create/list/revoke, all behind `CognitoAuthorizer`, matching `feature/api`'s routes).
- [x] 6.2 Add `apps/api/sls/functions/external.yml` with only the `apiKeyAuthorizer` function entry (no `getExternalFormSubmissions`, no route attachment).
- [x] 6.3 Register both new function files in `apps/api/serverless.yml`.
- [x] 6.4 ~~Add new GSI~~ — reused existing `GSI1` (`GSI1PK = APIKEY_HASH#<hash>`) for `findByHash`; `findByAccountId` uses the base table PK/SK. No `MainTable.yml` change needed.

## 7. Web UI

- [x] 7.1 Add `apps/web/src/app/services/apiKeysService/` (`createApiKey.ts`, `listApiKeys.ts`, `revokeApiKey.ts`, `index.ts`) using the current `httpClient`.
- [x] 7.2 Add `apps/web/src/views/pages/ApiKeys/` (`index.tsx`, `useApiKeysController.ts`), importing shared UI primitives from `@monorepo/ui` (current `main` layout), not from local `apps/web/src/components/ui/*` paths used in `feature/api`.
- [x] 7.3 Implement one-time secret reveal on creation (copy-to-clipboard, dismiss warning that it won't be shown again).
- [x] 7.4 Add the `ApiKeys` route to `apps/web/src/app/router/index.tsx` and an entry point from `AppSidebar`/`NavUser` (account settings area).

## 8. Verification

- [x] 8.1 `pnpm typecheck` in `apps/api` and `apps/web`. `apps/web` is clean; `apps/api` has 3 pre-existing errors in `ProfileRepository.ts` unrelated to this change (verified via `git diff` — file untouched), none in new/edited files.
- [x] 8.2 `pnpm lint` across affected apps. `apps/web` clean (fixed one import-sort error). `apps/api` has no root lint script; ran `eslint` directly on all new/edited files — clean (fixed one `curly` error).
- [x] 8.3 Verified the `ApiKeys` page compiles and its module graph resolves cleanly under Vite dev server (`@monorepo/ui` and local `Label` imports both load). **Not verified**: the full create/list/revoke/authorizer flow end-to-end — `apps/api` has no local dev server (per CLAUDE.md, it only deploys to AWS), so exercising the new endpoints and the authorizer against a real Cognito session + DynamoDB table requires a deploy, which was not done as part of this task.
- [x] 8.4 Confirmed via `git diff --stat` — no changes to `apps/api/src/application/controllers/portal`, `apps/api/sls/functions/portal.yml`, or `apps/api/src/main/functions/portal`.
- [x] 8.5 Confirmed via `git status --short | grep -iE "anonymiz|consent|generaliz|externalformsubmission"` — no matches.
