## ADDED Requirements

### Requirement: OpenAPI document for the external API
The project SHALL maintain a single OpenAPI 3.1 document describing every `/v1/*` route, including path and query parameters, request body schemas, success response schemas, the `x-api-key` API key security scheme, the scope each operation requires, and its documented error responses (400, 401, 404, 405 as applicable).

#### Scenario: Document is valid OpenAPI
- **WHEN** the document is validated with an OpenAPI 3.1 validator
- **THEN** validation passes with no errors

#### Scenario: Operation documents its scope
- **WHEN** a developer reads any `/v1` operation in the document
- **THEN** the operation states which scope (`portal:read`, `forms:read` or `forms:write`) the API key needs

### Requirement: Spec is published as a downloadable file
The portal SHALL serve the OpenAPI document publicly, without authentication, at `/openapi.yaml`.

#### Scenario: Importing the spec by URL
- **WHEN** a client requests `GET /openapi.yaml` on the portal domain
- **THEN** it receives the OpenAPI document as YAML, importable into tools such as Postman or Insomnia

### Requirement: Swagger UI on the portal docs page
The portal `/api-docs` route SHALL remain public and SHALL render the OpenAPI document with Swagger UI, including a link to manage API keys in the web app when `VITE_WEB_APP_URL` is configured. Requests made with "Try it out" SHALL target the API base URL configured by `VITE_API_URL`.

#### Scenario: Visiting the docs page
- **WHEN** a visitor opens `/api-docs` without logging in
- **THEN** Swagger UI renders every `/v1` operation from the document

#### Scenario: Trying an endpoint
- **WHEN** a developer authorizes with a `cs_sk_…` key and executes an operation with "Try it out"
- **THEN** the request is sent to `VITE_API_URL` with the `x-api-key` header and the real response is shown

### Requirement: Spec stays in sync with declared routes
The API test suite SHALL fail when a `/v1` route declared in `sls/functions/external.yml` has no matching path and method in the OpenAPI document, or when the document describes a `/v1` path and method that is not declared.

#### Scenario: Route added without documentation
- **WHEN** a new `/v1` route is added to `external.yml` but not to the OpenAPI document
- **THEN** `pnpm --filter @monorepo/api test` fails naming the missing route

#### Scenario: Documented route removed
- **WHEN** a `/v1` route is removed from `external.yml` but left in the OpenAPI document
- **THEN** the test fails naming the stale route
