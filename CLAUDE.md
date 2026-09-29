# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack Overview

**Monorepo** managed with pnpm workspaces + Turborepo.

- `apps/api` — Serverless Framework (AWS Lambda, DynamoDB, Cognito, S3, SQS), TypeScript
- `apps/web` — React 19 + Vite + TailwindCSS v4 + TanStack Query, TypeScript — the authenticated product (form building, submissions, account/API-key management)
- `apps/portal` — React 19 + Vite + TailwindCSS v4 + TanStack Query, TypeScript — **public, unauthenticated** open-data portal: search published datasets and browse their paginated raw data. No route requires login.
- `packages/shared` — Entities, types, and enums shared between api, web, and portal
- `packages/ui` — Shared design-system components (`Button`, `Card`, `Badge`, `Input`, `Table`, `DataTable`, theme tokens) consumed by both `apps/web` and `apps/portal` via `@monorepo/ui`. Add or change a component here rather than duplicating it in one app.

## Commands

### Root (runs all apps via Turborepo)

```bash
pnpm dev        # Start all dev servers
pnpm build      # Build all apps
pnpm lint       # Lint all apps
pnpm clean      # Clean all build artifacts and node_modules
```

### API (`apps/api`)

```bash
pnpm typecheck          # TypeScript check (no emit)
pnpm test               # Vitest (uses SWC so decorator metadata / DI wiring is real)
pnpm dev:email          # Preview email templates (react-email dev server)
pnpm deploy             # Deploy to AWS (sls deploy --stage dev)
```

The API has no local dev server — it's deployed to AWS. Use `pnpm typecheck` during development.

### Web (`apps/web`)

```bash
pnpm dev                # Vite dev server (localhost:5173)
pnpm build              # tsc + vite build
pnpm lint               # ESLint
pnpm typecheck          # TypeScript check (no emit)
pnpm preview            # Preview production build
pnpm validate:env       # Validate environment variables
```

### Portal (`apps/portal`)

```bash
pnpm dev                # Vite dev server
pnpm build              # tsc + vite build
pnpm lint               # ESLint
pnpm typecheck          # TypeScript check (no emit)
pnpm preview            # Preview production build
```

Public, unauthenticated app — no auth context, no token handling. It only calls the public `/portal/*` endpoints on `apps/api` (never Algolia directly from the browser).

### Dev Environment

`start-dev.sh` creates a tmux session (`collectshare`) with three windows: `root`, `api`, and `web`.

## API Architecture (Clean Architecture)

```
src/
  main/           # Lambda entrypoints — wires DI and wraps with adapters
  application/    # Controllers, use cases, contracts, errors
  infra/          # AWS clients, DynamoDB repositories, gateways (Cognito, S3)
  kernel/         # DI container (Registry), decorators (@Injectable, @Schema)
  shared/         # Internal shared config/types (not the workspace package)
```

### Dependency Injection

The API uses a custom DI container (`kernel/di/Registry`). Classes decorated with `@Injectable()` auto-register themselves in the global `Registry` singleton at module load time. `Registry.resolve(SomeClass)` recursively constructs the dependency tree using `reflect-metadata`.

**Adding a new injectable class**: decorate it with `@Injectable()`. Its constructor parameters must also be `@Injectable()` classes — the registry resolves them automatically.

### Lambda Function Wiring

Each Lambda handler follows this pattern:

```ts
// main/functions/{domain}/someAction.ts
import 'reflect-metadata';  // must be first
const controller = Registry.getInstance().resolve(SomeController);
export const handler = lambdaHttpAdapter(controller);
```

Four adapters exist in `main/adapters/`: `lambdaHttpAdapter` (API GW), `lambdaDynamoAdapter` (DynamoDB Streams), `lambdaS3Adapter` (S3 events), `lambdaSQSAdapter` (SQS).

### Controller Pattern

Controllers extend `Controller<'public' | 'private', ResponseBody>`. Use `@Schema(zodSchema)` for automatic Zod body validation. Private controllers receive `accountId` (extracted from the Cognito JWT claim `internalId` by the HTTP adapter).

```ts
@Injectable()
@Schema(mySchema)
export class MyController extends Controller<'private', MyController.Response> {
  constructor(private readonly myUseCase: MyUseCase) { super(); }

  protected override async handle({ body, accountId }: Controller.Request<'private', MyBody>) {
    // ...
  }
}
```

### DynamoDB Single-Table Design

- Items are defined in `infra/database/dynamo/items/` — each has static `getPK/getSK/getGSI1PK` helpers and `fromEntity/toEntity` mappers.
- Repositories in `infra/database/dynamo/repositories/` use those items for typed DynamoDB access.
- Unit-of-work classes in `infra/database/dynamo/uow/` batch multiple writes atomically.

### Serverless Config

