## 1. Local types and validation

- [x] 1.1 Create `packages/axi/src/types.ts` with local copies of `ApiKeyScope` and `QuestionType` literals, each commented as a deliberate copy (not accidental duplication)
- [x] 1.2 Mirror the `insertQuestionsInFormSchema` shape in `types.ts`: `questionSchema` fields (`id?`, `text`, `questionType`, `order`, `options?`, `max?`, `isRequired?`, `piiStrategy?`, `generalizationConfig?`) and the 4-variant `generalizationConfig` discriminated union (`date_truncate`, `numeric_range`, `text_prefix`, `cep_region`)
- [x] 1.3 Implement a `validateQuestionsPayload(payload: unknown)` function enforcing the shape plus the cross-field rule (`piiStrategy === 'generalize'` requires `generalizationConfig`), throwing `UsageError` with a message naming the exact violated field/rule
- [x] 1.4 Add an internal-only drift-detection test (skipped/no-op outside this monorepo) that imports `packages/shared`'s `ApiKeyScope` and `QuestionType` and asserts the local literals in `types.ts` match

## 2. Config and auth foundation

- [x] 2.1 Create `packages/axi/src/config.ts`: `loadConfig()`, `saveConfig()`, `configPath()` resolving `~/.config/axi/config.json` (respecting `XDG_CONFIG_HOME`), with precedence `AXI_API_KEY`/`AXI_BASE_URL` env vars over the config file
- [x] 2.2 Ensure `saveConfig()` writes the file with `0600` permissions
- [x] 2.3 Create `packages/axi/src/auth.ts` with `maskKey()` (shows `cs_sk_` + last 4 chars only) and any other key-domain helpers
- [x] 2.4 Create `packages/axi/src/http/client.ts`: thin `fetch` wrapper injecting `x-api-key`; before any request, checks for configured key and base URL and throws `UsageError` (exit 2) pointing at `axi auth set-key`/`AXI_BASE_URL` if either is missing; maps `401` to an invalid/revoked/expired-key error and `405` (the API's `NotAllowedError`) to a missing-scope error naming the required scope; passes other error bodies through verbatim via `output/errors.ts`

## 3. Auth commands

- [x] 3.1 Implement `auth set-key <key> [--base-url]` in `packages/axi/src/commands/auth.ts`: validates `cs_sk_` prefix, calls `saveConfig()`, never echoes the full key back
- [x] 3.2 Implement `auth status [--verify]`: prints masked key, base URL, config path; with `--verify`, calls `GET /v1/forms` via the http client and reports whether the key is currently accepted
- [x] 3.3 Implement `auth logout`: removes the stored key from the config file
- [x] 3.4 Implement `auth open`: prints the exact `/api-keys` URL on the web app plus the follow-up `axi auth set-key <key>` command

## 4. Forms commands

- [x] 4.1 Implement `forms create <title> [--description] [--tags csv] [--not-anonymous] [--one-page] [--draft]` calling `POST /v1/forms`, passing the API's own defaults through unchanged (`isPublished: true` unless `--draft`)
- [x] 4.2 Implement `forms update <formId> <title> [same flags]` calling `PUT /v1/forms/{formId}`
- [x] 4.3 Implement `forms list [--fields csv]` calling `GET /v1/forms`, with a definitive empty state when no forms exist
- [x] 4.4 Implement `forms questions insert <formId> --file <path> | --json <inline>`: enforce `--file`/`--json` are mutually exclusive, load/parse the JSON, run `validateQuestionsPayload` (task 1.3) before calling `PUT /v1/forms/{formId}/questions`

## 5. Read commands

- [x] 5.1 Implement `submissions get <formId> [--cursor] [--limit]` calling `GET /v1/submissions/{formId}`, printing `nextCursor` when present (submissions/answers are printed as JSON-line blocks, not a flat `--fields` table — the nested per-question answer shape doesn't flatten into fixed columns; matches spec.md, which never requires `--fields` here)
- [x] 5.2 Implement `datasets data <formId> [--cursor] [--limit]` calling `GET /v1/portal/datasets/{formId}/data`, mapping `404` to a clear "dataset not found or not published" message
- [x] 5.3 Implement `portal search [--q] [--sort relevance|trending]` calling `GET /v1/portal/search`, validating `--sort` locally against the two accepted values (handled generically by the existing flag parser's `values` check)

## 6. Registry, help, and skill content

- [x] 6.1 Remove `packages/axi/src/commands/items.ts` and its demo data
- [x] 6.2 Register all new commands and read-only aliases (`forms`, `submissions`, `datasets`, `portal`, `auth`) in `packages/axi/src/index.ts`, replacing the `items` registry — also fixed `src/cli/router.ts`, whose command-path matcher was hardcoded to at most 2 words (`Math.min(2, words.length)`) and could never resolve the 3-word `forms questions insert` path; generalized to try the full word count down to 1
- [x] 6.3 Update `packages/axi/src/skill/content.ts` (`DESCRIPTION`, `homeBody`, `rootHelpText`, `renderSkill`) to describe the real commands instead of the `items` demo — kept fully static/deterministic (no config/auth reads) since the same content is baked into the committed `SKILL.md`
- [x] 6.4 Regenerate `skills/axi/SKILL.md` via `npm run skill:gen` and confirm `npm run skill:check` passes — done, both pass

## 7. Package metadata

- [x] 7.1 Update `packages/axi/package.json`: `name: "@collectshare/axi"`, real `description`, `license: "MIT"`, `repository` (`type`, `url`, `directory: "packages/axi"`), `publishConfig.access: "public"`
- [x] 7.2 Add `prepublishOnly` script running build + `skill:gen`
- [x] 7.3 Confirm no dependency on `@monorepo/shared` or any other unpublished private workspace package (only devDependencies are `@types/node`, `typescript`, `vitest`; the drift test reads `packages/shared`'s enum files directly off disk rather than importing the package)

## 8. Verification

- [x] 8.1 `pnpm install && pnpm --filter @collectshare/axi build` — done, `tsc` clean
- [x] 8.2 `pnpm --filter @collectshare/axi test` — done, 6/6 pass (`test/cli.test.ts` + `test/typesDrift.test.ts`)
- [x] 8.3 Exercise `node packages/axi/bin/axi.js --help` and `auth status` locally — done, verified against a scratch `XDG_CONFIG_HOME`
- [ ] 8.4 Manually create a dev-stage API key with all three scopes via `apps/web` `/api-keys`, run `auth set-key --base-url https://dev-api.collectshare.com.br`, and exercise each command against the dev stage: `forms create` → `forms list` → `forms update` → `forms questions insert --file` → `submissions get` → `datasets data` → `portal search` — **not done**: requires an interactive login to the web app to create a real key; needs a human to run this
- [ ] 8.5 Exercise negative paths — **partially done**: no key configured, no base URL configured, invalid key shape (`cs_sk_` prefix), bad `--sort` value, and `--file`/`--json` mutual exclusion all verified locally (all exit 2 as expected). Revoked/invalid key (`401`) and missing-scope (`405`) responses need a live server and are **not verified** — depends on 8.4
- [x] 8.6 Dry-run publish: `npm pack --dry-run` inside `packages/axi` — done, tarball contains exactly `dist/`, `skills/axi/SKILL.md`, `bin/axi.js`, `README.md`, `package.json` (25 files, 14.6 kB); no `node_modules`, `test/`, `.github/`
