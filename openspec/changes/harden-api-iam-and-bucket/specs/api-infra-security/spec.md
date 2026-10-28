## ADDED Requirements

### Requirement: Main bucket is private and encrypted
The main bucket SHALL block all public access and declare server-side encryption.

#### Scenario: Stack deployed
- **WHEN** the API stack is deployed
- **THEN** the bucket has all four public access block settings enabled and SSE configured

### Requirement: Public functions have least privilege
Functions behind unauthenticated routes SHALL NOT have permission to delete items, batch write, administer Cognito users, and SHALL NOT receive secrets they do not use.

#### Scenario: Portal function environment
- **WHEN** inspecting the deployed `GET /portal/search` function
- **THEN** its environment has no `MASTER_SECRET`, `COGNITO_CLIENT_SECRET` or Algolia admin key, and its role cannot call `dynamodb:DeleteItem`