Functions are declared in `sls/functions/{domain}.yml` and resources in `sls/resources/`. The main `serverless.yml` composes them. Auth uses API Gateway JWT authorizer backed by Cognito.

### Public Portal Endpoints

`sls/functions/portal.yml` declares unauthenticated (`public` controller) HTTP routes consumed by `apps/portal`:

- `GET /portal/search` — proxies to Algolia (via `infra/gateways/AlgoliaGateway.ts`); the browser never calls Algolia directly.
- `GET /portal/datasets/{formId}` — published form metadata.
- `GET /portal/datasets/{formId}/data` — cursor-paginated raw submission data.

These only serve forms with `isPublished === true` (`Form` entity field, opt-out default). A DynamoDB stream consumer (`OnFormChangedUseCase` → `main/functions/form/onFormChanged.ts`) keeps the Algolia index in sync with `isPublished` changes.

### MCP OAuth (authorization server)

`apps/api` is also a small OAuth 2.1 authorization server so MCP clients (claude.ai, Claude Code, Cursor) can act on behalf of a logged-in user. Cognito only proves identity — it has no Hosted UI and no Dynamic Client Registration here — and the MCP endpoint that consumes these tokens is `POST /mcp` (see MCP Server below). API keys (PATs, `cs_sk_…`) stay exclusive to `/v1`.

- Discovery: `GET /.well-known/oauth-protected-resource[/mcp]`, `GET /.well-known/oauth-authorization-server` (`authorization_endpoint` is the `apps/web` consent page `/oauth/authorize`).
- `POST /oauth/register` — stateless DCR; the `client_id` is an HMAC-signed blob of the registered `redirect_uris`. Allowed redirects: claude.ai/claude.com callbacks, `http` loopback (any port), plus `MCP_OAUTH_EXTRA_REDIRECT_URIS` (comma-separated, exact match).
- `GET`/`POST /oauth/authorize` — **Cognito-authorized JSON endpoints** called by the web consent page (validate, then approve/deny → `redirectTo`). Not the browser-facing authorization endpoint.
- `POST /oauth/token` — `authorization_code` (PKCE `S256` only) and `refresh_token`, form-urlencoded or JSON.
- Tokens are opaque and Collectshare-owned: access `cs_mat_…` (1h), refresh `cs_mrt_…` (30d, rotated; reusing a spent refresh token revokes the grant). Only their HMAC is stored (items `OAUTH_CODE#`, `MCPGRANT#`, `MCPTOKEN#` in the main table; `expiresAt` in epoch **seconds** so DynamoDB TTL applies). They are not valid on Cognito-authorized or `/v1` routes.
- `McpTokenAuthenticator` (`application/oauth/`) resolves a raw access token to `{ accountId, grantId }`; the `/mcp` Lambda must call it itself because API Gateway HTTP API authorizers cannot emit `WWW-Authenticate`.
- Config (deploy-time env): `WEB_APP_URL` (required), `MCP_OAUTH_EXTRA_REDIRECT_URIS` (optional), and the issuer, derived in `sls/config/env.yml` as `https://$API_DOMAIN_NAME` when the custom domain is configured, otherwise the `execute-api` URL. On the default `execute-api` host, recreating the stack changes the issuer and clients must reconnect.
- `apps/web`: `/oauth/authorize` page (sign-in with `returnTo` if needed, then Authorize/Cancel). It refuses to render inside a frame; also set `frame-ancestors 'none'` for that path on the web CloudFront distribution (not managed in this repo).
- Verify a deployed stack with `API_URL=… EMAIL=… PASSWORD=… pnpm --filter @monorepo/api verify:mcp-oauth`.

### MCP Server (`POST /mcp`)

