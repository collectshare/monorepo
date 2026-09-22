## ADDED Requirements

### Requirement: Free-text answers are shown one row per submission
For a `TEXT` question on the form results dashboard, the system SHALL display one row per submission that has a non-empty answer for that question, without deduplicating by answer value and without dropping duplicate occurrences.

#### Scenario: Multiple submissions with identical text
- **WHEN** two or more submissions contain the exact same free-text answer for a `TEXT` question
- **THEN** the dashboard displays a separate row for each submission's answer, not a single collapsed row

#### Scenario: Text question with no responses
- **WHEN** a `TEXT` question has no submissions with a non-empty answer
- **THEN** the dashboard shows the standard empty state for the answers table

### Requirement: File-upload answers are shown as a downloadable list, not a chart
For a `FILE` question on the form results dashboard, the system SHALL display one row per submission that has a non-empty answer for that question, rendered as a table with a download link, instead of a bar/pie chart.

#### Scenario: Multiple file submissions
- **WHEN** a `FILE` question has multiple submissions, each with a distinct file
- **THEN** the dashboard displays a table with one row per submission, each row offering a download link for that submission's file, and no bar chart is rendered for this question

#### Scenario: File question with no responses
- **WHEN** a `FILE` question has no submissions with a non-empty answer
- **THEN** the dashboard shows the standard empty state for the answers table

### Requirement: Answers table supports search and pagination
The per-submission answers table used for `TEXT` and `FILE` questions SHALL support text search/filtering and paginate results, consistent with other data tables in the application.

#### Scenario: Large number of submissions
- **WHEN** a `TEXT` or `FILE` question has more submissions than fit on one page
- **THEN** the dashboard paginates the answers table and allows navigating between pages

#### Scenario: Filtering answers
- **WHEN** a user types into the answers table's search input
- **THEN** the table filters displayed rows to those matching the search text

### Requirement: Aggregated chart question types are unaffected
Question types other than `TEXT` and `FILE` (`CHECKBOX`, `MULTIPLE_CHOICE`, `DROPDOWN`, `STARS`) SHALL continue to render as aggregated, deduplicated-by-value bar/pie/star charts, unchanged by this capability.

#### Scenario: Multiple-choice question rendering unchanged
- **WHEN** a `CHECKBOX`, `MULTIPLE_CHOICE`, `DROPDOWN`, or `STARS` question is displayed on the dashboard
- **THEN** it renders as an aggregated chart counting occurrences per distinct value, exactly as before this change
