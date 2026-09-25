## ADDED Requirements

### Requirement: API-key-gated listing of the key owner's own forms
`GET /v1/forms` SHALL require the `data:read` scope and SHALL return all forms owned by the API key's account (`accountId`), using the same `ListFormsUseCase` as the internal, Cognito-authenticated `GET /forms` endpoint. The response SHALL be the full `Form` entity for each form, unfiltered.

#### Scenario: Authorized key lists its own forms
- **WHEN** a request carries a key with `data:read` scope
- **THEN** the response returns all forms owned by that key's `accountId`, regardless of each form's `isPublished` status

#### Scenario: Key without `data:read` scope
- **WHEN** a request carries a key whose scopes do not include `data:read`
- **THEN** the response is an unauthorized error and no forms are returned

#### Scenario: Account with no forms
- **WHEN** the key's account owns no forms
- **THEN** the response returns an empty list, not an error
