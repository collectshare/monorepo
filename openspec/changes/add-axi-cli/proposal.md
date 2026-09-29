## Why

`packages/axi` is an unpopulated scaffold from the external `axi-axi` generator: a single demo command (`items list`) over in-memory data, no auth, no network calls. Collectshare's `/v1/*` external API (forms create/update, question insertion, submissions, published dataset data, portal search) already exists and is usable today only via raw HTTP + a manually created `x-api-key`. Turning the scaffold into a real noun-verb CLI over those routes gives AI agents (Claude Code or otherwise) a token-efficient, self-documenting way to drive Collectshare without hand-rolling HTTP calls, and makes it publishable as `@collectshare/axi` on public npm.

## What Changes

- Replace the demo `items list` command with real commands: `forms create`, `forms update`, `forms list`, `forms questions insert`, `submissions get`, `datasets data`, `portal search`.
- Add `auth status`, `auth set-key`, `auth logout`, `auth open` commands and a `~/.config/axi/config.json`-backed config module (env vars `AXI_API_KEY`/`AXI_BASE_URL` take precedence over the file) for the manual copy/paste API-key bootstrap flow (no backend auth changes in this change).
- Add a thin `fetch`-based HTTP client that injects `x-api-key` and maps `401`/`405`/missing-key states to clear, actionable CLI errors via the existing `output/errors.ts`.
- Add a local `types.ts` with a full, hand-maintained mirror of the `questions insert` payload shape (including the `piiStrategy` / `generalizationConfig` discriminated union and its cross-field rule) so invalid payloads are rejected before any network call; add an internal-only drift-detection test comparing it against `packages/shared`'s `ApiKeyScope`/`QuestionType`/question schema.
- Update `src/skill/content.ts` (home view + generated `SKILL.md`) and `scripts/gen-skill.mjs` output to describe the real commands instead of the `items` demo.
- Update `package.json`: name to `@collectshare/axi`, description, `license: MIT`, `repository` (with `directory`), `publishConfig.access: public`, `prepublishOnly` running build + skill:gen. No `main`/`exports`/`types` — this package is consumed as a CLI/skill, not a library.
- `axi forms create`/`forms update` mirror the external API's own default (`isPublished: true` when `--draft` is not passed) — no CLI-side override of that default.
- When neither `AXI_BASE_URL` nor a configured base URL is present, every network-calling command fails fast with a `UsageError` pointing at `axi auth set-key --base-url` / `AXI_BASE_URL` — no hardcoded/guessed production domain.
- Pagination (`submissions get`, `datasets data`) is manual (`--cursor`/`--limit`) only; no auto-walk-all flag in this change.

## Capabilities

### New Capabilities
- `axi-cli`: noun-verb CLI (and generated Claude skill) that wraps Collectshare's `/v1/*` external API — form/question management, submission and published-dataset reads, portal search, and local API-key auth configuration — for use by AI agents and other automation.

### Modified Capabilities
_None — this only adds a new client on top of the already-shipped `/v1/*` external API; no `apps/api` requirement changes._

## Impact

- **Affected code**: `packages/axi/**` (commands, config, http client, types, skill content, package.json) — no changes to `apps/api`, `apps/web`, or `packages/shared`.
- **New runtime dependency surface**: none required beyond Node's built-in `fetch`/`fs`/`os` (keeps the published package dependency-free, matching the scaffold's zero-runtime-deps stance).
- **Published artifact**: first public release of `@collectshare/axi` to npm (manual `npm publish` outside this change's scope — this change only makes the package publish-ready and documents the dry-run/`npm pack` check).
- **Docs**: supersedes/absorbs `docs/design-axi-agent-experience-interface.md` as the working design source; that file can be retired once `design.md` here is in place.
- **Drift risk**: the local copy of the question/PII payload schema in `packages/axi/src/types.ts` must be kept in sync by hand whenever `apps/api`'s `insertQuestionsInFormSchema.ts` or `packages/shared`'s `QuestionType`/`ApiKeyScope` change; mitigated by an internal drift-detection test, not eliminated.
