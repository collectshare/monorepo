## Why

The `/api-docs` page in the portal is a hand-written React page backed by `endpoints.ts` — prose descriptions of params, bodies and responses that nobody can import into a tool, generate a client from, or call interactively. Moving the `/v1` contract to an OpenAPI 3.1 document rendered with Swagger UI gives integrators a standard, machine-readable spec (Postman/Insomnia import, codegen) and a "Try it out" console, while the docs page stops being a second copy of the contract written in JSX.

## What Changes

- Add a single OpenAPI 3.1 document describing every `/v1/*` route (params, request bodies, response schemas, `x-api-key` security scheme, per-route scope, error responses). The prose sections of today's page (authentication, scopes, pagination, errors) move into the spec's `info.description` and per-operation descriptions.
- Publish the document as a static file at `/openapi.yaml` on the portal, so it is downloadable/importable by URL.
- Replace the body of the portal `/api-docs` page with Swagger UI rendering that document (keeping the page title and the "Gerenciar chaves de API" link). "Try it out" targets the API base URL from `VITE_API_URL`.
- **Remove** `apps/portal/src/views/pages/ApiDocs/endpoints.ts`, `EndpointCard.tsx` and `CodeBlock.tsx` (superseded by the spec).
- Add a drift check in `apps/api` tests: every `/v1` route declared in `sls/functions/external.yml` must have a matching path + method in the OpenAPI document, and vice versa.
- Update CLAUDE.md / READMEs: "update `openapi.yaml` when a `/v1` contract changes".

## Capabilities

### New Capabilities
- `api-openapi-docs`: OpenAPI 3.1 document for the `/v1` external API, served by the portal, rendered with Swagger UI at `/api-docs`, and kept in sync with the declared routes by a test.

### Modified Capabilities
<!-- none: openspec/specs/ has no published specs yet; the archived portal-api-docs-page change is superseded by the new capability -->

## Impact

- `apps/portal`: new dependency `swagger-ui-react` (lazy-loaded only on `/api-docs`), new `public/openapi.yaml`, rewritten `views/pages/ApiDocs/`.
- `apps/api`: one new Vitest test reading `sls/functions/external.yml` and the spec; no runtime/API behavior change.
- No change to `/v1` endpoints, auth, or deploy pipeline (the spec ships with the portal's existing `vite build` + S3 sync).
- Docs: CLAUDE.md, `README.md`, `README.en.md`.
