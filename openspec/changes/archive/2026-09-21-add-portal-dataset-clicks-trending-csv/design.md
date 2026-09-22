## Context

The portal (`apps/portal`) is public and unauthenticated; it only talks to `apps/api`'s `/portal/*` routes, never Algolia directly. Published datasets are indexed in Algolia by `OnFormChangedUseCase`, a DynamoDB Streams consumer that fires on every `INSERT`/`MODIFY` of a `Form` item and re-upserts the full Algolia record (or deletes it if `isPublished` becomes `false`). `Form.submissionCount` already follows an atomic-increment pattern (`FormRepository.incrementSubmissionCount`) that this change mirrors for clicks. Dataset row data is fetched through `GetPublishedFormDataQuery`, which paginates DynamoDB submissions (`FormSubmissionRepository.findByFormIdPaginated`) at up to 100 rows/page and applies `AnonymizationEngine` per-answer — CSV export must reuse this exact query so exported data matches what's shown on screen (same anonymization).

## Goals / Non-Goals

**Goals:**
- Count a dataset "click" once per dataset-detail-page load, persisted durably and visible to portal visitors indirectly (via trending ranking), not necessarily as a raw counter shown on the page.
- Let visitors sort/filter the search page by trending (most-clicked) datasets.
- Let visitors download a published dataset's full row set as CSV, honoring the same anonymization as the on-screen table.
- Keep the portal fully public/unauthenticated and keep the browser talking only to `apps/api`, never Algolia, exactly as today.

**Non-Goals:**
- No per-user/session dedup of clicks (no bot filtering, no rate limiting) — a click is any successful `GET /portal/datasets/{formId}` request. Abuse mitigation is out of scope for this change.
- No new analytics dashboard for dataset owners in `apps/web`; `clickCount` is portal-facing only for this change.
- No streaming/async export job — CSV export is a single synchronous HTTP response.
- No client-side CSV library; the API returns ready-to-download `text/csv`.

## Decisions

