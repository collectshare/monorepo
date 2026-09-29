## Context

`packages/axi` is a scaffold from the external `axi-axi` generator: a noun-verb CLI router (`src/cli/`), a TOON-style output formatter (`src/output/`), a structured-error convention (`UsageError`/`AxiError`, exit codes 0/1/2), and a self-documenting home view that doubles as the source for a generated `SKILL.md` (`src/skill/content.ts` + `scripts/gen-skill.mjs`). None of that scaffolding needs to change — the work is populating it with real commands over Collectshare's existing `/v1/*` external API (`apps/api/sls/functions/external.yml`), which is already deployed and authenticated via `x-api-key: cs_sk_<hex>` through `ApiKeyAuthorizer`.

API keys are created today only via `POST /api-keys`, which is Cognito-gated and reachable only from the logged-in `apps/web` app (`apps/web/src/views/pages/ApiKeys/`). There is no self-service/OAuth path for a CLI to provision its own key — Cognito's `UserPoolClient` has `GenerateSecret: true` and no Hosted UI, so a real device-flow/PKCE login would require a separate backend change. This change deliberately does not touch that; it documents and builds around the manual copy/paste bootstrap (`axi auth set-key <key>`).

The package must be publishable to public npm as `@collectshare/axi`, which rules out depending on the private `@monorepo/shared` workspace package.

## Goals / Non-Goals

**Goals:**
- Real `forms`, `questions`, `submissions`, `datasets`, `portal`, and `auth` commands that fully cover the seven `/v1/*` routes.
- A CLI/skill experience an AI agent can drive without reading API docs: strict flags, structured errors with suggestions, TOON output, `--help` everywhere.
- Publish-ready `package.json` (name, license, repository, `publishConfig`) with no dependency on unpublished workspace packages.
- A best-effort local guard against invalid `questions insert` payloads (including the PII/`generalizationConfig` shape) before any network round-trip, with a drift-detection test against the real source of truth.

**Non-Goals:**
- No backend/auth changes (no device flow, no self-service key issuance, no new Cognito app client).
- No auto-pagination (`--all`/walk-all) for `submissions get` / `datasets data` — deferred.
- No CLI-side override of the external API's own defaults (e.g. `isPublished: true` on `forms create`) — the CLI mirrors the API's contract rather than reinterpreting it.
- No library/import surface (`main`/`exports`/`types`) — CLI/skill only.
- Not publishing to npm — this change makes the package publish-ready; the actual `npm publish` is a separate, manual step.

## Decisions

### 1. `questions insert` validation: full local replication, not a thin check
The real payload (`apps/api/src/application/controllers/form/schemas/insertQuestionsInFormSchema.ts`) is a discriminated union — `piiStrategy: 'generalize'` requires a `generalizationConfig` matching one of four shapes (`date_truncate`, `numeric_range`, `text_prefix`, `cep_region`) — not just `{ text, questionType, options }`.

Decision: `packages/axi/src/types.ts` hand-mirrors this full shape (enum literals + the discriminated union + the cross-field refine) and `questions insert` validates against it locally before any HTTP call, failing with a `UsageError` that names the exact violated rule.

Alternative considered: light validation (JSON-parses, `questions` is a non-empty array) and let the server's zod errors — already passed through verbatim via `output/errors.ts` — do the real checking. Rejected because it means an agent burns a full round-trip (and, for `forms questions insert`, a real mutation attempt) on shape errors that are knowable client-side; the whole point of an agent-facing CLI is to shorten that feedback loop.

Mitigation for the resulting drift risk: an internal-only (`vitest`, skipped when run outside the monorepo — e.g. gated on `existsSync('../shared')` or an env check) test that imports `packages/shared`'s `QuestionType` and `ApiKeyScope` and asserts the local literals in `types.ts` are a superset/exact match. This test never ships in the published tarball (it lives under `test/`, already excluded from `files`) and never executes against a consumer's installed copy — it only guards this monorepo's CI.

### 2. No CLI-side default override for `isPublished`
`forms create`/`forms update` pass `isPublished` straight through with the same default the API itself uses (`true`). The CLI does not second-guess the API's contract by flipping defaults underneath it — `--draft` is the explicit, discoverable way to opt out, and it's called out in every generated example/skill text so the "instant public dataset" behavior is visible, not hidden.

Alternative considered: default the CLI to draft mode. Rejected (explicit call) to keep the CLI a faithful, predictable mirror of the API rather than a second place where defaults can silently diverge from what `POST /v1/forms` actually does.

### 3. No default/guessed `AXI_BASE_URL`
Config resolution order: `AXI_API_KEY`/`AXI_BASE_URL` env vars → `~/.config/axi/config.json` (respecting `XDG_CONFIG_HOME`) → **fail**. If no base URL is resolved by either source, every network-calling command throws a `UsageError` before constructing any request, pointing at `axi auth set-key <key> --base-url <url>` or `AXI_BASE_URL`.

