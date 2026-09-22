## Why

The FormDashboard only shows the owner the first 500 submissions and offers no way to narrow them down beyond a single free-text search. There is no way to ask "show me the submissions where the rating is 5 stars AND they confirmed prior experience with similar apps" — a form owner evaluating survey-style results needs to combine conditions across different questions of the same submission, and needs that view to cover the full response set, not just the first 500 rows.

## What Changes

- Add a conditional filter builder to FormDashboard that lets the owner combine conditions across different questions of the same submission, using groups of AND'd conditions that are OR'd together (disjunctive normal form).
- Filter operators are tailored to each question type: STARS (equals / at least / at most), MULTIPLE_CHOICE and DROPDOWN (is one of), CHECKBOX (contains any of / contains all of), TEXT (contains text). FILE questions are not filterable and are excluded from the builder.
- The active filter is applied once to the full submissions list and affects **both** the chart view and the "all responses" table view — both are already pure functions of the responses array they're given.
- The existing free-text filter on the "all responses" table remains as a complementary quick-search refinement on top of the group filter; it is not replaced.
- **BREAKING**: Remove the 500-submission cap entirely — FormDashboard now fetches and renders the full submission set for a form. This removes the "showing first 500, export CSV to see all" banner along with the `DASHBOARD_SUBMISSIONS_LIMIT` and `MAX_ROWS` constants and the default `limit` on `GetFormSubmissionsUseCase`.
- CSV export is explicitly unchanged: it continues to export the entire submission set regardless of any active dashboard filter.
- Filtering happens entirely client-side; no new backend filtering endpoint or DynamoDB index is introduced.

## Capabilities

### New Capabilities
- `form-dashboard-filters`: Conditional AND/OR filter builder over a form's full submission set, applied uniformly to the chart and table views of FormDashboard.

### Modified Capabilities
(none — no existing `openspec/specs/` capability covers FormDashboard submission retrieval today)

## Impact

- **Frontend (`apps/web`)**: `views/pages/FormDashboard/index.tsx` (remove cap/banner, host filter state, apply filter before distributing responses), `useFormDashboardController.ts` (fetch without limit), `components/AllResponsesTable.tsx`, `components/QuestionChart.tsx`, `components/AnswersTable.tsx` (remove `MAX_ROWS`), plus a new filter-builder component and filter-evaluation utility.
- **Backend (`apps/api`)**: `application/usecases/form/GetFormSubmissionsUseCase.ts` (remove default 500 limit so the full set is returned when no limit is passed).
- **Out of scope**: `apps/portal` (public, unauthenticated app) is untouched. No changes to `ExportPublishedFormDataQuery` / CSV export. No new DynamoDB GSI or backend filtering endpoint — known N+1 performance characteristics of per-submission answer fetching are explicitly out of scope for this change.
