## 1. Verify assumptions

- [x] 1.1 Check `apps/api/serverless.yml` `httpApi.cors` allows the `x-api-key` header from portal origins; add it to `allowedHeaders` if missing
- [x] 1.2 Confirm whether `apiKeyAuthorizer` accepts `Authorization: Bearer cs_sk_…`; document only what actually works

## 2. OpenAPI document

- [x] 2.1 Create `apps/portal/public/openapi.yaml` (OpenAPI 3.1): `info` with pt-BR Markdown description (auth, scopes, pagination, errors from the current page), prod `servers` entry, `apiKey` security scheme on header `x-api-key`, applied globally
- [x] 2.2 Add `components.schemas` for request bodies mirroring `createFormSchema`/`updateFormSchema` and `insertQuestionsInFormSchema` (incl. `piiStrategy`, `generalizationConfig`), and responses (search results, dataset data page with `rows`/`questions`/`nextCursor`, own submissions page, form list, `{ formId }`)
- [x] 2.3 Add the 7 `/v1` operations with params, bodies, responses (200/201/204 and 400/401/404/405 as applicable) and required scope in each description; tag them by scope group
- [x] 2.4 Validate the file with `npx @redocly/cli lint apps/portal/public/openapi.yaml` (one-off, not a dependency)

## 3. Swagger UI page

- [x] 3.1 Add `swagger-ui-react` (+ types) to `apps/portal`; confirm it installs cleanly with React 19
- [x] 3.2 Rewrite `views/pages/ApiDocs/index.tsx`: keep header and "Gerenciar chaves de API" link, render `<SwaggerUI url="/openapi.yaml" />` with `servers` overridden from `VITE_API_URL`
- [x] 3.3 Lazy-load the `ApiDocs` route in the portal router so Swagger UI is not in the main bundle
- [x] 3.4 Delete `endpoints.ts`, `EndpointCard.tsx`, `CodeBlock.tsx`
- [x] 3.5 `pnpm --filter @monorepo/portal typecheck && pnpm --filter @monorepo/portal build`; check `dist/openapi.yaml` exists and `/api-docs` renders and "Try it out" works against dev

## 4. Drift test

- [x] 4.1 Add a Vitest test in `apps/api` comparing `method path` pairs from `sls/functions/external.yml` with those in `../portal/public/openapi.yaml`, failing with the missing/stale routes listed
- [x] 4.2 `pnpm --filter @monorepo/api test` passes

## 5. Docs

- [x] 5.1 Update CLAUDE.md, `README.md`, `README.en.md`: spec location, `/openapi.yaml` URL, rule to update the spec when a `/v1` contract changes
