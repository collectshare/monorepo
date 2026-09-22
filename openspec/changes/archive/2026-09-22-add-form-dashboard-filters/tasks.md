## 1. Backend: remove the 500-submission cap

- [x] 1.1 In `apps/api/src/application/usecases/form/GetFormSubmissionsUseCase.ts`, remove `DEFAULT_SUBMISSIONS_LIMIT`/the default `limit = 500` so an unset `limit` is passed through as `undefined`.
- [x] 1.2 Verify `GetFormSubmissionsQuery.execute` takes its `!options?.limit` branch (calling `submissionRepository.findByFormId`, unpaginated) when no limit is supplied, and returns all submissions for the form.
- [x] 1.3 Run `pnpm typecheck` in `apps/api`.

## 2. Frontend: fetch and expose the full submission set

- [x] 2.1 Confirm `useFormDashboardController.ts` / `formsService.getResponses` already call the endpoint without a limit param (no client-side change expected beyond removing consumers of the cap).
- [x] 2.2 In `apps/web/src/views/pages/FormDashboard/index.tsx`, remove `DASHBOARD_SUBMISSIONS_LIMIT`, `exceedsLimit`, and the "showing only the first 500" banner block.
- [x] 2.3 In `apps/web/src/views/pages/FormDashboard/components/AnswersTable.tsx`, remove `MAX_ROWS` and any slicing/truncation based on it.

## 3. Filter data model and evaluation utility

- [x] 3.1 Define `FilterOperator`, `FilterCondition`, `FilterGroup`, `FilterState` types (per `design.md`) in a shared location under `apps/web/src/views/pages/FormDashboard/` (e.g. `filters/types.ts`).
- [x] 3.2 Implement a pure `applyFilters(responses: IFormSubmission[], filterState: FilterState, questions: IQuestion[]): IFormSubmission[]` utility implementing DNF evaluation (AND within a group, OR across groups; empty `groups` returns all responses unchanged).
- [x] 3.3 Implement per-`QuestionType` condition evaluators: STARS (`eq`/`gte`/`lte` numeric), MULTIPLE_CHOICE/DROPDOWN (`isOneOf`), CHECKBOX (`containsAny`/`containsAll` against a `string[]` answer), TEXT (`contains`, case-insensitive substring). FILE questions are never evaluated/offered.
- [ ] 3.4 SKIPPED — `apps/web` has no test runner configured anywhere in the app (no vitest/jest devDependency, no config, no existing `*.test.ts` files); `apps/api` is the only workspace with `vitest`. Adding a test harness to `apps/web` is infra scope beyond this change. `applyFilters` was written as a pure, dependency-free function so it's trivially testable once/if a runner is introduced. Flagging for the user rather than silently skipping.

## 4. Filter builder UI

- [x] 4.1 Build a filter builder component (e.g. `components/SubmissionFilterBuilder.tsx`) that lets the owner add/remove groups and, within a group, add/remove conditions choosing a question, an operator scoped to that question's type, and a value.
- [x] 4.2 Render the filter builder above the chart/table view toggle in `FormDashboard/index.tsx`, wired to local `FilterState`.
- [x] 4.3 Exclude FILE-type questions from the question picker in the builder.
- [x] 4.4 Show a count of matching submissions vs. total (e.g. "Mostrando X de Y respostas") when a filter is active.

## 5. Wire filtering into the dashboard views

- [x] 5.1 In `FormDashboard/index.tsx`, compute `filteredResponses = applyFilters(responses, filterState, questions)` and pass `filteredResponses` (not raw `responses`) to both `QuestionChart` and `AllResponsesTable`.
- [x] 5.2 Verify `QuestionChart`/`AllResponsesTable`/`AnswersTable` require no internal changes since they already only consume the `responses` array they're given.
- [x] 5.3 Confirm the existing `DataTableTextFilter` in `AllResponsesTable` continues to operate on top of `filteredResponses` unchanged (no removal, no replacement).

## 6. Export stays unaffected

- [x] 6.1 Confirm `handleExport` / `formsService.exportSubmissions` / `ExportPublishedFormDataQuery` receive no `FilterState` and are not modified by this change.
- [ ] 6.2 Add/verify a test or manual check that exporting CSV while a filter is active still returns every submission. (covered by manual verification task 7.5)

## 8. UX refinement: staged apply + compact popover (post-review feedback)

- [x] 8.1 Split filter state into `draftFilterState` (edited live in the builder) and `appliedFilterState` (what `applyFilters` actually consumes) in `FormDashboard/index.tsx`.
- [x] 8.2 Move `SubmissionFilterBuilder` into a `Popover` triggered by a "Filtros" button, closed by default, instead of an always-rendered inline block.
- [x] 8.3 Add "Aplicar filtros" (commits draft → applied, closes popover) and "Limpar filtros" (resets both to empty) actions.
- [x] 8.4 ~~Resync `draftFilterState` from `appliedFilterState` whenever the popover opens~~ — REVERTED (see 8.9): this caused closing without applying to silently discard in-progress edits.
- [x] 8.5 Show the applied condition count as a badge on the "Filtros" trigger so the active filter is visible while the popover is closed.
- [x] 8.6 Hide the "Filtros" trigger entirely when the form has no filterable questions.
- [x] 8.7 Update `specs/form-dashboard-filters/spec.md` and `design.md` to reflect staged-apply + compact-popover behavior.
- [x] 8.8 Bugfix: after "Limpar filtros" the popover/badge reset correctly but the table/chart kept showing the previously filtered subset. Fixed by keying `AllResponsesTable` and each `QuestionChart` on `appliedFilterKey` (a serialization of `appliedFilterState`), forcing those subtrees to remount whenever the applied filter changes — eliminates any lingering internal table state (pagination/sorting) surviving a filter change.
- [x] 8.9 Bugfix: closing the popover without clicking "Aplicar filtros" was discarding both any previously applied filter's edit-in-progress and unsaved draft edits, because opening the popover unconditionally overwrote `draftFilterState` with `appliedFilterState`. Removed `handleFilterPanelOpenChange`/the resync-on-open entirely; `Popover`'s `onOpenChange` now wires directly to `setIsFilterPanelOpen`, so `draftFilterState` only ever changes via explicit builder edits, "Aplicar filtros", or "Limpar filtros" — closing the popover any other way is now a true no-op.

## 7. Manual verification

- [ ] 7.1 Start the app (`pnpm dev`), open a form's dashboard with >500 submissions (or a seeded test form), and confirm all submissions load with no "first 500" banner.
- [ ] 7.2 Build a filter with one group and two conditions across two different questions (e.g. STARS `eq` 5 AND MULTIPLE_CHOICE `isOneOf` ["Sim"]) and confirm both the chart view and the table view narrow to matching submissions only.
- [ ] 7.3 Add a second group and confirm OR semantics (submissions matching either group are shown).
- [ ] 7.4 Confirm the free-text table search still narrows further on top of an active group filter.
- [ ] 7.5 With a filter active, click "Exportar CSV" and confirm the downloaded file contains all submissions, not just the filtered ones.
