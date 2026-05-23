# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack Overview

**Monorepo** managed with pnpm workspaces + Turborepo.

- `apps/api` — Serverless Framework (AWS Lambda, DynamoDB, Cognito, S3, SQS), TypeScript
- `apps/web` — React 19 + Vite + TailwindCSS v4 + TanStack Query, TypeScript
- `packages/shared` — Entities, types, and enums shared between api and web

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

## Shared Package (`packages/shared`)

Exposes domain entities (`entities/`), TypeScript interfaces (`types/`), and enums (`enums/`). Both `apps/api` and `apps/web` depend on it as `@monorepo/shared`.
