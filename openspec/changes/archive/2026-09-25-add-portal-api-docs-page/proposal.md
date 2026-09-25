## Why

The `/v1/*` external API (dataset search, published dataset data, own-forms listing, own-submission data) is only documented in an internal `.http` scratch file and OpenSpec change history. External consumers who obtain an API key (`cs_sk_...`) via `apps/web` have no public reference for base URL, endpoints, auth header, scopes, pagination, or error shapes. `apps/portal` is the public-facing surface of the product, so it's the right place to host developer-facing documentation for the API that portal itself is a client of.

## What Changes

- Add a new public, unauthenticated page in `apps/portal` at `/api-docs` documenting the `/v1/*` external API: authentication (`x-api-key` / `Authorization: Bearer`, `cs_sk_` prefix), scopes (`portal:read`, `data:read`), each of the four endpoints (method, path, query/path params, response shape, errors), pagination (`limit`/`cursor`, 1000-row ceiling), and error responses (401, 404, 405).
- Add a "API Docs" link to `PortalLayout`'s header, next to the `ThemeSwitcher`, that routes to `/api-docs`.
- Documentation content is static (hand-authored from the current `/v1/*` contract), not generated from a live OpenAPI spec.

## Capabilities

### New Capabilities
- `portal-api-docs-page`: public portal page rendering reference documentation for the `/v1/*` external API, linked from the portal topbar.

### Modified Capabilities
(none — no existing `/v1/*` API behavior changes; this is a documentation-only addition)

## Impact

- **Affected code**: `apps/portal/src/app/router` (new route), `apps/portal/src/views/pages` (new `ApiDocs` page), `apps/portal/src/views/layouts/PortalLayout/index.tsx` (new nav link).
- **No API changes**: `apps/api` external controllers/routes (`sls/functions/external.yml`, `src/application/controllers/external/*`) are the source of truth being documented, not modified.
- **No shared package changes**: purely a portal-app addition; content is hand-written prose/tables in the new page, not sourced from `@monorepo/shared`.
