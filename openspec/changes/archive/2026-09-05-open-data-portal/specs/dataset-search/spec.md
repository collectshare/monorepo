## ADDED Requirements

### Requirement: Published form metadata is synced to the search index
When a `Form` item is created or modified and its `isPublished` attribute is `true`, the system SHALL upsert a corresponding record into the Algolia search index containing `objectID` (the form id), `title`, `description`, `tags`, `submissionCount`, `accountName`, and `createdAt`.

#### Scenario: Newly published form appears in the index
- **WHEN** a form is created or updated with `isPublished: true`
- **THEN** a record with `objectID` equal to the form id exists in the Algolia index with the form's current title, description, tags, submission count, account name, and creation date

#### Scenario: Metadata update is reflected in the index
- **WHEN** a published form's title, description, or tags are updated
- **THEN** the corresponding Algolia record is updated to match

### Requirement: Unpublished form is removed from the search index
When a `Form` item is modified and its `isPublished` attribute is `false`, the system SHALL remove the corresponding record from the Algolia search index.

#### Scenario: Form is unpublished
- **WHEN** a previously published form has `isPublished` set to `false`
- **THEN** the record with that form's id no longer exists in the Algolia index

### Requirement: Sync is driven by the DynamoDB stream, not by form write paths
The synchronization to Algolia SHALL happen as an asynchronous reaction to `INSERT`/`MODIFY` events on `Form` items in the main DynamoDB table stream, not as a direct call from the form create/update use cases.

#### Scenario: Stream event for a non-Form item is ignored
- **WHEN** a DynamoDB stream record has `type` other than `Form`
- **THEN** the sync handler does not call the Algolia gateway

### Requirement: Dataset search is proxied through a public backend endpoint
The system SHALL expose a public, unauthenticated endpoint (`GET /portal/search`) that accepts a search query and returns matching records from the Algolia index. The Algolia application ID and API key SHALL NOT be exposed to, or callable directly from, any browser client.

#### Scenario: Searching via the public endpoint
- **WHEN** a client requests `GET /portal/search?q=<keyword>` matching a published dataset's title or tag
- **THEN** the system responds with the matching dataset records (title, description, tags, submission count, author)

#### Scenario: No Algolia credentials reach the client
- **WHEN** the portal frontend performs a search
- **THEN** it only calls the backend search endpoint; no Algolia application ID or API key is present in the frontend bundle or in any request the browser sends directly to Algolia