Alternative considered: hardcode a guessed production domain (`https://api.collectshare.com.br`, inferred by pattern from `app.`/`portal.` subdomains). Rejected — that domain is not actually present anywhere in the repo (`API_DOMAIN_NAME` is injected at deploy time), so hardcoding it into a package published to public npm would be shipping an unverified guess as if it were a fact, silently pointing agents at a URL nobody confirmed. Failing loudly and asking for `--base-url` once is one extra step during `auth set-key` and costs nothing after that.

### 4. Manual pagination only
`submissions get` and `datasets data` expose `--cursor`/`--limit` and print `nextCursor` in the output for the caller (human or agent) to pass back explicitly. No `--all` flag in this change.

Alternative considered: an auto-walk-and-concatenate `--all` flag, which is arguably more in the spirit of an agent-token-efficient tool. Deferred, not rejected — it changes response-size/streaming behavior (a dataset with many pages could produce a very large single output) and deserves its own design pass (buffering strategy, output truncation, max-page safety valve) rather than being bundled into the first real-commands cut.

### 5. No `@monorepo/shared` dependency; local `types.ts` instead
Confirmed necessary because a public npm package cannot depend on an unpublished private workspace package. `types.ts` holds local copies of `ApiKeyScope` (3 literals — effectively static) and the `Question`/`QuestionType`/PII-config shapes needed for local validation (see Decision 1), each with a comment marking it as a deliberate copy, not accidental duplication.

### 6. Command surface and flag shapes
Following the flag parser's string/boolean-only constraint (`src/cli/args.ts`), structured input for `questions insert` goes through `--file <path>` or `--json <inline>` (mutually exclusive; validated locally per Decision 1 before the request). All other commands map 1:1 to their route's query/body fields using scalar flags (`--tags` as CSV, `--not-anonymous`/`--one-page`/`--draft` as booleans, etc.), matching the shapes already scoped in the originating design doc (`docs/design-axi-agent-experience-interface.md`).

### 7. Fixed a scaffold limit on command-path length
`src/cli/router.ts` (vendored AXI plumbing, per the package README meant to be refreshed via `axi-axi new axi --force` rather than hand-edited) only tried command paths up to 2 words (`Math.min(2, words.length)`). `forms questions insert` is 3 words and would never have resolved — every call would hit the `'forms' requires a subcommand` fallback. Generalized the loop to try the full word count down to 1 (`for (let n = words.length; n >= 1; n--)`); since it still breaks on the first exact match against registered command keys, this is a strict superset of the old behavior for any 1-2 word command set and only adds the ability to match longer ones. Flagged here because it diverges from "copied verbatim from axi-axi" — a future `axi-axi new axi --force` refresh needs to reapply this change (or the upstream generator needs to fix it).

## Risks / Trade-offs

- **[Risk]** The hand-mirrored `types.ts` schema drifts from `insertQuestionsInFormSchema.ts` when the PII feature evolves (new `generalizationConfig` variant, new `piiStrategy` value) → **Mitigation**: internal drift-detection test in CI (Decision 1); documented in proposal's Impact section as an accepted, not eliminated, risk.
- **[Risk]** Failing loudly with no default base URL adds friction to the very first command a new user runs → **Mitigation**: `axi auth open` and the generated `SKILL.md`/home view lead with the exact `auth set-key --base-url` invocation, so the failure path itself teaches the fix in one step.
- **[Risk]** Mirroring the API's `isPublished: true` default means the first example a human or agent copy-pastes from `--help`/`SKILL.md` can publish a real, portal-searchable dataset → **Mitigation**: every generated example/help text for `forms create` shows `--draft` explicitly alongside the bare form, so the default is visible rather than silently inherited.
- **[Trade-off]** Choosing full local validation (Decision 1) over a thin client adds meaningfully more code/tests to maintain in `packages/axi` than the originating design doc implied ("valida JSON localmente antes do POST" undersold the schema's real complexity) — accepted as the right trade for agent round-trip efficiency.

## Migration Plan

No runtime migration — this is a net-new capability layered on an already-deployed API; no existing `axi` consumers exist yet. Rollout is: implement → `pnpm --filter axi build && pnpm --filter axi test` → manual exercise against `dev-api.collectshare.com.br` per the verification steps in `docs/design-axi-agent-experience-interface.md` → `npm pack` dry-run inspection → (separate, manual, out of this change's scope) `npm publish --access public`. Rollback is simply not publishing / yanking a bad version — no server-side state to unwind.

## Open Questions

- Exact production API base URL to document in `auth open` / README examples (not present anywhere in the repo; needs confirming out-of-band before writing docs that reference it).
- Whether `@collectshare/axi` is actually available/reserved on npm — external check needed before the first real `npm publish`.
- Whether a future backend change (device flow / PKCE app client) is planned at all, which would let `auth` grow a `login` command later — explicitly out of scope here but worth a placeholder note in the package README so it's not assumed permanent.
