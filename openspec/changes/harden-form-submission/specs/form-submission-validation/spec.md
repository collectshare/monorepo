## ADDED Requirements

### Requirement: Answers must belong to the form
The system SHALL reject a submission whose answers reference a `questionId` that is not a question of the submitted form, or that repeat a `questionId`.

#### Scenario: Foreign question id
- **WHEN** a respondent submits an answer with a `questionId` that belongs to another form
- **THEN** the system responds 400 and stores nothing

#### Scenario: Duplicate question id
- **WHEN** the `answers` array contains two items with the same `questionId`
- **THEN** the system responds 400 instead of failing the transaction with 500

### Requirement: Answer value matches the question type
The system SHALL accept only values compatible with the question: a string for TEXT, one of `options` for MULTIPLE_CHOICE and DROPDOWN, a subset of `options` for CHECKBOX, an integer between 1 and `max` for STARS, and a file object for FILE.

#### Scenario: Option outside the list
- **WHEN** a DROPDOWN answer is not one of the question's `options`
- **THEN** the system responds 400

#### Scenario: Checkbox keeps its array
- **WHEN** a CHECKBOX answer is `["A", "B, C"]`
- **THEN** the stored value is the array `["A", "B, C"]`, not the string `"A,B, C"`

#### Scenario: String sent to a FILE question
- **WHEN** a FILE answer is a string
- **THEN** the system responds 400 and does not store it

### Requirement: Empty answers do not satisfy required questions
The system SHALL treat `''`, whitespace-only strings and empty arrays as missing answers.

#### Scenario: Required question answered with empty string
- **WHEN** a required question receives `value: ''`
- **THEN** the system responds with the missing-required-answers error

#### Scenario: Form with only optional questions
- **WHEN** every question is optional and `answers` is empty
- **THEN** the system stores the submission

### Requirement: Uploaded files are stored under a safe key
The system SHALL store an uploaded file under `forms/{formId}/submissions/{submissionId}/{questionId}/{name}` where `name` is a sanitized basename, and SHALL reject files larger than the configured limit.

#### Scenario: Path traversal in the file name
- **WHEN** a file named `../../x.pdf` is uploaded
- **THEN** the stored key ends with `/x.pdf` inside the submission prefix

### Requirement: Only keys from the form are signed
When returning FILE answers to the owner, the system SHALL generate a signed URL only for keys starting with `forms/{formId}/submissions/`; other values SHALL be returned as `null`.

#### Scenario: Forged key in legacy data
- **WHEN** a stored FILE answer is `forms/<otherFormId>/submissions/.../file.pdf`
- **THEN** the owner's submissions response contains `null` for that answer

### Requirement: File links are safe in the dashboard
The web dashboard SHALL render FILE answers as links only when the URL is `http:` or `https:`.

#### Scenario: javascript URL
- **WHEN** a FILE answer value is `javascript:alert(1)`
- **THEN** the dashboard renders it as plain text, not as a link
