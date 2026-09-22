## ADDED Requirements

### Requirement: Dataset detail page offers a CSV download
The portal dataset detail page SHALL provide a button that downloads the currently viewed published dataset's full row data as a CSV file.

#### Scenario: Visitor downloads a dataset's CSV
- **WHEN** a visitor on a published dataset's detail page clicks the "Baixar CSV" button
- **THEN** the browser downloads a `.csv` file containing all of the dataset's submission rows, with one column per non-file question (matching the on-screen table's columns and order) plus a submission-date column

#### Scenario: CSV values match on-screen anonymization
- **WHEN** a dataset's answers are subject to anonymization for portal display
- **THEN** the exported CSV contains the same anonymized values shown in the on-screen table, not the raw underlying answers

### Requirement: CSV export API endpoint
The system SHALL expose a public endpoint `GET /portal/datasets/{formId}/export` that returns the full row data of a published dataset as a `text/csv` response with a `Content-Disposition: attachment` header.

#### Scenario: Export of a published dataset
- **WHEN** a client requests `GET /portal/datasets/{formId}/export` for a published form
- **THEN** the response has `Content-Type: text/csv` and a body containing a header row followed by one row per submission, covering all pages of data (not just the first page)

#### Scenario: Export of a non-existent or unpublished dataset
- **WHEN** a client requests `GET /portal/datasets/{formId}/export` for a form that does not exist or is not published
- **THEN** the system returns a not-found error and no CSV is generated

#### Scenario: Export respects a maximum row cap
- **WHEN** a published dataset has more submission rows than the system's configured export cap
- **THEN** the exported CSV contains rows up to that cap rather than failing or timing out

### Requirement: CSV export increments a download count
The system SHALL increment a persistent `downloadCount` counter on a `Form` each time its CSV is successfully exported via `GET /portal/datasets/{formId}/export`.

#### Scenario: First export of a dataset with no prior downloads
- **WHEN** a client successfully requests `GET /portal/datasets/{formId}/export` for a published form that has never been exported
- **THEN** the form's `downloadCount` is set to `1`

#### Scenario: Repeated exports accumulate
- **WHEN** a client successfully requests `GET /portal/datasets/{formId}/export` for a published form whose current `downloadCount` is `N`
- **THEN** the form's `downloadCount` becomes `N + 1`

#### Scenario: Unpublished or missing dataset export is not counted
- **WHEN** `GET /portal/datasets/{formId}/export` is requested for a form that does not exist or has `isPublished = false`
- **THEN** the request returns a not-found error and `downloadCount` is not incremented
