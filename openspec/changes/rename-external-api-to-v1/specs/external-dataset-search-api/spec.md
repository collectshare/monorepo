## ADDED Requirements

### Requirement: API-key-gated search of published datasets
`GET /v1/portal/search` SHALL require the `portal:read` scope and SHALL delegate to the same `AlgoliaGateway.search` call as the public `GET /portal/search` endpoint, accepting an optional `q` query term and an optional `sort` parameter, and returning the same `results` shape (`AlgoliaGateway.DatasetRecord[]`).

#### Scenario: Authorized key searches with a query term
- **WHEN** a request carries a key with `portal:read` scope and a `q` query parameter
- **THEN** the response returns matching published dataset records from the same index the public search endpoint queries

#### Scenario: Search with no query term
- **WHEN** a request carries a key with `portal:read` scope and omits `q`
- **THEN** the search is performed with an empty query term, matching the public endpoint's default behavior

#### Scenario: Key without `portal:read` scope
- **WHEN** a request carries a key whose scopes do not include `portal:read`
- **THEN** the response is an unauthorized error and no search is performed
