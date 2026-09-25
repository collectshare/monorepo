## Context

`apps/portal` is a public, unauthenticated Vite app (routes: `/` search, `/dataset/:formId`) sharing `@monorepo/ui` components with `apps/web`. The external API it should document lives entirely under `/v1/*` in `apps/api`:

- `GET /v1/portal/search` — dataset search (`portal:read`)
- `GET /v1/portal/datasets/{formId}/data` — anonymized published dataset rows + `questions`, cursor-paginated (`portal:read`)
- `GET /v1/forms` — key owner's own forms (`data:read`)
- `GET /v1/submissions/{formId}` — key owner's own raw submission data, cursor-paginated (`data:read`)

Auth: Lambda REQUEST authorizer (`apiKeyAuthorizer`) validates an `x-api-key` / `Authorization: Bearer` header carrying a `cs_sk_`-prefixed key, hashed and looked up; scopes (`portal:read`, `data:read`) gate routes independently. Today the only reference for this contract is `apps/api/http/external.http` and archived OpenSpec changes — nothing public-facing exists. `PortalLayout` (`apps/portal/src/views/layouts/PortalLayout/index.tsx`) already renders a header with an external "Entrar" link and a `ThemeSwitcher`; the new docs link slots in next to it.

## Goals / Non-Goals

**Goals:**
- Add a `/api-docs` route + page in `apps/portal` documenting the full `/v1/*` contract: base URL, auth header/scopes, each endpoint's method/path/params/response/errors, pagination rules, and error status codes.
- Link to it from `PortalLayout`'s header, next to `ThemeSwitcher`, visible on every portal page.
- Keep content statically authored TSX/markdown-in-JSX, matching the current `/v1/*` behavior as of this change.

**Non-Goals:**
- No live/generated OpenAPI spec, Swagger UI, or "try it" console — out of scope for this change.
- No changes to `apps/api` external controllers, routes, or scopes.
- No auth-gating of the docs page itself — it's public, like the rest of the portal.
- No i18n — content is authored in whichever single language the rest of the portal currently uses (Portuguese, matching "Entrar").

## Decisions

- **Static hand-authored page over generated docs**: The `/v1/*` surface is small (4 endpoints) and stable; a generated OpenAPI/Swagger pipeline would add a build step and dependency for marginal benefit at this scale. Revisit if the external API surface grows significantly.
- **New top-level page under `views/pages/ApiDocs`**, following the existing `Home`/`Dataset` page structure, registered in `app/router` as `/api-docs`. Kept as a single page (not nested per-endpoint routes) since the content is a single reference document; in-page anchors/sections handle navigation between endpoints.
- **Nav link placement**: added as a plain link in `PortalLayout`'s header `<div className="flex items-center gap-2">`, positioned before `ThemeSwitcher` (after "Entrar") so the theme switcher remains the right-most control, matching the proposal's "next to the theme switcher" placement.
- **Content sourcing**: transcribed directly from `apps/api/sls/functions/external.yml`, `apps/api/src/application/controllers/external/*`, and the archived spec deltas under `openspec/changes/archive/2026-09-25-rename-external-api-to-v1/specs/*` — not auto-synced; a future change must update this page if the `/v1/*` contract changes.

## Risks / Trade-offs

- **Docs drift from actual API behavior** → Mitigation: keep the page's content close to the archived spec language so future `/v1/*` changes have a clear source to diff against; call this out as a maintenance note in the page itself (or PR description) so future API changes remember to update it.
- **No interactive request builder** means developers still need `curl`/Postman/the `.http` file to try calls → acceptable for now; documented as a Non-Goal.

## Migration Plan

- Purely additive: new route, new page, one new nav link. No data migration, no backend deploy required, no feature flag needed — ships as a normal portal frontend deploy.
- Rollback: revert the portal commit; no persisted state to clean up.
