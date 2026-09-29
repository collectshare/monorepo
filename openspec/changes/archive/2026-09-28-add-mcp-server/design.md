## Context

- `apps/api` is Clean Architecture on Lambda: every route is `lambdaHttpAdapter(controller)`, controllers extend `Controller<'public'|'private'|'apiKey'>` and run a Zod `@Schema` before `handle`. `lambdaHttpAdapter` also owns error mapping (`ZodError`, `HttpError`, `ApplicationError`, fallback 500) and expects either a Cognito JWT or a `ApiKeyAuthorizer` context on the event.
- `Controller.Request` carries `body/params/queryParams/accountId/ip/userAgent` but **not headers**, and controllers are unaware of the transport, so they can be invoked in-process.
- Private controllers already exist for the account-owned flows (`ListForms`, `CreateForm`, `UpdateFormDetails`, `InsertQuestionsInForm`, `GetFormSubmissions`); `GetForm`, `SearchDatasets`, `GetPublishedFormData` are public. `/v1` `External*` controllers require API-key scopes and are **not** used here.
- API Gateway HTTP API cannot customize authorizer denials, so it cannot return `WWW-Authenticate`; MCP clients need it (with `resource_metadata`) to discover OAuth.
- `add-mcp-oauth` delivers the `McpTokenAuthenticator` (`Bearer token → { accountId, grantId } | null`) and the discovery documents. This change assumes them.

## Goals / Non-Goals

**Goals:**
- One `POST /mcp` endpoint any MCP client can use after the OAuth login, exposing the 8 tools with the same permissions the user has in the web app.
- Zero duplication of business logic: tools are thin adapters over existing controllers.
- Fit the existing patterns (DI `Registry`, `Controller`, sls per-domain yml, shared error mapping).

**Non-Goals:**
- OAuth endpoints and token storage (`add-mcp-oauth`).
- MCP resources, prompts, sampling, elicitation, logging, progress notifications, SSE/streaming, sessions, resumability, JSON-RPC batching.
- API-key (`/v1`) access to MCP; scopes; per-tool authorization beyond ownership rules that already exist.
- Tools for form deletion, export files or account management.

## Decisions

### D1. Hand-written JSON-RPC instead of the MCP SDK
Only four methods are needed, everything is request/response, and Lambda + HTTP API has no response streaming. A small dispatcher (~150 lines) avoids adapting API Gateway events to web `Request/Response`, avoids the SDK's bundle/cold-start weight and its zod-version coupling. Revisit the SDK if resources/prompts/elicitation become goals.

### D2. Auth inside the Lambda via a dedicated adapter
`lambdaMcpAdapter` (new, next to `lambdaHttpAdapter`) reads `Authorization`, calls `McpTokenAuthenticator`, returns the `401 + WWW-Authenticate` on failure, and otherwise invokes `McpController` with `accountId`. The route has **no** API Gateway authorizer. It reuses `lambdaBodyParser`-style parsing but maps parse errors to JSON-RPC `-32700` instead of HTTP 400, and it does not go through `lambdaHttpAdapter` because that adapter's identity extraction is Cognito/API-key specific and `Controller.Request` has no headers.
The `WWW-Authenticate` URL is `<issuer>/.well-known/oauth-protected-resource/mcp` from `AppConfig.oauth.issuer` (defined by `add-mcp-oauth`).

### D3. `McpController` + `McpDispatcher` + tool registry
```
lambdaMcpAdapter ──accountId──▶ McpController (Controller<'private', JsonRpcResponse|void>)
                                   └─ McpDispatcher.handle(message, ctx)
                                        ├─ initialize / ping
                                        ├─ tools/list  ── ToolRegistry.list()
                                        └─ tools/call  ── ToolRegistry.get(name).execute(args, {accountId})
                                                              └─ controller.execute({ body, params, queryParams, accountId, ip, userAgent })
```
Each tool is a class/object `{ name, description, inputSchema, annotations, execute }` registered in `ToolRegistry`; `execute` maps flat MCP arguments to `{ body, params, queryParams }` (e.g. `update_form` takes `formId` + form fields → `params.formId` + `body`) and calls the injected controller's public `execute()`, so the controller's `@Schema` validation runs unchanged. Controllers are injected through the DI `Registry`; only the MCP Lambda pays their cold-start cost.
*Alternative:* proxying to the HTTP routes — adds a network hop and re-auth, rejected.

### D4. Tools use the private/public controllers, not `External*`
The login model has no scopes, and `External*` controllers gate on `ApiKeyScope`. Using the web-app controllers gives exactly "what the logged-in user can do in the web" and avoids inventing fake scopes. `accountId` is injected server-side; tool input schemas expose no `accountId`.

