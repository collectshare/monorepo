## 1. Shared entity

- [x] 1.1 Add optional `clickCount?: number` to `Form` entity (`packages/shared/entities/Form.ts`) and its `Attributes` type
- [x] 1.2 Add optional `downloadCount?: number` to `Form` entity and its `Attributes` type

## 2. Click tracking (API)

- [x] 2.1 Add `clickCount?: number` to `FormItem.Attributes`/`ItemType` and pass it through `fromEntity`/`toEntity` (`apps/api/src/infra/database/dynamo/items/FormItem.ts`)
- [x] 2.2 Add `FormRepository.incrementClickCount(formId)` mirroring `incrementSubmissionCount` (atomic `UpdateCommand` with `if_not_exists(...,:zero) + :incr`)
- [x] 2.3 Call `incrementClickCount` from `GetPublishedFormController` on successful lookup, without letting a failure fail the request (wrap in try/catch or `.catch(() => {})`)
- [x] 2.4 Add `clickCount?: number` to `AlgoliaGateway.DatasetRecord`, include it in `upsertRecord` and map it back in `search`
- [x] 2.5 Pass `form.clickCount` through in `OnFormChangedUseCase`'s `algoliaGateway.upsertRecord` call

## 3. Trending sort (API)

- [x] 3.1 Add `trendingIndexName` to `AppConfig.algolia` (optional `ALGOLIA_TRENDING_INDEX_NAME` env var, derived default `${indexName}_trending`); **actual replica-index creation/config in the Algolia dashboard is an external ops step, not code — see note below**
- [x] 3.2 Add `search(query, sort?)` support to `AlgoliaGateway`, targeting the replica index when `sort === 'trending'`
- [x] 3.3 Add optional `sort?: 'relevance' | 'trending'` query param to `SearchDatasetsController` and pass through to the gateway

## 4. Trending filter (Portal)

- [x] 4.1 Add `sort` param support to `portalService.searchDatasets`
- [x] 4.2 Add trending toggle state to `useHomeController` (re-fetch on toggle change, alongside existing debounced query effect)
- [x] 4.3 Add a "Relevância" / "Em alta" control to the `Home` page UI

## 5. CSV export (API)

- [x] 5.1 Add `ExportPublishedFormDataQuery` that fetches all submissions (`FormSubmissionRepository.findByFormId`, unpaginated) up to a configured row cap (20,000) and accumulates rows + question metadata, same anonymization as the table
- [x] 5.2 Add CSV-building logic (RFC 4180 escaping/quoting; header row from question `text` in table order, excluding `QuestionType.FILE`; data rows from `submittedAt` + answers, arrays joined with `, `) — `apps/api/src/shared/utils/toCsv.ts`
- [x] 5.3 Add `ExportPublishedFormDataController` (public) that validates the form exists and `isPublished`, then returns the CSV body with `Content-Type: text/csv; charset=utf-8` and `Content-Disposition: attachment; filename="<slugified-title>.csv"` (required extending `Controller.Response`/`lambdaHttpAdapter` with optional `headers`/`isRawBody` for non-JSON responses)
- [x] 5.4 Wire `main/functions/portal/exportPublishedFormData.ts` entrypoint and add the `GET /portal/datasets/{formId}/export` route to `sls/functions/portal.yml`
- [x] 5.5 Add `downloadCount?: number` to `FormItem.Attributes`/`ItemType` (spread-through `fromEntity` already covers it; add explicit mapping in `toEntity`)
- [x] 5.6 Add `FormRepository.incrementDownloadCount(formId)` mirroring `incrementClickCount`
- [x] 5.7 Call `incrementDownloadCount` from `ExportPublishedFormDataController` after a successful export, without letting a failure fail the request
- [x] 5.8 Add `downloadCount?: number` to `AlgoliaGateway.DatasetRecord`, include it in `upsertRecord`/`search`, and pass `form.downloadCount` through in `OnFormChangedUseCase`

## 6. CSV export (Portal)

- [x] 6.1 Add `portalService.getDatasetExportUrl(formId)` (or an `exportDatasetCsv` helper that triggers a browser download via the API URL)
- [x] 6.2 Add a "Baixar CSV" `Button` to the `Dataset` page that triggers the download (simple link/anchor to the export URL, or fetch+blob if auth-free direct linking isn't viable)

## 7. Verification

- [x] 7.1 `pnpm typecheck` in `apps/api`, `apps/web`, `apps/portal` — all pass
- [x] 7.2 `pnpm lint` for `apps/portal` — passes; `apps/api` has no `lint` script (confirmed, not applicable)
- [ ] 7.3 Manually verify: viewing a dataset increments `clickCount`; trending toggle reorders search results; CSV download produces a correct, RFC 4180-valid file matching the on-screen table (not run — API is deploy-only, no local dev server; requires a deploy + a live Algolia trending replica index)
