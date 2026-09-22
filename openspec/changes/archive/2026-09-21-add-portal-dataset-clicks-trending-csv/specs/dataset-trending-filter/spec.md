## ADDED Requirements

### Requirement: Portal search supports a trending sort
The system SHALL allow portal search requests to request results ordered by dataset click count (most-clicked first) instead of the default relevance ranking, via a `sort` query parameter on `GET /portal/search`.

#### Scenario: Default search remains relevance-ranked
- **WHEN** a visitor calls `GET /portal/search?q=<query>` without a `sort` parameter
- **THEN** results are returned ranked by search relevance, as today

#### Scenario: Trending sort orders by click count descending
- **WHEN** a visitor calls `GET /portal/search?q=<query>&sort=trending`
- **THEN** results matching the query are returned ordered by `clickCount` descending

#### Scenario: Trending sort with empty query lists most-clicked datasets
- **WHEN** a visitor calls `GET /portal/search?sort=trending` with no `q` value
- **THEN** all published datasets are returned ordered by `clickCount` descending

### Requirement: Portal Home page exposes a trending filter control
The portal Home (search) page SHALL provide a UI control letting visitors switch between the default relevance-ordered results and trending (most-clicked) results, applying to the current search query.

#### Scenario: Visitor switches to trending
- **WHEN** a visitor selects the "trending" option on the search page
- **THEN** the displayed dataset results are re-fetched and re-rendered ordered by click count descending, for the current search query (including an empty query)

#### Scenario: Visitor switches back to default
- **WHEN** a visitor with the trending option selected switches back to the default option
- **THEN** the displayed dataset results are re-fetched and re-rendered ranked by relevance