### D5. Input schemas derived from Zod
Body-based tools (`create_form`, `update_form`, `insert_questions`) build `inputSchema` with `zod-to-json-schema` from the existing controller schemas (`createFormSchema`, `updateFormSchema`, `insertQuestionsInFormSchema`) and merge path/query args (`formId`), so schema and validation cannot drift. Small hand-written JSON Schemas cover `list_forms`, `get_form`, `get_form_submissions`, `search_datasets`, `get_dataset_data`. A test asserts each `inputSchema` is a valid JSON Schema object and matches a sample valid call.
*Alternative:* hand-write all schemas — no dependency but drift-prone.

### D6. Errors: tool failure vs protocol failure
Extract from `lambdaHttpAdapter` a pure function `toErrorPayload(error) → { statusCode, code, message }` (Zod → validation with field list, `HttpError`, `ApplicationError`, else generic 500 + `console.log`). `lambdaHttpAdapter` keeps its behavior (existing test must still pass); `McpDispatcher` turns the payload into `{ isError: true, content: [{ type: 'text', text }] }`. Protocol errors (`-32700`, `-32600`, `-32601`, `-32602` for unknown tool/invalid params shape) are JSON-RPC errors. Bad tool arguments are execution errors (isError) so the model can correct itself.

### D7. Annotations and least-surprise
`readOnlyHint/destructiveHint/idempotentHint` are set per tool so clients can prompt before overwriting (`update_form` is full-replace, `insert_questions` deletes omitted questions). Descriptions explicitly state these semantics and that `nextCursor` must be passed back for the next page.

### D8. Response size control
LLM context is the scarce resource, not Lambda's 6 MB. `get_dataset_data` clamps `limit` (default 20, max 100) and forwards `nextCursor`. `GetFormSubmissionsUseCase` returns everything, so the tool applies `limit` (default 50, max 200) after fetching and adds `total`/`truncated`. If a serialized result still exceeds a hard ceiling (e.g. 400 KB), the tool returns `isError` asking the model to narrow the request rather than sending a truncated JSON blob.

### D9. Protocol details
Support versions `2025-11-25`, `2025-06-18`, `2025-03-26`; echo the client's version if supported, else the newest. Responses are always `200 application/json` (except 202/401/405). Batching is rejected because the 2025-06-18 revision dropped it. `MCP-Protocol-Version` header is read but not enforced. `Mcp-Session-Id` is never issued.

### D10. Infra
`sls/functions/mcp.yml`: `POST /mcp` and `GET /mcp` (returns 405 rather than a gateway 404), no authorizer, `timeout: 25` (covers `insert_questions` classification, under the 30s gateway cap). One Lambda for all tools.

## Risks / Trade-offs

- **Prompt injection**: `get_dataset_data`/`get_form_submissions` return third-party or respondent-written text next to write tools (`create_form`, `update_form`, `insert_questions`). → Destructive/write annotations so clients confirm, minimal tool set (no delete), README/docs guidance; the grant is per-user and revocable (follow-up UI in OAuth change).
- **Full-account access without scopes** (chosen for simplicity) → consent screen states it; can add scopes later by extending the token/grant.
- **Large `get_form_submissions`** loads all rows before slicing → acceptable for now; optimize the query with a limit later.
- **`zod-to-json-schema` edge cases** (`refine`, discriminated unions) → covered by the schema test; fall back to a hand-written schema for a tool if output is unusable.
- **Two auth code paths** (`lambdaHttpAdapter` vs `lambdaMcpAdapter`) → both thin; token logic lives in one service.
- **HTTP API 30s cap** → tools finishing later than ~25s fail; none are expected to.
- **Cold start** with ~8 controller trees resolved → measure after deploy; can lazy-resolve per tool if needed.

## Migration Plan

1. Deploy `add-mcp-oauth` first.
2. Deploy this change: new Lambda + routes only; nothing existing is altered except the internal extraction of the error mapper.
3. Verify with MCP Inspector (Streamable HTTP, OAuth) and claude.ai custom connector against `dev`.
4. Rollback: remove `mcp.yml` and the function; no data or schema migration.

## Open Questions

- Name/version reported in `serverInfo` (e.g. `collectshare-mcp`, package version).
- Whether `get_form` (public controller) should be limited to forms owned by the caller or stay public like `GET /forms/{formId}`; current decision: mirror the public route.
- Hard ceiling for a serialized tool result (400 KB proposed).
