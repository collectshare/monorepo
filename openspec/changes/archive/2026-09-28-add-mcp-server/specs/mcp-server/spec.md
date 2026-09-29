## ADDED Requirements

### Requirement: MCP endpoint uses stateless Streamable HTTP with JSON responses
The system SHALL expose `POST /mcp` accepting one JSON-RPC 2.0 message per request and answering with `Content-Type: application/json`, without sessions (no `Mcp-Session-Id`) and without SSE. Requests that are JSON-RPC notifications or responses (no `id`, or a `result`/`error` payload) SHALL be answered `202` with no body. `GET /mcp` SHALL return `405` with `Allow: POST`. A malformed JSON body SHALL yield a JSON-RPC `-32700` error, a structurally invalid request `-32600`, an unknown method `-32601`, and a JSON-RPC batch array `-32600`.

#### Scenario: Request/response over POST
- **WHEN** an authenticated client posts a valid JSON-RPC request with an `id`
- **THEN** the system returns `200` with a JSON-RPC response carrying the same `id`

#### Scenario: Notification is acknowledged
- **WHEN** an authenticated client posts `{"jsonrpc":"2.0","method":"notifications/initialized"}`
- **THEN** the system returns `202` with an empty body

#### Scenario: GET is not supported
- **WHEN** a client calls `GET /mcp`
- **THEN** the system returns `405` with `Allow: POST`

#### Scenario: Malformed JSON
- **WHEN** an authenticated client posts a body that is not valid JSON
- **THEN** the system returns a JSON-RPC error with code `-32700`

#### Scenario: Unknown method
- **WHEN** an authenticated client posts a request with a method the server does not implement
- **THEN** the system returns a JSON-RPC error with code `-32601`

#### Scenario: Batch is rejected
- **WHEN** an authenticated client posts a JSON array of messages
- **THEN** the system returns a JSON-RPC error with code `-32600`

### Requirement: MCP requests require an MCP OAuth access token
Every `POST /mcp` request SHALL be authenticated inside the Lambda from the `Authorization: Bearer <token>` header using the MCP access-token authentication service. When the header is missing or the token is invalid, expired, revoked, a `cs_sk_` API key, or a Cognito token, the system SHALL return HTTP `401` with `WWW-Authenticate: Bearer resource_metadata="<issuer>/.well-known/oauth-protected-resource/mcp"` (adding `error="invalid_token"` when a token was presented) and SHALL NOT process the JSON-RPC message. The `x-api-key` header SHALL NOT authenticate `/mcp`.

#### Scenario: No credentials
- **WHEN** a client posts to `/mcp` without an `Authorization` header
- **THEN** the system returns `401` with `WWW-Authenticate` containing the `resource_metadata` URL

#### Scenario: Expired or unknown token
- **WHEN** a client posts with `Authorization: Bearer <expired-or-unknown-token>`
- **THEN** the system returns `401` with `WWW-Authenticate` containing `error="invalid_token"`

#### Scenario: PAT is not accepted
- **WHEN** a client posts with a valid `x-api-key: cs_sk_…` header or `Authorization: Bearer cs_sk_…`
- **THEN** the system returns `401`

#### Scenario: Valid token
- **WHEN** a client posts with a valid access token
- **THEN** the JSON-RPC message is processed on behalf of the token's account