A stateless [Model Context Protocol](https://modelcontextprotocol.io) server (Streamable HTTP, JSON responses, hand-written JSON-RPC, no SDK) so AI clients can work on the logged-in user's Collectshare account. Connect it in claude.ai (custom connector), Claude Code (`claude mcp add --transport http collectshare https://<api>/mcp`) or Cursor by giving the `/mcp` URL; the client starts the OAuth login described above.

- **Auth:** `Authorization: Bearer cs_mat_…` (an MCP OAuth access token). `lambdaMcpAdapter` authenticates inside the Lambda — no API Gateway authorizer, because HTTP API cannot add `WWW-Authenticate` — and answers `401` with `WWW-Authenticate: Bearer resource_metadata="<issuer>/.well-known/oauth-protected-resource/mcp"`. PATs (`x-api-key`, `cs_sk_…`) and Cognito tokens are **not** accepted.
- **Protocol:** `initialize`, `ping`, `tools/list`, `tools/call`; notifications get `202`; `GET /mcp` is `405`; JSON-RPC batches are rejected.
- **Code:** `application/mcp/` (`McpDispatcher`, `ToolRegistry`, `McpTool` base, `tools/`), `McpController`, `main/adapters/lambdaMcpAdapter.ts`, `sls/functions/mcp.yml` (timeout 25s).
- **Tools** (each is a thin adapter over an existing controller, run in-process as the token's account; the account is never read from arguments):

| Tool | Runs | Notes |
|---|---|---|
| `list_forms` | `ListFormsController` | read-only |
| `get_form` | `GetFormController` | read-only, public route semantics |
| `create_form` | `CreateFormController` | |
| `update_form` | `UpdateFormDetailsController` | **destructive** (full replace) |
| `insert_questions` | `InsertQuestionsInFormController` | **destructive** (omitted questions are deleted) |
| `get_form_submissions` | `GetFormSubmissionsController` | `limit` default 50, max 200, returns `total`/`truncated` |
| `search_datasets` | `SearchDatasetsController` | read-only |
| `get_dataset_data` | `GetPublishedFormDataController` | `limit` default 20, max 100, paginate with `nextCursor` |

- **Adding a tool:** subclass `McpTool` (Zod `argsSchema` → JSON Schema input + validation), decorate with `@Injectable()`, register it in `ToolRegistry`. Set annotations (`readOnlyHint`/`destructiveHint`/`idempotentHint`) honestly.
- **Errors:** tool failures (validation, not-found, not-allowed, unexpected) are returned as `result.isError = true` via the shared `toErrorPayload` (`application/errors/`), also used by `lambdaHttpAdapter`; only protocol problems are JSON-RPC errors.
- **Security — prompt injection:** dataset rows and form submissions are text written by other people and are returned next to write tools. Tool descriptions and server `instructions` tell the model to treat them as data, and the write tools carry destructive annotations so clients can ask for confirmation, but a grant still means full access to the user's account: connect only clients you trust (a connection UI to list and revoke grants does not exist yet; grants are revocable in the data model).
- Verify a deployed stack with `API_URL=… EMAIL=… PASSWORD=… pnpm --filter @monorepo/api verify:mcp-server` (optionally `FOREIGN_FORM_ID` to check ownership isolation and `API_KEY` to check PAT rejection).

### TypeScript Path Aliases (API)

```
@application/* → src/application/*
@main/*        → src/main/*
@infra/*       → src/infra/*
@kernel/*      → src/kernel/*
@shared/*      → src/shared/*
```

## Web Architecture

```
src/
  app/          # Routing, contexts, hooks, services, config
  components/   # Shared components (DataTable, Stepper, ui/, layouts)
  views/        # Pages and layouts organized by feature
  App.tsx
```

### Data Fetching

Services in `app/services/` (`authService`, `accountsService`, `formsService`) are plain functions using the shared `httpClient` (axios, auto-attaches Bearer token from localStorage). Queries and mutations are wired with TanStack Query in page components or dedicated hooks.

### Auth Flow

`AuthContext` checks localStorage for an access token, then fetches `/accounts/me` to validate the session. Tokens are stored as `ACCESS_TOKEN` / `REFRESH_TOKEN` in localStorage (keys in `app/config/localStorageKeys`). `AuthGuard` in the router redirects unauthenticated users.

### Path Alias (Web)

```
@/ → src/
```

## Portal Architecture (`apps/portal`)

```
src/
  app/
    router/     # Routes: "/" (search) and "/dataset/:formId"
    services/
      portalService/  # Calls the public /portal/* endpoints on apps/api
  views/
    pages/
      Home/     # Semantic dataset search (GET /portal/search)
      Dataset/  # Dataset metadata + paginated raw-data table (GET /portal/datasets/{formId}, GET /portal/datasets/{formId}/data)
```

- No `AuthContext`/`AuthGuard`, no localStorage token handling — every route is public by design.
- Uses the same `@monorepo/ui` components and Tailwind theme as `apps/web` for visual consistency, but is a fully independent Vite app/deployment.
- Path alias: `@/ → src/` (same convention as `apps/web`).

## Shared UI Package (`packages/ui`)

Design-system components shared between `apps/web` and `apps/portal`, imported as `@monorepo/ui`:

```
src/
  components/
    ui/         # Button, Card, Badge, Input, Table, Select, Popover, Command, DropdownMenu, Separator
    DataTable/  # DataTable and its sub-components (header, pagination, faceted filters, etc.)
  lib/utils.ts
  styles.css    # Shared theme tokens, imported as "@monorepo/ui/styles.css"
```

When a component is needed in both `apps/web` and `apps/portal`, add/edit it here rather than duplicating it locally in either app. `apps/web` no longer keeps local copies of components covered by this package.

## Shared Package (`packages/shared`)

Exposes domain entities (`entities/`), TypeScript interfaces (`types/`), and enums (`enums/`). `apps/api`, `apps/web`, and `apps/portal` all depend on it as `@monorepo/shared`.