### 1. Click counting: increment on `GetPublishedFormController`, atomic DynamoDB update
Increment `clickCount` server-side inside `GetPublishedFormController`'s handler (the endpoint the portal's `Dataset` page calls on load), via a new `FormRepository.incrementClickCount(formId)` using the same `UpdateCommand` + `if_not_exists(...,:zero) + :incr` pattern as `incrementSubmissionCount`. This is fire-and-forget relative to the response (don't block/fail the request if the increment errors) but is awaited in practice via `Promise.all` with the existing `getPublishedFormQuery.execute` for simplicity, wrapped so a failure to increment never turns into a 500.
- **Alternative considered**: increment from the portal frontend via a dedicated `POST /portal/datasets/{formId}/click` call. Rejected — adds a second round trip, and an unauthenticated public POST that mutates a counter is easier to spam than piggybacking on the existing GET that already has to succeed (dataset must exist and be published) to count.
- **Alternative considered**: increment in `GetPublishedFormDataController` (the data-rows endpoint) instead. Rejected — that endpoint fires once per page (including "Carregar mais"), which would inflate counts per visit; the metadata endpoint fires once per page view.

### 2. Propagation to Algolia via existing stream consumer
`OnFormChangedUseCase` already re-syncs the full record on every `Form` MODIFY, so bumping `clickCount` via `UpdateCommand` naturally triggers a stream event that re-upserts Algolia with the new count — no new plumbing needed beyond adding `clickCount` to `AlgoliaGateway.DatasetRecord`, `upsertRecord`, `search`, and the mapping in `OnFormChangedUseCase`.
- **Trade-off**: every click causes an Algolia write (via the stream). Acceptable at current scale; flagged under Risks.

### 3. Trending sort via Algolia replica index
Add a `clickCount`-desc-sorted Algolia replica index (standard Algolia feature) configured alongside the primary index. `SearchDatasetsController` gains an optional `sort` query param (`'relevance' | 'trending'`); when `trending`, `AlgoliaGateway.search` targets the replica index instead of the primary. Portal `Home` page adds a simple toggle/tab ("Relevância" / "Em alta") that passes `sort` through `searchDatasets(query, sort)`.
- **Alternative considered**: sort client-side in the portal after fetching normal search results. Rejected — Algolia only returns a page of hits for the current query; sorting client-side wouldn't reflect true ranking across all matches, and an empty query ("browse all, sorted by trending") wouldn't work well against the primary (relevance-ranked) index.
- **Alternative considered**: a new non-Algolia `GET /portal/datasets/trending` endpoint reading directly from DynamoDB (e.g., a GSI on `clickCount`). Rejected for this change — DynamoDB doesn't sort numerically across a GSI partition without a single shared partition key (hot-partition risk), and Algolia already holds the full published-dataset record; a replica index is the natural fit given Algolia is already the portal's search backend.

### 4. CSV export: dedicated endpoint, server-side pagination loop, single response
Add `GET /portal/datasets/{formId}/export`, handled by a new `ExportPublishedFormDataController` that:
1. Validates the form exists and `isPublished`, same as `GetPublishedFormDataController`.
2. Loops `GetPublishedFormDataQuery.execute({ formId, limit: 100, cursor })` internally until `nextCursor` is undefined, accumulating rows (same anonymization as the table).
3. Builds CSV in-memory: header row = `Enviado em` + each question's `text` (same order/filtering as the portal table today — `QuestionType.FILE` excluded), rows = `submittedAt` + per-question answer values (arrays joined with `, `), with RFC 4180 quoting/escaping.
4. Returns `200` with `Content-Type: text/csv; charset=utf-8` and `Content-Disposition: attachment; filename="<form-title-slug>.csv"`.
- **Alternative considered**: have the portal frontend loop the existing paginated `/data` endpoint and build the CSV client-side (e.g. with a small CSV-writer). Rejected as primary approach — it would require duplicating question-column logic already in `useDatasetController` (fine) but also means N sequential HTTP round trips for large datasets in the visitor's browser instead of one; still, this is noted as a fallback if the synchronous Lambda approach hits timeout limits in practice (see Risks).
- **Alternative considered**: async export (generate CSV to S3, return a presigned URL). Rejected as over-engineering for expected dataset sizes today; revisit if real datasets exceed what fits in one Lambda invocation.

## Risks / Trade-offs

- **[Risk] Click counting is trivially spammable (no auth, no rate limit) → skews trending** → Mitigation: none in this change (explicit Non-Goal); acceptable since trending is a soft discovery aid, not a ranking with monetary/security stakes. Revisit if abuse is observed.
- **[Risk] Every dataset-page view triggers a DynamoDB write + stream-triggered Algolia write** → Mitigation: both are already proven at `submissionCount` scale; if click volume becomes high, consider batching/debouncing in a follow-up change.
- **[Risk] CSV export loops all pages synchronously inside one Lambda invocation → could hit API Gateway/Lambda timeout on very large datasets** → Mitigation: cap rows fetched per export at a safe upper bound (e.g. 20,000 rows) for this change, returning a truncated CSV with a note, and revisit an async/S3-backed export if real usage exceeds that cap.
- **[Risk] Algolia replica indices must be created/configured in the Algolia dashboard/account (`indexName_trending`), not purely code** → Mitigation: document the required replica setup in `tasks.md`; `AppConfig`/`AlgoliaGateway` needs the replica index name (env var or derived as `${indexName}_trending`).

## Migration Plan

- `clickCount` is an optional field (`clickCount?: number`), so existing `Form` items work unchanged (`if_not_exists(...,:zero)` handles first increment).
- Deploy order: (1) API changes (entity/item/repository/controllers/Algolia gateway + Algolia replica index creation), (2) portal changes (trending toggle, CSV button). Backward compatible — old portal build still works against new API; new portal build requires the new API routes to exist first.
- No backfill needed; `clickCount` starts accumulating from deploy time. Trending simply reflects post-deploy activity until organic clicks accrue.
- Rollback: revert portal deploy first (removes UI entry points), then API deploy; DynamoDB/Algolia schema additions are additive and safe to leave in place.

## Open Questions

- Should `clickCount` (or "views") be shown as a visible number on the dataset page itself (like `submissionCount` today), or stay purely internal to power trending? Proposal assumes internal-only for now; easy to surface later if desired.
- Exact CSV row cap (proposed 20,000) — confirm against real dataset sizes before implementation.
