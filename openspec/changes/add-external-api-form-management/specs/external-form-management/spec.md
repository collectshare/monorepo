## ADDED Requirements

### Requirement: API keys can be granted a forms:write scope
The system SHALL provide an `ApiKeyScope` value of `forms:write` that an account owner can assign to an API key at creation time, independent of the existing `portal:read` and `data:read` scopes. This is checked without needing any other scope present.

#### Scenario: Account owner creates a key with forms:write
- **WHEN** an authenticated account owner calls `POST /api-keys` with `scopes: ["forms:write"]`
- **THEN** the system creates the API key with that scope and returns it in the response

#### Scenario: Key without forms:write cannot manage forms
- **WHEN** a request to a form-management `/v1` endpoint is authenticated with an API key whose scopes do not include `forms:write`
- **THEN** the system rejects the request as not allowed and makes no change to the account's forms or questions

### Requirement: External clients can create a form via API key
The system SHALL expose `POST /v1/forms`, authenticated via `ApiKeyAuthorizer`, that creates a new form owned by the API key's account when the key has the `forms:write` scope. The accepted body and defaults SHALL match the existing form-creation rules (`title` required; `description`, `tags` optional; `isAnonymous`, `onePage`, `isPublished` boolean with the same defaults as the private creation flow).

#### Scenario: Successful external form creation
- **WHEN** a request with a valid `forms:write`-scoped API key calls `POST /v1/forms` with a valid `title`
- **THEN** the system creates a form owned by the key's account and returns `201` with the new `formId`

#### Scenario: Missing required field
- **WHEN** a request with a valid `forms:write`-scoped API key calls `POST /v1/forms` without a `title`
- **THEN** the system rejects the request with a validation error and creates no form

### Requirement: External clients can update a form's details via API key
The system SHALL expose `PUT /v1/forms/{formId}`, authenticated via `ApiKeyAuthorizer`, that replaces a form's mutable details (title, description, tags, `isAnonymous`, `onePage`, `isPublished`) when the key has the `forms:write` scope and the form belongs to the key's account.

#### Scenario: Successful external form update
- **WHEN** a request with a valid `forms:write`-scoped API key calls `PUT /v1/forms/{formId}` for a form owned by that account with a valid body
- **THEN** the system updates the form's details and returns `204`

#### Scenario: Form belongs to a different account
- **WHEN** a request with a valid `forms:write`-scoped API key calls `PUT /v1/forms/{formId}` for a form owned by a different account
- **THEN** the system rejects the request as not allowed and makes no change to the form

#### Scenario: Form does not exist
- **WHEN** a request with a valid `forms:write`-scoped API key calls `PUT /v1/forms/{formId}` for a `formId` that does not exist
- **THEN** the system returns a not-found error and makes no change

### Requirement: External clients can maintain a form's questions via API key
The system SHALL expose `PUT /v1/forms/{formId}/questions`, authenticated via `ApiKeyAuthorizer`, that replaces the full question set of a form owned by the key's account when the key has the `forms:write` scope. Questions included in the request body SHALL be created (if no matching `id`) or updated (if a matching `id` exists); existing questions on the form whose `id` is not present in the request body SHALL be deleted. Newly created or content-changed questions SHALL go through the same anonymization-suggestion classification as the private question-maintenance flow.

#### Scenario: Successful question replacement
- **WHEN** a request with a valid `forms:write`-scoped API key calls `PUT /v1/forms/{formId}/questions` for a form owned by that account with at least one question
- **THEN** the system creates/updates the submitted questions, deletes any of the form's existing questions omitted from the body, and returns `204`

#### Scenario: Empty question list rejected
- **WHEN** a request with a valid `forms:write`-scoped API key calls `PUT /v1/forms/{formId}/questions` with an empty `questions` array
- **THEN** the system rejects the request with a validation error and makes no change to the form's questions

#### Scenario: Form belongs to a different account
- **WHEN** a request with a valid `forms:write`-scoped API key calls `PUT /v1/forms/{formId}/questions` for a form owned by a different account
- **THEN** the system rejects the request as not allowed and makes no change to the form's questions
