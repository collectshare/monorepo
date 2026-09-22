## ADDED Requirements

### Requirement: Dataset view increments click count
The system SHALL increment a persistent `clickCount` counter on a `Form` each time its published dataset detail metadata is successfully retrieved via the public portal endpoint (`GET /portal/datasets/{formId}`).

#### Scenario: First view of a dataset with no prior clicks
- **WHEN** a visitor requests `GET /portal/datasets/{formId}` for a published form that has never been viewed
- **THEN** the form's `clickCount` is set to `1`

#### Scenario: Repeated views accumulate
- **WHEN** a visitor requests `GET /portal/datasets/{formId}` for a published form whose current `clickCount` is `N`
- **THEN** the form's `clickCount` becomes `N + 1`

#### Scenario: Unpublished or missing dataset is not counted
- **WHEN** `GET /portal/datasets/{formId}` is requested for a form that does not exist or has `isPublished = false`
- **THEN** the request returns a not-found error and `clickCount` is not incremented

#### Scenario: Click counting never fails the request
- **WHEN** the underlying `clickCount` increment write fails for any reason
- **THEN** `GET /portal/datasets/{formId}` still returns the dataset metadata successfully (the increment failure is not surfaced to the client)

### Requirement: Click count propagates to the search index
The system SHALL keep each published dataset's indexed `clickCount` in sync with the `Form` entity's persisted `clickCount` whenever the form record changes.

#### Scenario: Click increment reflected in the index
- **WHEN** a `Form`'s `clickCount` is incremented
- **THEN** the corresponding search index record for that dataset is updated to carry the new `clickCount` value
