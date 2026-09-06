## ADDED Requirements

### Requirement: Public endpoint exposes metadata of a published form
The system SHALL expose a public, unauthenticated endpoint `GET /portal/datasets/{formId}` that returns the form's metadata and its questions (dataset columns) when the form is published.

#### Scenario: Fetching a published dataset's metadata
- **WHEN** a client requests `GET /portal/datasets/{formId}` for a form with `isPublished: true`
- **THEN** the system responds with the form's metadata and its list of questions

#### Scenario: Fetching an unpublished dataset's metadata
- **WHEN** a client requests `GET /portal/datasets/{formId}` for a form with `isPublished: false`
- **THEN** the system responds with a 404 Not Found

#### Scenario: Fetching a non-existent dataset
- **WHEN** a client requests `GET /portal/datasets/{formId}` for a formId that does not exist
- **THEN** the system responds with a 404 Not Found

### Requirement: Public endpoint exposes paginated data of a published form
The system SHALL expose a public, unauthenticated endpoint `GET /portal/datasets/{formId}/data` that returns paginated submission rows (submission + answers) for a published form, accepting `cursor` and `limit` query parameters and returning a cursor for the next page when more data is available.

#### Scenario: First page of data
- **WHEN** a client requests `GET /portal/datasets/{formId}/data?limit=20` for a published form with more than 20 submissions
- **THEN** the system responds with 20 rows and a cursor to fetch the next page

#### Scenario: Subsequent page of data
- **WHEN** a client requests `GET /portal/datasets/{formId}/data` with a `cursor` obtained from a previous response
- **THEN** the system responds with the next set of rows continuing after that cursor

#### Scenario: Data endpoint for unpublished form
- **WHEN** a client requests `GET /portal/datasets/{formId}/data` for a form with `isPublished: false`
- **THEN** the system responds with a 404 Not Found

### Requirement: Public data response excludes sensitive submission fields
The paginated data response SHALL NOT include the submission's `ip` or `userAgent` fields, regardless of whether those fields exist on the internal `FormSubmission` entity.

#### Scenario: Sensitive fields are absent
- **WHEN** a client requests `GET /portal/datasets/{formId}/data` for a published form
- **THEN** none of the returned rows contain an `ip` or `userAgent` field

### Requirement: Public data response excludes file-type answers
Answers to questions of type `FILE` SHALL be omitted from the public paginated data response.

#### Scenario: Form with a file question
- **WHEN** a published form includes a question of type `FILE` and a client requests its paginated data
- **THEN** the returned rows do not include an answer value for that question
