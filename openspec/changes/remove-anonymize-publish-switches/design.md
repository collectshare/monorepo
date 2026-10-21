## Context

`isAnonymous` and `isPublished` live on the `Form` entity. Both default to `true`, but they can be set from the web modal, from `/v1` and from MCP.

- `isPublished` gates the portal reads: `GetPublishedFormQuery` and the 3 data/export controllers. It also gates Algolia indexing (`OnFormChangedUseCase`) and the Home stats.
- `isAnonymous` only decides whether `SubmitFormUseCase` stores `ip` and `userAgent`.

## Goals / Non-Goals

**Goals:**
- Anonymous and published become invariants. No flag, no checks.
- Old data stops influencing behavior, and the index catches up.

**Non-Goals:**
- Changing per-question anonymization (`piiStrategy` / `AnonymizationEngine`).
- Purging `ip` and `userAgent` that were already stored on old submissions of non-anonymous forms. See Open Questions.
- Renaming the `*Published*` classes and routes. "Published" is now just "exists", and the rename is not worth the churn.

## Decisions

- **Delete the fields; don't hardcode `true`.** Keeping a field that is always `true` leaves dead checks and a contract that suggests something is optional.
- **Rely on zod's default strip for backward compatibility.** The create and update schemas don't use `.strict()`, so old clients that still send the flags keep working. The spec only promises "ignored".
- **Reuse the backfill script as `cleanup:form-flags`.** It scans `Form` items that have either attribute and runs `REMOVE isAnonymous, isPublished`. This cleans the data, and the resulting MODIFY event makes `onFormChanged` upsert the forms that were unpublished into Algolia. One script does both jobs, so no separate reindex tool is needed. It is idempotent: a second run finds nothing.
- **Home:** remove the "Publicados / Rascunho" card instead of showing "N / 0". "Sem respostas" becomes simply forms with `submissionCount === 0`.

## Risks / Trade-offs

- [Forms that were unpublished on purpose (verify script, integrators) become public] → Accepted, since this is the product decision. The anonymization of each question still applies.
- [Breaking change for `/v1` and MCP clients that read the flags] → Small integrator base. The OpenAPI is updated and the change is called out in the release notes.
- [Deploy order: the web build still sends the flags until it is redeployed] → Harmless, because zod strips them.

## Migration Plan

1. Deploy the API.
2. Run `MAIN_TABLE_NAME=… pnpm --filter @monorepo/api cleanup:form-flags` against dev, then against prod.
3. Deploy web and portal (the portal only gets the openapi update).

Rollback: redeploy the previous API. Old code treats a missing `isPublished` as `true` (`FormItem` uses `?? true`). A missing `isAnonymous` is `undefined` and therefore falsy, so old code would store IPs again until the attribute is restored. That is acceptable for a rollback window.

## Open Questions

- Should we purge `ip` and `userAgent` already stored on old submissions? It is not needed for this change, but it fits the "always anonymous" promise under LGPD.
