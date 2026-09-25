## 1. Page scaffolding

- [x] 1.1 Create `apps/portal/src/views/pages/ApiDocs/` following the `Home`/`Dataset` page structure (`index.tsx` + sub-components as needed)
- [x] 1.2 Register the `/api-docs` route in `apps/portal/src/app/router` pointing at the new `ApiDocs` page, inside the existing `PortalLayout` route

## 2. Docs content — authentication & scopes

- [x] 2.1 Write the auth section: `x-api-key` header (and `Authorization: Bearer <key>` equivalent), `cs_sk_` key prefix, and the 401 conditions (missing/malformed/unknown/revoked/expired key)
- [x] 2.2 Write the scopes section: `portal:read` vs `data:read`, which endpoints each gates, and that scopes are independent (a key can hold one or both)

## 3. Docs content — endpoints

- [x] 3.1 Document `GET /v1/portal/search`: `portal:read`, optional `q`/`sort` query params, response shape (`results`), 401 on missing scope
- [x] 3.2 Document `GET /v1/portal/datasets/{formId}/data`: `portal:read`, `limit`/`cursor` query params, response shape (`rows`, `questions`, `nextCursor`), anonymization note, 404 for unpublished/unknown form, 401 on missing scope
- [x] 3.3 Document `GET /v1/forms`: `data:read`, no params, response shape (full `Form[]` for the key's account), 401 on missing scope
- [x] 3.4 Document `GET /v1/submissions/{formId}`: `data:read`, `limit`/`cursor` query params, response shape (`rows`, `nextCursor`), ownership rule (other-account form → error), 404 for unknown form, 401 on missing scope

## 4. Docs content — pagination & errors reference

- [x] 4.1 Write a shared pagination section covering `limit` default, the 1000-row ceiling, and following `nextCursor`
- [x] 4.2 Write a consolidated error reference table (401 / 404 / 405) with the triggering condition for each, cross-referenced from the endpoint sections

## 5. Topbar link

- [x] 5.1 Add an "API Docs" link to `apps/portal/src/views/layouts/PortalLayout/index.tsx`, in the header's `flex items-center gap-2` group, positioned before `ThemeSwitcher`
- [x] 5.2 Style the link with the shared `buttonVariants` (or equivalent `@monorepo/ui` primitive) consistent with the existing "Entrar" link

## 6. Verification

- [x] 6.1 Run `pnpm --filter portal lint` and `pnpm --filter portal typecheck`
- [ ] 6.2 Run `pnpm --filter portal dev` and manually verify: the topbar link appears next to the theme switcher on `/` and `/dataset/:formId`, navigates to `/api-docs`, and the page renders correctly in both light and dark theme
