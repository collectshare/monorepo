## Context

`/api-docs` (`apps/portal/src/views/pages/ApiDocs/`) renders hand-written prose: `endpoints.ts` holds 7 endpoints with param/body/response descriptions as Portuguese strings, plus JSX sections for auth, scopes, pagination and errors. The real contract lives in the API's Zod schemas (`createFormSchema`, `updateFormSchema`, `insertQuestionsInFormSchema`) and controllers. Nothing machine-readable exists, and there is no check that the docs match the routes.

## Goals / Non-Goals

**Goals:**
- One OpenAPI 3.1 file as the published contract for `/v1`.
- Swagger UI at `/api-docs` with working "Try it out".
- A cheap test that catches route/spec drift.

**Non-Goals:**
- Generating the spec from Zod schemas or controllers.
- Documenting Cognito product routes, `/portal/*`, `/oauth/*` or `/mcp`.
- Generating typed clients/SDKs.
- Serving the spec from the API itself.

## Decisions

**Hand-written YAML, not generated from Zod.** Only 7 routes and 3 request schemas; response shapes aren't described by Zod at all, so a generator (`@asteasolutions/zod-to-openapi`) would still need hand-written response schemas plus registry wiring and a build step. A static file is less code. The drift test covers the part that actually breaks (routes appearing/disappearing). Revisit if `/v1` grows well past ~15 routes.

**File lives at `apps/portal/public/openapi.yaml`.** Vite copies `public/` as-is, so the existing build + S3 sync publishes it at `/openapi.yaml` with no pipeline change. Swagger UI loads it via `url: '/openapi.yaml'`. Alternative (in `packages/shared` or `apps/api`) needs extra copy/import plumbing for no gain.

**Swagger UI via `swagger-ui-react`, lazy-loaded.** It's the de-facto renderer the user asked for; `React.lazy` on the `ApiDocs` route keeps its ~1 MB out of the main portal bundle. Alternatives: CDN `<script>` (pins an external origin at runtime), Redoc/Scalar (no "Swagger" ask, Redoc has no try-it-out). `servers` is overridden at render time from `VITE_API_URL` so dev/prod portals hit their own API; the file itself lists prod as default.

**Prose moves into the spec.** Auth/scopes/pagination/error tables go into `info.description` (Markdown, rendered by Swagger UI) and per-operation `description`/`responses`; the page keeps only its header and the API-keys link. Keep descriptions in pt-BR, as today.

**Drift test in `apps/api` with no new deps.** Read `sls/functions/external.yml` and `../portal/public/openapi.yaml` as text, extract `method`/`path` pairs with regexes (the files are simple and regular), compare sets both ways. Avoids adding a YAML parser just for a test. Comment it as a `ponytail:` shortcut — switch to a YAML parser if the files' shape gets irregular.

## Risks / Trade-offs

- [Response/body schemas drift from Zod/controllers — the test only checks routes] → CLAUDE.md rule "update `openapi.yaml` when a `/v1` contract changes"; field-level drift is accepted.
- ["Try it out" blocked by CORS: browser sends `x-api-key` from the portal origin] → portal origins are already in `serverless.yml` `allowedOrigins`; verify `x-api-key` is in `allowedHeaders` (task 1.1) and add it if missing.
- [Current page says `Authorization: Bearer <key>` also works, but `apiKeyAuthorizer` only reads `x-api-key`] → spec documents only `x-api-key` unless verification shows Bearer is actually accepted.
- [Swagger UI default styling clashes with the portal theme / dark mode] → accept default light styling inside a contained card; no custom theme.
- [`swagger-ui-react` peer range vs React 19] → check at install; fall back to `swagger-ui-dist` + `SwaggerUIBundle` in a `useEffect` if it doesn't resolve.

## Migration Plan

Ships with a normal portal release; the old page is replaced in the same deploy. Rollback = revert the commit. No data or API changes.
