## ADDED Requirements

### Requirement: Public portal app requires no authentication
The `apps/portal` application SHALL be entirely public: no route SHALL require login or an access token.

#### Scenario: Visiting any portal route without a session
- **WHEN** a visitor with no stored access token opens any route in `apps/portal`
- **THEN** the page renders normally without redirecting to a login flow

### Requirement: Home page provides semantic dataset search
The portal's Home page SHALL let visitors search published datasets by keyword by querying the backend's public search endpoint (`GET /portal/search`, which proxies to the Algolia index — see the `dataset-search` capability), and SHALL display each result as a card showing title, description, tags, submission count, and author. The Home page SHALL NOT call Algolia directly from the browser.

#### Scenario: Searching for a dataset by title
- **WHEN** a visitor types a keyword matching a published dataset's title into the search box
- **THEN** a result card for that dataset appears, showing its title, description, tags, submission count, and author

#### Scenario: Searching for a dataset by tag
- **WHEN** a visitor types a keyword matching a published dataset's tag
- **THEN** a result card for that dataset appears in the results

### Requirement: Dataset page shows metadata and paginated raw data
The portal's Dataset page (`/dataset/:formId` or equivalent) SHALL display the dataset's metadata (from `GET /portal/datasets/{formId}`) and a paginated table of its raw rows (from `GET /portal/datasets/{formId}/data`), loading additional pages on demand.

#### Scenario: Opening a dataset page
- **WHEN** a visitor opens the Dataset page for a published form
- **THEN** the page shows the form's title/description and a table with its first page of data rows

#### Scenario: Loading more rows
- **WHEN** a visitor triggers loading more data on the Dataset page and more rows are available
- **THEN** additional rows are appended to the table using the cursor returned by the previous request
