## ADDED Requirements

### Requirement: Every form is published
The system SHALL treat every existing form as published on the open-data portal. No form-level field SHALL be able to opt out.

#### Scenario: Portal reads any form
- **WHEN** a client calls `GET /portal/datasets/{formId}`, `/data`, `/export` or `GET /v1/portal/datasets/{formId}/data` for an existing form
- **THEN** the system serves it, applying the anonymization of each question

#### Scenario: Unknown form
- **WHEN** the `formId` does not exist
- **THEN** the system returns not found

#### Scenario: Search index
- **WHEN** a `Form` item is inserted or modified
- **THEN** `onFormChanged` upserts it into the Algolia index

### Requirement: Every form is anonymous
The system SHALL NOT store the respondent's IP address or user agent with a submission.

#### Scenario: Submission
- **WHEN** a respondent submits any form
- **THEN** the stored submission has `ip = null` and `userAgent = null`

### Requirement: No anonymity or publication controls
The web form details modal SHALL NOT show anonymity or publication controls. The form entity, the create and update APIs (Cognito, `/v1`, MCP) and their responses SHALL NOT expose `isAnonymous` or `isPublished`.

#### Scenario: Modal opened
- **WHEN** the owner opens the form details modal
- **THEN** no "Anonimizar as respostas" or "Publicar no portal de dados abertos" switch is shown

#### Scenario: Legacy client sends the flags
- **WHEN** a `/v1`, MCP or web client sends `isAnonymous` or `isPublished` on create or update
- **THEN** the request succeeds and the flags are ignored

#### Scenario: Form returned by the API
- **WHEN** any API returns a form
- **THEN** the payload has no `isAnonymous` or `isPublished` field
