## ADDED Requirements

### Requirement: Form edits do not overwrite counters
Updating a form's details SHALL change only the editable fields and SHALL fail if the form does not exist. Counter increments SHALL NOT create items for missing forms.

#### Scenario: Edit during submissions
- **WHEN** the owner saves form details while a submission is being stored
- **THEN** `submissionCount` includes that submission

#### Scenario: Click on a deleted form
- **WHEN** a click is recorded for a `formId` that no longer exists
- **THEN** no `FORM#` item is created

### Requirement: Submission count is exact
The submission count SHALL be incremented in the same transaction that stores the submission.

#### Scenario: Retry
- **WHEN** any part of the submission transaction fails
- **THEN** neither the submission nor the increment is stored

### Requirement: Stream failures are retried
A stream consumer SHALL process records in order and report the failed record and every later record of the batch as failures so they are retried.

#### Scenario: Algolia unavailable
- **WHEN** the Algolia upsert fails for a `Form` MODIFY
- **THEN** the record is retried and the error message and stack are logged

### Requirement: Saving questions never loses existing questions
Replacing a form's questions SHALL store the new set before deleting removed questions, retry unprocessed batch items, and reject duplicate or empty question ids and choice questions without options.

#### Scenario: Classifier timeout
- **WHEN** classification throws while saving questions
- **THEN** the previous questions are still stored

#### Scenario: Duplicate ids
- **WHEN** the request has two questions with the same `id`
- **THEN** the system responds 400

### Requirement: Optional attributes are omitted
Items with undefined optional attributes SHALL be written without those attributes instead of failing.

#### Scenario: Form without tags
- **WHEN** a form is created without `tags`
- **THEN** the item is stored without a `tags` attribute
