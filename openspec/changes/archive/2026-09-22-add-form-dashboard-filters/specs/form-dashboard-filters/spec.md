## ADDED Requirements

### Requirement: Full submission set is loaded for the dashboard
FormDashboard SHALL fetch and render the entire set of submissions for a form, with no upper cap on the number of submissions retrieved or displayed.

#### Scenario: Form with more than 500 submissions
- **WHEN** the owner opens the dashboard for a form that has more than 500 submissions
- **THEN** the dashboard fetches and makes all submissions available to the chart view and the "all responses" table view, with no "showing only the first 500" banner shown

#### Scenario: Backend request without an explicit limit
- **WHEN** the submissions endpoint is called without a `limit` parameter
- **THEN** the backend returns every submission for the form instead of defaulting to 500

### Requirement: Conditional filter builder combines conditions across questions
FormDashboard SHALL provide a filter builder that lets the owner define one or more groups of conditions, where conditions within a group are combined with AND and groups are combined with OR (disjunctive normal form), evaluated per submission.

#### Scenario: Single group, multiple conditions (AND)
- **WHEN** the owner adds a group with a condition "rating question equals 5 stars" and a condition "experience question is one of ['Sim']"
- **THEN** only submissions that satisfy both conditions are shown

#### Scenario: Multiple groups (OR)
- **WHEN** the owner adds a second group with a different condition
- **THEN** a submission is shown if it satisfies all conditions in at least one of the groups, even if it fails the other group entirely

#### Scenario: No filter defined
- **WHEN** no filter groups have been added
- **THEN** all fetched submissions are shown, unchanged from current behavior

### Requirement: Filter operators are scoped to question type
The filter builder SHALL only offer operators that are valid for a given question's type, and SHALL NOT allow filtering on FILE-type questions.

#### Scenario: STARS question
- **WHEN** the owner picks a STARS question in a condition
- **THEN** the available operators are "equals", "at least", and "at most", applied to the numeric star value

#### Scenario: MULTIPLE_CHOICE or DROPDOWN question
- **WHEN** the owner picks a MULTIPLE_CHOICE or DROPDOWN question in a condition
- **THEN** the condition matches submissions whose answer is one of the selected option values

#### Scenario: CHECKBOX question
- **WHEN** the owner picks a CHECKBOX question in a condition
- **THEN** the owner may choose "contains any of" or "contains all of" the selected options, matched against the answer's array of values

#### Scenario: TEXT question
- **WHEN** the owner picks a TEXT question in a condition
- **THEN** the condition matches submissions whose answer contains the given text, case-insensitively

#### Scenario: FILE question
- **WHEN** the owner opens the question picker in the filter builder
- **THEN** FILE-type questions are not offered as filterable questions

### Requirement: Filter applies uniformly to chart and table views
The active filter SHALL be applied to the full submission set once, before it is distributed to both the chart view and the "all responses" table view of FormDashboard, so both views reflect the same filtered subset.

#### Scenario: Filter active in chart view
- **WHEN** a filter is active and the owner is viewing the chart view
- **THEN** each question's chart (counts, star distribution, etc.) is computed only from submissions matching the active filter

#### Scenario: Filter active in table view
- **WHEN** a filter is active and the owner switches to the "all responses" table view
- **THEN** the table shows only rows for submissions matching the active filter

#### Scenario: Free-text table search on top of the filter
- **WHEN** a filter is active and the owner also types in the table's free-text search box
- **THEN** the table shows only rows that match both the active filter and the free-text search

### Requirement: CSV export ignores the dashboard filter
Exporting submissions to CSV SHALL always include every submission for the form, regardless of any filter currently active on the dashboard.

#### Scenario: Export with an active filter
- **WHEN** the owner has an active filter narrowing the visible submissions and clicks "Exportar CSV"
- **THEN** the exported CSV contains all of the form's submissions, not just the ones matching the active filter

### Requirement: Filter edits are staged until explicitly applied
Editing groups or conditions in the filter builder SHALL NOT change what the chart and table views show until the owner explicitly applies the edited filter. This lets the owner explore the currently visible data before committing to a new filter.

#### Scenario: Editing without applying
- **WHEN** the owner adds, edits, or removes a condition or group in the filter builder
- **THEN** the chart and table views keep showing the results of the previously applied filter, unchanged

#### Scenario: Explicit apply
- **WHEN** the owner clicks "Aplicar filtros"
- **THEN** the edited filter becomes the active filter, the chart and table views update to reflect it, and the filter builder closes

#### Scenario: Closing without applying preserves the active filter
- **WHEN** the owner closes the filter builder (clicking outside, pressing Escape, or toggling the "Filtros" trigger) without clicking "Aplicar filtros"
- **THEN** the previously applied filter (if any) keeps governing the chart and table views, unchanged

#### Scenario: Closing without applying preserves in-progress edits
- **WHEN** the owner has unapplied edits in the builder (added/changed groups or conditions) and closes it without clicking "Aplicar filtros"
- **THEN** reopening the builder later shows those edits exactly as left, not reverted to the currently applied filter

#### Scenario: Clearing filters
- **WHEN** the owner clicks "Limpar filtros"
- **THEN** both the filter builder and the active filter are reset to no groups, and the chart/table views immediately show all submissions

### Requirement: Filter builder does not permanently occupy dashboard layout space
The filter builder SHALL be hidden by default behind a dedicated "Filtros" control and only shown on demand, rather than being permanently rendered inline in the page layout.

#### Scenario: Default collapsed
- **WHEN** the owner opens the dashboard
- **THEN** the filter builder is not visible until the owner opens it via the "Filtros" control

#### Scenario: Active filter indicator
- **WHEN** a filter is currently applied
- **THEN** the "Filtros" control shows a count of the active conditions, visible even while the builder itself is closed
