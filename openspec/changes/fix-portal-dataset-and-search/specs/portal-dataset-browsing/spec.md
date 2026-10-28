## ADDED Requirements

### Requirement: Dataset table shows every loaded row
The dataset page SHALL render every row returned by the API, including rows appended by "Carregar mais".

#### Scenario: Load more
- **WHEN** a visitor opens a dataset with 45 rows and clicks "Carregar mais" until it disappears
- **THEN** the table shows 45 rows

### Requirement: Search reports failures
The dataset search SHALL show an error state with a retry action when the request fails, and SHALL NOT stay loading.

#### Scenario: API down
- **WHEN** `GET /portal/search` fails
- **THEN** the Home shows an error message and a "tentar de novo" button

### Requirement: Unknown routes and render errors are handled
The portal SHALL render a not-found page for unknown paths, a loading fallback for lazy routes, and an error page when a route crashes.

#### Scenario: Unknown path
- **WHEN** a visitor opens `/nao-existe`
- **THEN** the portal shows a not-found page with a link to the search
