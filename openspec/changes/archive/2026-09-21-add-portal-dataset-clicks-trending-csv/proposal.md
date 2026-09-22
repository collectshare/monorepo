## Why

The public portal currently has no signal for which datasets are popular and no way to export a dataset's raw data outside the paginated web table. Adding view/click tracking unlocks a "trending" discovery path on the search page, and a CSV export button on the dataset page lets visitors take the data with them — both are common expectations for an open-data portal and increase the portal's usefulness beyond ad-hoc browsing.

## What Changes

- Track how many times each published dataset's detail page (`/portal/datasets/{formId}`) is viewed, persisted as a `clickCount` on the `Form` entity/item (same increment pattern as `submissionCount`).
- Propagate `clickCount` to the Algolia index (via the existing `OnFormChangedUseCase` stream consumer) so it can be used for sorting/filtering.
- Add a "Trending" filter/sort option to the portal search (Home) page, backed by a clicks-sorted Algolia replica index, selectable alongside the existing free-text search.
- Add a "Baixar CSV" button to the dataset detail page that exports the full dataset's rows (all paginated pages, respecting existing anonymization rules) as a downloadable `.csv` file, with column headers matching the on-screen table (submission date + question text).
- New API endpoint `GET /portal/datasets/{formId}/export` that streams/returns the full CSV for a published dataset.
- Track how many times each dataset's CSV has been exported, persisted as `downloadCount` on the `Form` entity/item (same increment pattern as `clickCount`).

## Capabilities

### New Capabilities
- `dataset-click-tracking`: recording and exposing a view/click count each time a published dataset's detail page is loaded via the public portal.
- `dataset-trending-filter`: a "trending" sort/filter on the portal search page ordering datasets by click count.
- `dataset-csv-export`: downloading a published dataset's full row data as a CSV file from the dataset detail page.

### Modified Capabilities
- None. No previously specified capability's requirements change; `openspec/specs/` has no existing capabilities for the portal.

## Impact

- **`apps/api`**: `Form` entity (`packages/shared/entities/Form.ts`), `FormItem`, `FormRepository` (new `incrementClickCount`), `GetPublishedFormController`/`GetPublishedFormQuery`, `AlgoliaGateway` (new `clickCount` field + trending replica index), `OnFormChangedUseCase`, new `ExportPublishedFormDataController`/query, `SearchDatasetsController` (new `sort` param), `sls/functions/portal.yml` (new export route).
- **`apps/portal`**: `Home` page (trending filter UI + `useHomeController`), `Dataset` page (CSV download button + `useDatasetController`), `portalService` (new `getDataset` click side-effect is implicit server-side; new `exportDatasetCsv`/`searchDatasets` sort param).
- **`packages/shared`**: `Form` entity gains `clickCount?: number`.
- No breaking changes; `clickCount` defaults to `0`/`undefined` for existing datasets.
