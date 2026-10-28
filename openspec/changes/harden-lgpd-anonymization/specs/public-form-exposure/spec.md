## ADDED Requirements

### Requirement: Public form route hides internal fields
`GET /forms/{formId}` and the MCP `get_form` tool SHALL NOT return `accountId`, `anonymizationSuggestion`, `piiStrategy` or `generalizationConfig`.

#### Scenario: Anonymous visitor loads a form
- **WHEN** an unauthenticated client calls `GET /forms/{formId}`
- **THEN** the response contains the form and its questions without those fields

### Requirement: Owner reads the full question configuration privately
The system SHALL expose `GET /forms/{formId}/questions` behind the Cognito authorizer, returning the questions with their PII fields only to the form owner.

#### Scenario: Owner opens the builder
- **WHEN** the owner opens `/forms/builder/:id`
- **THEN** the builder loads `piiStrategy`, `generalizationConfig` and `anonymizationSuggestion` from the private route

#### Scenario: Another account
- **WHEN** a different logged-in account calls the route
- **THEN** the system responds with the not-allowed error

### Requirement: Third-party dataset reads exclude FILE questions
`GET /v1/portal/datasets/{formId}/data` SHALL exclude FILE questions and their answers, like the `/portal` routes.

#### Scenario: Form with a FILE question
- **WHEN** an integrator reads a dataset that has a FILE question
- **THEN** neither the column nor its values appear in the response
