## Context

`feature/api` (never merged) implements a full Personal Access Token system alongside an unrelated LGPD "external form submissions" export feature. Both features share two pieces of infrastructure: the `ApiKey` entity/repository and the `apiKeyAuthorizer` Lambda request authorizer. Since `feature/api` branched, `main` has moved on (via the now-merged `feature/portal` work): shared UI primitives (`Badge`, `Button`, `Card`, `Command`, `DropdownMenu`, `Input`, `Popover`, `Select`, `Separator`, `Table`, `DataTable/*`) were extracted from `apps/web` into `packages/ui`, and the public portal API (`/portal/search`, `/portal/datasets/{formId}`, `/portal/datasets/{formId}/data`) was added as unauthenticated. Recovering the dead code is a port, not a cherry-pick: file layout, import aliases, and `Controller`/`AppConfig` shapes have to be reconciled with current `main`.

Per proposal, the PII/anonymization side of `feature/api` (`GetExternalFormSubmissions*`, `AnonymizationEngine`, `ConsentRequiredError`, `GeneralizationConfig`, the `EXPORT_SECRET` config, `external.yml`'s `getExternalFormSubmissions` function) is explicitly not recovered — only the PAT primitive.

## Goals / Non-Goals

**Goals:**
- Let an authenticated account holder create, list, and revoke Personal Access Tokens (`cs_sk_...`) scoped to their own account, via `apps/web`.
- Store only a salted/HMAC hash of each key (never the raw secret) so a DB read can't leak usable credentials.
- Provide a reusable `apiKeyAuthorizer` Lambda authorizer that can validate a PAT against that store, registered in Serverless and ready to attach to a route in a future change.
- Keep every existing `/portal/*` public endpoint's behavior byte-for-byte unchanged.

**Non-Goals:**
- Attaching `apiKeyAuthorizer` to any route (portal or otherwise). No endpoint becomes authenticated in this change.
- Porting `GetExternalFormSubmissions`, `AnonymizationEngine`, `ConsentRequiredError`, `GeneralizationConfig`, or any LGPD/PII/consent logic.
- Rate limiting, quotas, or usage metering tied to API keys.
- Multiple scopes/permission granularity beyond a single default scope (can be extended later without a breaking change, since `ApiKeyScope` is an enum consumers already read as a list).

## Decisions

- **Reuse the existing `Controller<'private', ...>` pattern for key management endpoints**, exactly as `feature/api` did (`POST/GET /api-keys`, `DELETE /api-keys/{keyId}`, all behind the existing `CognitoAuthorizer`). No new route type is introduced by this change — see the authorizer-context gap below for why a PAT-authenticated *private* route is deliberately deferred.
- **Port `AppConfig.secrets` with only `masterSecret`** (drop `exportSecret` — it belonged to the discarded export feature). Add `MASTER_SECRET` to `env.ts`/`sls/config/env.yml` following the same "actual env var, not CFN ref, with a `changeme-` dev default" pattern already used there for other secrets-shaped config.
- **Replace the `ApiKeyScope.SUBMISSIONS_READ` value with `ApiKeyScope.PORTAL_READ`.** The enum shape (list of scopes on the key) is preserved since it costs nothing and avoids a future breaking change, but the one value we ship must not reference the discarded submissions/export feature. `PORTAL_READ` signals the scope this token is expected to eventually gate (`/portal/*`) without this change actually enforcing it.
- **Adapt web imports to the current `packages/ui` split.** `feature/api`'s `ApiKeys` page imports `Badge`/`Button`/`Table`/etc. from local `apps/web/src/components/ui/*`; on current `main` these live in `@monorepo/ui`. Port the page using today's import paths, not the branch's.
- **Register the authorizer function in Serverless without attaching it to a route** (`sls/functions/external.yml` gets only the `apiKeyAuthorizer` entry, not `getExternalFormSubmissions`). This matches the "infra ready, nothing gated yet" scope from the proposal.
- **One-time secret reveal on create**: `CreateApiKeyUseCase` returns the raw `cs_sk_...` value only in the creation response; `ListApiKeysUseCase` returns metadata (`keyPrefix`, `name`, `scopes`, `createdAt`, `revokedAt`, `expiresAt`) only. This is carried over unchanged from `feature/api` and is standard PAT UX (GitHub, Stripe, etc.).

## Risks / Trade-offs

- **[Risk]** `lambdaHttpAdapter` currently extracts `accountId` only from `event.requestContext.authorizer.jwt.claims.internalId`, assuming a JWT authorizer. A Lambda *request* authorizer (like `apiKeyAuthorizer`) populates `event.requestContext.authorizer.lambda.<context>` instead — a future change that attaches `apiKeyAuthorizer` to a `private`-style controller route will get a runtime error (or silently wrong `accountId`) unless the adapter is extended first.
  → **Mitigation**: this change registers the authorizer function but attaches it to no route, so the gap can't be hit yet. Flagged explicitly here (and in tasks) so the follow-up change budgets for adapter work instead of discovering it mid-implementation.
- **[Risk]** Shipping unused infrastructure (an authorizer wired to nothing) can bit-rot or be forgotten.
  → **Mitigation**: proposal and this design record why it exists and what "done" looks like for the next step; `ApiKeyScope.PORTAL_READ` names the intended target so the follow-up change is discoverable by grep.
- **[Trade-off]** Not porting `exportSecret`/consent code means any future revival of the LGPD export feature has to be re-derived from `feature/api` again rather than building on something already merged. Accepted deliberately per explicit user instruction to keep PII out of this change.

## Migration Plan

- Purely additive: new DynamoDB item type (`ApiKey`, same `MainTable`, new `GSI1` access pattern for prefix/hash lookup), new endpoints, new Serverless functions, new env var (`MASTER_SECRET`, with a dev default so existing stages don't break). No existing item shape, endpoint, or env var changes.
- Deploy order: set a real `MASTER_SECRET` value in each deployed stage's environment before/at deploy time (the `changeme-` fallback is dev-only); then `pnpm deploy`.
- Rollback: revert the merge; the new DynamoDB items are additive and orphaning them on rollback has no effect on existing data.

## Open Questions

- Should key expiration (`expiresAt`) be settable at creation time from the web UI in this change, or deferred? (`feature/api`'s entity supports it; the original controller didn't expose it.) Defaulting to: carry the field through but don't expose expiry-setting in the UI yet, to keep this change purely a port.
