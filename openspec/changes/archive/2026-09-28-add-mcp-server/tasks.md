## 1. Shared error mapping

- [x] 1.1 Extract `toErrorPayload(error)` (Zod → validation list, `HttpError`, `ApplicationError`, fallback 500 with `console.log`) from `main/adapters/lambdaHttpAdapter.ts` into `main/utils/` and make the adapter use it; existing `lambdaHttpAdapter.test.ts` must pass unchanged, add tests for the extracted function.

## 2. JSON-RPC core

- [x] 2.1 Add JSON-RPC types/helpers under `application/mcp/` (request/notification/response/error builders, codes `-32700`, `-32600`, `-32601`, `-32602`).
- [x] 2.2 Implement `McpDispatcher`: message classification (request vs notification/response → 202), batch rejection, `initialize` (version negotiation for `2025-11-25`/`2025-06-18`/`2025-03-26`, `capabilities.tools`, `serverInfo`), `ping`, `tools/list`, `tools/call`, unknown method → `-32601`.
- [x] 2.3 Unit tests for the dispatcher covering every protocol scenario in the spec.

## 3. Tool registry and tools

- [x] 3.1 Define the `McpTool` contract (`name`, `description`, `inputSchema`, `annotations`, `execute(args, { accountId, ip, userAgent })`) and `ToolRegistry` (DI, list/get).
- [x] 3.2 Add `zod-to-json-schema` to `apps/api` and a helper that builds `inputSchema` from a Zod body schema plus extra path/query properties, with a test that the schemas for `create_form`, `update_form`, `insert_questions` are valid objects.
- [x] 3.3 Implement `list_forms` → `ListFormsController` and `get_form` → `GetFormController` (read-only).
- [x] 3.4 Implement `create_form` → `CreateFormController` and `update_form` → `UpdateFormDetailsController` (`formId` → `params`, remaining fields → `body`), with annotations per spec.
- [x] 3.5 Implement `insert_questions` → `InsertQuestionsInFormController` (destructive, idempotent annotations; description states omitted questions are deleted).
- [x] 3.6 Implement `get_form_submissions` → `GetFormSubmissionsController` with `limit` (default 50, max 200), `total`, `truncated`.
- [x] 3.7 Implement `search_datasets` → `SearchDatasetsController` and `get_dataset_data` → `GetPublishedFormDataController` with `limit` default 20 / max 100 and `nextCursor` passthrough.
- [x] 3.8 Result formatting: `text` content with JSON body, `isError` mapping via `toErrorPayload`, hard size ceiling returning an `isError` "narrow your request" message.
- [x] 3.9 Unit tests per tool (argument mapping, `accountId` injected from context and never from arguments, ownership rejection surfaced as `isError`, clamping/truncation).

## 4. Controller, adapter and wiring

- [x] 4.1 `McpController extends Controller<'private', …>` delegating to `McpDispatcher`; registers with `@Injectable()`.
- [x] 4.2 `main/adapters/lambdaMcpAdapter.ts`: read `Authorization: Bearer`, authenticate with `McpTokenAuthenticator` (from `add-mcp-oauth`), return `401` with `WWW-Authenticate: Bearer resource_metadata="<issuer>/.well-known/oauth-protected-resource/mcp"` (`error="invalid_token"` when a token was sent), ignore `x-api-key`, map JSON parse errors to `-32700`, return `202`/`200`/`405` as specified. Add tests (missing header, invalid token, PAT, valid token, GET).
- [x] 4.3 `main/functions/mcp/handler.ts` (with `import 'reflect-metadata'` first) resolving `McpController` and exporting the adapter handler.
- [x] 4.4 `sls/functions/mcp.yml`: `POST /mcp` and `GET /mcp`, no authorizer, `timeout: 25`; include it from `serverless.yml`; avoid function-name collisions with existing entries.
- [x] 4.5 `pnpm typecheck` in `apps/api`.

## 5. Verification

- [ ] 5.1 With a token obtained through `add-mcp-oauth`, exercise `initialize`, `tools/list` and each tool via curl / MCP Inspector against `dev`; confirm the 401 → OAuth discovery loop from a client with no token.
- [ ] 5.2 Confirm `x-api-key` / `cs_sk_` and a Cognito access token are rejected by `/mcp`, and that another account's `formId` returns `isError` on `update_form`, `insert_questions` and `get_form_submissions`.
- [ ] 5.3 Connect claude.ai (custom connector) and Claude Code end to end; note cold-start and latency of `insert_questions`.

## 6. Documentation

- [x] 6.1 Document the endpoint, tool catalog, limits, and connection steps for claude.ai / Claude Code in the repo docs and add an "MCP Server" section to `CLAUDE.md`.
- [x] 6.2 Document the prompt-injection consideration (third-party dataset/respondent content alongside write tools) and the destructive semantics of `update_form` / `insert_questions`.
