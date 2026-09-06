## ADDED Requirements

### Requirement: Form has a publication state
Every `Form` SHALL have an `isPublished: boolean` attribute controlling whether it is eligible for public discovery and public data access. The default for newly created forms SHALL be `true` (opt-out model).

#### Scenario: New form defaults to published
- **WHEN** an account creates a new form without specifying `isPublished`
- **THEN** the created form has `isPublished` set to `true`

#### Scenario: Existing form without the attribute is treated as published
- **WHEN** a `Form` item stored before this change is read and has no `isPublished` attribute
- **THEN** the system treats it as `isPublished = true`

### Requirement: Form owner can toggle publication state
The form owner SHALL be able to change `isPublished` through the existing form update flow.

#### Scenario: Owner unpublishes a form
- **WHEN** the form owner sends `PATCH`/`POST /forms/{formId}` with `isPublished: false`
- **THEN** the form's `isPublished` attribute is persisted as `false`

#### Scenario: Owner republishes a form
- **WHEN** the form owner sends `POST /forms/{formId}` with `isPublished: true` for a previously unpublished form
- **THEN** the form's `isPublished` attribute is persisted as `true`

#### Scenario: Non-owner cannot change publication state
- **WHEN** an account that does not own the form attempts to update `isPublished` for that form
- **THEN** the system rejects the request the same way it rejects any other unauthorized form update
