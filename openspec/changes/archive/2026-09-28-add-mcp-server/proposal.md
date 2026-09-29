## Why

Users should be able to connect an AI client (claude.ai, Claude Code, Cursor) to Collectshare and ask it to list, build and analyze their forms and to explore published datasets. The Model Context Protocol (MCP) is the standard way to expose that as tools. The connection is authenticated by logging in through the OAuth flow delivered in `add-mcp-oauth`; API keys (PATs) remain exclusive to the `/v1` REST API.

## What Changes

- Add `POST /mcp`, a stateless MCP server over the Streamable HTTP transport in JSON-response mode, hand-written JSON-RPC 2.0 (no MCP SDK): `initialize`, `ping`, `tools/list`, `tools/call`; client notifications get `202`; `GET /mcp` returns `405`.
- `/mcp` does **not** use an API Gateway authorizer (HTTP API cannot emit `WWW-Authenticate`). A new Lambda adapter authenticates the `Authorization: Bearer cs_mat_…` header with the `McpTokenAuthenticator` from `add-mcp-oauth`, and answers `401` with `WWW-Authenticate: Bearer resource_metadata="<issuer>/.well-known/oauth-protected-resource/mcp"` so clients start the OAuth flow. PATs (`x-api-key` / `cs_sk_`) and Cognito tokens are not accepted.
- Expose **8 tools** that call the existing controllers in-process with the token's `accountId` (the same code path as the web app, so ownership checks are inherited and no `accountId` is ever accepted from the model):
  - `list_forms`, `get_form`, `create_form`, `update_form`, `insert_questions`, `get_form_submissions` (account-owned forms/data);
  - `search_datasets`, `get_dataset_data` (published datasets from the open-data portal).
  Tools carry MCP annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`) so clients can ask for confirmation before writes/overwrites.
- Errors: validation, not-found, not-allowed and other application errors become `result.isError = true` with a readable message (so the model can self-correct); only protocol problems are JSON-RPC errors.
- Bound response sizes: `get_dataset_data` `limit` capped at 100 (default 20) with `nextCursor`; `get_form_submissions` gets a `limit` (default 50, max 200) with `total`/`truncated`.
- Extract the HTTP adapter's error mapping into a reusable function shared by `lambdaHttpAdapter` and the MCP layer.
- Lambda timeout sized for the slowest tool (`insert_questions` uses 15s today).
- Document the prompt-injection consideration: dataset content from third parties reaches the model alongside write tools.

## Capabilities

### New Capabilities
- `mcp-server`: MCP Streamable HTTP endpoint at `/mcp`, OAuth bearer protection, protocol methods and the 8-tool catalog with their behaviors and limits.

### Modified Capabilities
- (none — the `/v1` API, PATs and existing controllers keep their behavior; the refactor of error mapping is internal)

## Impact

- **Depends on**: `add-mcp-oauth` (tokens, `McpTokenAuthenticator`, discovery endpoints). Deploy that change first.
- **Affected code (`apps/api`)**:
  - `sls/functions/mcp.yml` (new) — `POST /mcp` and `GET /mcp`, no authorizer, explicit timeout; included from `serverless.yml`.
  - `src/main/functions/mcp/handler.ts` (new) and `src/main/adapters/lambdaMcpAdapter.ts` (new, bearer auth + 401 header).
  - `src/application/mcp/` (new) — JSON-RPC dispatcher, tool registry, one file per tool (arg → `body/params/queryParams` mapping, JSON Schema, annotations).
  - `src/main/utils/` — extracted error-to-payload mapper used by `lambdaHttpAdapter` and MCP.
  - Reuses `ListFormsController`, `GetFormController`, `CreateFormController`, `UpdateFormDetailsController`, `InsertQuestionsInFormController`, `GetFormSubmissionsController`, `SearchDatasetsController`, `GetPublishedFormDataController`.
- **Dependencies**: `zod-to-json-schema` (zod v3) to derive tool input schemas from the existing body schemas.
- **APIs**: one new route; no change to `/v1`, private or portal routes.
- **Docs**: usage instructions (how to add the connector in claude.ai / Claude Code) and the security note above.
