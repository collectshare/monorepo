## ADDED Requirements

### Requirement: API-key-gated read of the key owner's own submission data, raw
`GET /external/submissions/{formId}` SHALL require the `data:read` scope and SHALL only return data for forms owned by the same account as the API key (`apiKey.accountId === form.accountId`). Publication status (`isPublished`) SHALL NOT affect access — an unpublished form's data is still readable by its own account. Answer values SHALL be returned raw, without passing through `AnonymizationEngine`.

#### Scenario: Owner reads own form's data (published or not)
- **WHEN** a request carries a key with `data:read` scope, and `{formId}` refers to a form owned by that key's account
- **THEN** the response returns a page of submission rows with answer values unmodified, whether or not the form is published

#### Scenario: Key used against a form owned by a different account
- **WHEN** `{formId}` refers to a form whose `accountId` does not match the API key's `accountId`
- **THEN** the response is a not-found (or equivalent) error, regardless of the form's publication status

#### Scenario: Unknown form
- **WHEN** `{formId}` does not exist
- **THEN** the response is a not-found error

### Requirement: Cursor-based pagination up to 1000 rows per page
The endpoint SHALL support cursor-based pagination equivalent to the portal endpoints (opaque cursor for "next page", capped at 1000 rows per page), even though the underlying query previously only supported a flat `limit` with no cursor.

#### Scenario: Default page size
- **WHEN** a request omits `limit`
- **THEN** the response uses a sensible default and includes a `nextCursor` when more rows exist

#### Scenario: Requested page size exceeds the ceiling
- **WHEN** a request passes `limit=5000`
- **THEN** the response is capped at 1000 rows and does not error

#### Scenario: Following the cursor
- **WHEN** a request passes the `nextCursor` from a previous page
- **THEN** the response continues from where the previous page left off, with no duplicated or skipped rows
