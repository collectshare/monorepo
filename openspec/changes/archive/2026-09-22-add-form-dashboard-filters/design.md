## Context

FormDashboard (`apps/web/src/views/pages/FormDashboard`) fetches a form's submissions once via `useFormDashboardController` → `formsService.getResponses` → `GET /forms/:id/submissions`, which is served by `GetFormSubmissionsUseCase` (default `limit = 500`). The frontend caps display at 500 in two independent places (`DASHBOARD_SUBMISSIONS_LIMIT` in `index.tsx`, `MAX_ROWS` in `AnswersTable.tsx`) and shows a banner pointing to CSV export for anything beyond that.

`QuestionChart` and `AllResponsesTable` are both pure functions of the `responses: IFormSubmission[]` array they receive — they derive chart data / table rows on every render, with no independent fetching or caching of their own. That makes them a clean point to inject a filtered array without changing their internals.

There is no DynamoDB index that lets the backend answer "which submissions have answer X to question Y" directly — `AnswerItem` is only keyed by `PK=SUBMISSION#<id>`, `SK=QUESTION#<id>`. Any cross-question filtering therefore requires the full submission+answer set to be loaded into application memory regardless of where the filtering logic runs. Given that, and per explicit product decision, this change filters entirely client-side and does not attempt to reduce backend read cost or address the existing N+1 answer-fetch pattern.

## Goals / Non-Goals

**Goals:**
- Let a form owner build a filter over the full submission set that combines conditions across different questions of the same submission, with AND within a group and OR across groups (disjunctive normal form).
- Apply that filter uniformly to both the chart view and the table view of FormDashboard.
- Remove the 500-submission cap so the full dataset is always fetched and filterable.
- Keep the existing free-text table filter working as a secondary, complementary refinement.

**Non-Goals:**
- No server-side filtering endpoint, no new DynamoDB GSI, no pagination of filtered results.
- No change to CSV export behavior — it keeps exporting everything, ignoring the dashboard filter.
- No fix to the N+1 per-submission answer fetch in `GetFormSubmissionsQuery` — explicitly out of scope.
- No support for arbitrary nested filter trees (only two-level: AND within group, OR across groups).
- No changes to `apps/portal`.

## Decisions

