## ADDED Requirements

### Requirement: Answer text never becomes markup
Charts SHALL NOT use answer or option text as CSS identifiers or inject it into style or HTML.

#### Scenario: Malicious option text
- **WHEN** an answer value is `x;}</style><img src=x onerror=alert(1)>`
- **THEN** the chart renders it as label text and no script runs

### Requirement: Filters and sorting behave as labeled
An empty "contains all" filter SHALL be inactive, and the forms table SHALL sort by creation date.

#### Scenario: Empty containsAll
- **WHEN** the owner adds a "contains all" filter with no option selected
- **THEN** all rows are shown and the filter is not counted as active

#### Scenario: Sort by date
- **WHEN** the owner sorts My forms by date
- **THEN** rows are ordered by `createdAt`