### Requirement: Server negotiates protocol version and advertises tools
On `initialize` the system SHALL respond with `protocolVersion` (the client's requested version when supported, otherwise the latest version the server supports), `capabilities: { tools: { listChanged: false } }` and `serverInfo` (name and version). `ping` SHALL return an empty result.

#### Scenario: Initialize with a supported version
- **WHEN** an authenticated client sends `initialize` with a supported `protocolVersion`
- **THEN** the response echoes that version, advertises the `tools` capability and includes `serverInfo`

#### Scenario: Initialize with an unsupported version
- **WHEN** an authenticated client sends `initialize` with a `protocolVersion` the server does not support
- **THEN** the response carries the latest version the server supports

#### Scenario: Ping
- **WHEN** an authenticated client sends `ping`
- **THEN** the response `result` is `{}`

### Requirement: tools/list exposes the tool catalog with schemas and annotations
`tools/list` SHALL return exactly these tools, each with `name`, `description`, a JSON Schema `inputSchema` (type `object`) and `annotations`: `list_forms`, `get_form`, `create_form`, `update_form`, `insert_questions`, `get_form_submissions`, `search_datasets`, `get_dataset_data`. Read-only tools (`list_forms`, `get_form`, `get_form_submissions`, `search_datasets`, `get_dataset_data`) SHALL be annotated `readOnlyHint: true`; `create_form` SHALL be `readOnlyHint: false, destructiveHint: false`; `update_form` and `insert_questions` SHALL be `readOnlyHint: false, destructiveHint: true, idempotentHint: true`. `inputSchema` for body-based tools SHALL be derived from the same Zod schemas the controllers validate with. No tool's schema SHALL contain an `accountId` property.

#### Scenario: List tools
- **WHEN** an authenticated client sends `tools/list`
- **THEN** the result contains the eight tools above with `inputSchema` and `annotations`

#### Scenario: Destructive tools are flagged
- **WHEN** a client reads the annotations of `update_form` and `insert_questions`
- **THEN** both have `destructiveHint: true` and `readOnlyHint: false`

### Requirement: Tools act only on behalf of the token's account
`tools/call` SHALL execute the mapped existing controller in-process, passing the `accountId` resolved from the access token and never any value supplied in `arguments`. Account-owned tools (`list_forms`, `create_form`, `update_form`, `insert_questions`, `get_form_submissions`) SHALL apply the same ownership rules as the web app. On success the result SHALL contain a `text` content item with the JSON-serialized controller response body and `isError: false`.

#### Scenario: List own forms
- **WHEN** an authenticated client calls `list_forms`
- **THEN** the result contains only the forms owned by the token's account

#### Scenario: Create a form
- **WHEN** an authenticated client calls `create_form` with a valid `title`
- **THEN** a form is created for the token's account and the result contains its `formId`

#### Scenario: Update a form
- **WHEN** an authenticated client calls `update_form` with a `formId` owned by the account and a valid body
- **THEN** the form's details are replaced and the result reports success

#### Scenario: Replace questions
- **WHEN** an authenticated client calls `insert_questions` with a `formId` owned by the account and a non-empty `questions` array
- **THEN** the form's questions are created/updated/removed with the same semantics as the web app and the result reports success

#### Scenario: Another account's form
- **WHEN** an authenticated client calls `update_form`, `insert_questions` or `get_form_submissions` with a `formId` owned by a different account
- **THEN** the result has `isError: true` with a not-allowed message and no data is changed or returned

#### Scenario: Extra accountId argument is ignored
- **WHEN** a client passes an `accountId` property in `arguments`
- **THEN** it has no effect on which account the tool acts for

### Requirement: Public dataset tools mirror the open-data portal
`search_datasets` (arguments `q`, `sort`) and `get_dataset_data` (arguments `formId`, `cursor`, `limit`) and `get_form` (argument `formId`) SHALL return the same data as the corresponding public portal/form controllers. `get_dataset_data` SHALL only return data of published datasets.

#### Scenario: Search datasets
- **WHEN** an authenticated client calls `search_datasets` with `q: "saúde"`
- **THEN** the result contains the matching published dataset records

#### Scenario: Unpublished dataset
- **WHEN** an authenticated client calls `get_dataset_data` for a form that is not published
- **THEN** the result has `isError: true` with a not-found message

### Requirement: Tool errors are results, protocol errors are JSON-RPC errors
Failures raised while executing a tool (Zod validation errors, application errors such as not-found/not-allowed, unexpected errors) SHALL be returned as a successful JSON-RPC response whose result has `isError: true` and a `text` content item describing the problem (validation errors listing field and message; unexpected errors with a generic message and no internals). A `tools/call` for an unknown tool name or without `name`/object `arguments` SHALL return a JSON-RPC `-32602` error. The error-to-message mapping SHALL be shared with `lambdaHttpAdapter` so both surfaces classify errors identically.

#### Scenario: Validation failure
- **WHEN** a client calls `create_form` without `title`
- **THEN** the response is a JSON-RPC success with `result.isError: true` and text naming the `title` field

#### Scenario: Resource not found
- **WHEN** a client calls `get_dataset_data` with a `formId` that does not exist
- **THEN** the response has `result.isError: true` with a not-found message

#### Scenario: Unknown tool
- **WHEN** a client calls a tool name that is not in the catalog
- **THEN** the response is a JSON-RPC error with code `-32602`

#### Scenario: Unexpected failure
- **WHEN** a tool throws an unexpected error
- **THEN** the result has `isError: true` with a generic message and the error details are only logged server-side

### Requirement: Tool responses are bounded
`get_dataset_data` SHALL default `limit` to 20, clamp it to a maximum of 100, and return `nextCursor` when more rows exist. `get_form_submissions` SHALL accept `limit` (default 50, maximum 200) and return at most that many submissions together with `total` (number available) and `truncated` (boolean).

#### Scenario: Dataset limit is clamped
- **WHEN** a client calls `get_dataset_data` with `limit: 1000`
- **THEN** at most 100 rows are returned and `nextCursor` is present when more exist

#### Scenario: Submissions are truncated
- **WHEN** a form has more submissions than the effective `limit`
- **THEN** the result contains `limit` submissions, `total` with the full count and `truncated: true`