**1. Filter data model: disjunctive normal form (groups of AND, OR'd together), not a nested tree.**
```ts
type FilterOperator = 'eq' | 'gte' | 'lte' | 'isOneOf' | 'containsAny' | 'containsAll' | 'contains';

type FilterCondition = {
  questionId: string;
  operator: FilterOperator;
  value: string | string[] | number;
};

type FilterGroup = {
  id: string;
  conditions: FilterCondition[]; // AND
};

type FilterState = {
  groups: FilterGroup[]; // OR
};
```
A submission matches `FilterState` if it matches at least one group, and matches a group if it matches every condition in it. Chosen over a fully nested tree because the proposal explicitly calls for "grupos simples" — this is enough to express "(5 stars AND confirmed prior experience) OR (something else)" without the UI/implementation complexity of arbitrary nesting.

**2. Operator set is derived from `QuestionType`, not free-form per question:**

| QuestionType | Operators | Notes |
|---|---|---|
| `STARS` | `eq`, `gte`, `lte` | numeric comparison against the star value |
| `MULTIPLE_CHOICE`, `DROPDOWN` | `isOneOf` | value is a list of accepted options (OR within the condition itself) |
| `CHECKBOX` | `containsAny`, `containsAll` | answer value is `string[]` |
| `TEXT` | `contains` | case-insensitive substring match |
| `FILE` | — | excluded from the filter builder entirely |

**3. Filtering happens once, above the chart/table split, not inside each consumer.**
`FormDashboard/index.tsx` (or a small hook it owns) holds `FilterState` and derives `filteredResponses = applyFilters(responses, filterState)` via a pure utility function. `filteredResponses` is what gets passed to both `QuestionChart` and `AllResponsesTable`. Neither component needs to know filtering exists. This directly satisfies "filter affects gráficos e tabela igualmente" without touching chart internals.

**4. The existing `DataTableTextFilter` in `AllResponsesTable` is left as-is**, operating on the rows built from `filteredResponses`. It stays a fast, single-field refinement layered on top of the group filter, not a replacement for it. Column-level `DataTableFacetedFilter` is not introduced as part of this change — the group builder is the primary filtering UI.

**5. CSV export path (`handleExport` / `exportSubmissions` / `ExportPublishedFormDataQuery`) is untouched.** It has its own full, uncapped fetch already (capped at 20k rows for export, a separate pre-existing limit) and deliberately ignores `FilterState`.

**6. Filter builder is a staged (draft) editor behind a popover, not an always-visible/instant-apply panel.**
Initial implementation rendered the builder inline (always taking layout space) and applied every edit immediately via `useState`. Manual testing showed this was disruptive: the owner wants to explore the currently visible data, then build a filter, then commit to it — not have every keystroke reshuffle the screen. Revised to two pieces of state: `draftFilterState` (edited live inside a `Popover`, closed by default) and `appliedFilterState` (what `applyFilters` actually uses, and what the chart/table render). "Aplicar filtros" commits `draft → applied` and closes the popover; "Limpar filtros" resets both to empty. The "Filtros" trigger button shows a badge with the applied condition count so the active filter stays visible even while the popover is closed.

Initial version of this decision also resynced `draftFilterState` from `appliedFilterState` every time the popover opened, to avoid a stale abandoned draft resurfacing. Manual testing showed this backfired: closing the popover (outside click/Escape) without clicking "Aplicar filtros" silently discarded whatever the owner had built so far, since the next open overwrote it with the last applied state — read by the owner as "the system loses my filters." Removed that resync entirely: `draftFilterState` now changes only via direct builder edits, "Aplicar filtros", or "Limpar filtros" — merely opening/closing the popover never touches it. Closing without applying is now a true no-op: the previously applied filter (if any) keeps governing the view, and any unapplied draft edits are preserved for next time the owner reopens the builder, not discarded.

**7. Removing the 500 cap is a deletion, not a re-architecture:**
- Frontend: delete `DASHBOARD_SUBMISSIONS_LIMIT`, `exceedsLimit`, and the associated banner in `index.tsx`; delete `MAX_ROWS` truncation in `AnswersTable.tsx`.
- Backend: `GetFormSubmissionsUseCase` stops defaulting `limit` to 500 — when the controller doesn't pass a limit, `GetFormSubmissionsQuery.execute` takes the `!options?.limit` branch and calls `submissionRepository.findByFormId` (already unpaginated, no limit) instead of `findByFormIdPaginated`. No change needed to the repository layer itself.

## Risks / Trade-offs

- **[Risk] Removing the 500 cap means the browser now receives and filters the entire submission set in memory for large forms.** → Accepted per explicit product decision; out of scope for this change. Flagged here only so it isn't rediscovered as a surprise later.
- **[Risk] The backend N+1 per-submission answer fetch (`Promise.all` over `AnswerRepository.findBySubmissionId`) now runs for the full submission count instead of at most 500, which could slow down or throttle on large forms.** → Same as above: explicitly out of scope; not mitigated by this change.
- **[Risk] Two filtering layers (group builder + free-text table filter) could confuse users about why a row is hidden.** → Mitigation: free-text filter stays visually and functionally scoped to the table view only, clearly secondary to the group builder which is the single control that also affects charts.
- **[Trade-off] DNF-only (no nested groups) cannot express some boolean combinations** (e.g. `A AND (B OR C)` without duplicating a group). → Accepted: matches the explicit "grupos simples" decision; can be revisited later if a real use case needs deeper nesting.

## Migration Plan

No data migration. This is a pure frontend + one backend default-value change, deployed together:
1. Ship backend change removing the default 500 `limit` in `GetFormSubmissionsUseCase`.
2. Ship frontend change (filter builder + cap removal) once the backend returns the full set.
Rollback is a straight revert of both changes; no persisted state or schema is affected.

## Open Questions

None outstanding — all product decisions (client-side filtering, DNF group model, filter affects both views, text filter stays complementary, export stays unfiltered) were confirmed during exploration.
