## MODIFIED Requirements

### Requirement: API-key-gated read of published dataset rows, anonymized
`GET /v1/portal/datasets/{formId}/data` SHALL require the `portal:read` scope and SHALL only ever return rows for forms where `isPublished` is `true`, mirroring the public `GET /portal/datasets/{formId}/data` endpoint's data rules exactly (same underlying query, same anonymization), differing only in requiring an API key and in its page-size ceiling.

#### Scenario: Published form, authorized key
- **WHEN** a request carries a key with `portal:read` scope and `{formId}` refers to a form with `isPublished === true`
- **THEN** the response returns a page of submission rows

#### Scenario: Unpublished or unknown form
- **WHEN** `{formId}` does not exist, or exists but `isPublished` is `false`
- **THEN** the response is a not-found error, regardless of which account the key belongs to

#### Scenario: PII anonymized per question strategy
- **WHEN** a returned row includes an answer to a question with a `piiStrategy` set (or an `anonymizationSuggestion.needsAnonymization`)
- **THEN** the answer value is pseudonymized, generalized, or suppressed per `AnonymizationEngine.resolve`, never returned raw

### Requirement: Response includes the form's question definitions
`GET /v1/portal/datasets/{formId}/data` SHALL include a `questions` array alongside `rows` in every response, so a caller can interpret each row's `answers[].questionId` without a separate call. The `questions` SHALL be the form's full question set (mirroring the public `GET /portal/datasets/{formId}` metadata endpoint's question list), each with its `anonymizationSuggestion` field omitted, since that field is an internal hint about which answers need anonymizing and not meant for external consumers.

#### Scenario: Response carries question definitions alongside rows
- **WHEN** a request carries a key with `portal:read` scope and `{formId}` refers to a published form
- **THEN** the response body includes `questions` (the form's questions, each without `anonymizationSuggestion`) in addition to `rows` and `nextCursor`

#### Scenario: Question list is stable across pages
- **WHEN** a caller pages through a dataset's rows using `cursor`
- **THEN** each page's `questions` array reflects the same underlying form question set, independent of pagination

### Requirement: Cursor-based pagination up to 1000 rows per page
The endpoint SHALL support the same opaque cursor pagination mechanism as the public portal endpoint (DynamoDB `LastEvaluatedKey` encoded as a cursor), but SHALL allow a page size (`limit`) of up to 1000 rows, instead of the public portal's 100-row ceiling.

#### Scenario: Default page size
- **WHEN** a request omits `limit`
- **THEN** the response uses a sensible default (consistent with the public portal's default) and includes a `nextCursor` when more rows exist

#### Scenario: Requested page size exceeds the ceiling
- **WHEN** a request passes `limit=5000`
- **THEN** the response is capped at 1000 rows and does not error

#### Scenario: Following the cursor
- **WHEN** a request passes the `nextCursor` from a previous page
- **THEN** the response continues from where the previous page left off, with no duplicated or skipped rows
