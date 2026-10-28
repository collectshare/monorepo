## ADDED Requirements

### Requirement: Unpaginated reads are complete
Repository reads that return all items of a key SHALL follow `LastEvaluatedKey` until exhausted.

#### Scenario: Form with more than 1 MB of questions
- **WHEN** a form's questions exceed one DynamoDB page
- **THEN** every question is returned

### Requirement: Pagination input is validated
`limit` SHALL be an integer between 1 and the route maximum, and `cursor` SHALL decode to a key of the requested form's submissions. Invalid values SHALL return 400.

#### Scenario: Malformed cursor
- **WHEN** a client sends `cursor=abc`
- **THEN** the response is 400 `VALIDATION`

#### Scenario: Cursor from another form
- **WHEN** a client sends a cursor whose `PK` belongs to another form
- **THEN** the response is 400 `VALIDATION`

#### Scenario: Negative limit
- **WHEN** a client sends `limit=-5` or `limit=1.5`
- **THEN** the response is 400 `VALIDATION`

### Requirement: Answer reads are bounded
Loading answers for many submissions SHALL run with bounded concurrency, and the MCP `get_form_submissions` tool SHALL apply its limit in the database query.

#### Scenario: MCP asks for 10 submissions
- **WHEN** `get_form_submissions` is called with `limit: 10` on a form with 5 000 submissions
- **THEN** only 10 submissions and their answers are read
