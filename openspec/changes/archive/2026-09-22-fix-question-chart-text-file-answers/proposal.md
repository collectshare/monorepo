## Why

On the form results dashboard, `QuestionChart.tsx` reuses one aggregated `{ name, value }[]` array — built to power bar/pie charts for multiple-choice-style questions — for every question type. Free-text (`TEXT`) answers get deduplicated by exact string match, so when two respondents submit identical text, only one row is shown; the count is silently dropped. File-upload (`FILE`) answers have no dedicated case in the chart-type switch, so they fall into the `default` bar-chart branch and render as a bar chart of always-unique S3 signed URLs — one bar of height 1 per submission, which is meaningless. Both are the wrong visualization for their data shape and lose respondent data in the TEXT case.

## What Changes

- Stop aggregating/deduplicating `TEXT` and `FILE` answers in `QuestionChart.tsx`; each keeps one row per submission instead of being folded into the shared counted/deduplicated `data` array.
- Add a new shared `AnswersTable` component (`apps/web/src/views/pages/FormDashboard/components/AnswersTable.tsx`) that renders a non-aggregated, one-row-per-submission table using the existing `@monorepo/ui` `DataTable` primitives (search + pagination), following the same per-visualization-component pattern already used by `Chart.tsx`, `PieChart.tsx`, `StarRatingChart.tsx`.
- Wire `QuestionType.TEXT` in `QuestionChart.tsx`'s `renderChart()` to `<AnswersTable question={question} responses={responses} />`, showing raw answer text per submission.
- Add an explicit `QuestionType.FILE` case in the same switch, rendering `AnswersTable` with a custom column title and a `renderValue` that turns the already-resolved S3 signed URL into a "Baixar arquivo" download link, instead of falling through to the `default` bar-chart branch.
- CHECKBOX / MULTIPLE_CHOICE / DROPDOWN / STARS question types keep using the existing aggregated `data` reduce and their current chart components — unchanged, since counting/deduplication is correct for those.

## Capabilities

### New Capabilities
- `form-dashboard-answer-display`: Defines how individual question answers are rendered on the form results dashboard depending on question type — aggregated charts for choice/rating questions vs. non-aggregated per-submission tables for free-text and file-upload questions.

### Modified Capabilities
(none — no existing specs in `openspec/specs/` cover this behavior yet)

## Impact

- **Code**: `apps/web/src/views/pages/FormDashboard/components/QuestionChart.tsx` (modified), new `apps/web/src/views/pages/FormDashboard/components/AnswersTable.tsx`.
- **Reused, unmodified**: `@monorepo/ui` `DataTable` family (`DataTable`, `DataTableColumnHeader`, `DataTableContent`, `DataTableTextFilter`, `DataTablePagination`), `apps/web/src/app/utils/formatDate.ts`.
- **No API changes**: the API already returns FILE answers as ready-to-use S3 signed URLs (`apps/api/src/application/usecases/form/GetFormSubmissionsUseCase.ts` via `StorageGateway.getSignedUrl`); this is a frontend-only rendering fix.
- **No data/schema changes**, no breaking changes to other question types.
